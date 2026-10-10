-- Migration: Fix Privilege Escalation & Role Security Hardening
-- Prevents unauthorized self-promotion to admin, restricts client metadata on signup,
-- and protects administrative status flags (is_suspended, is_banned, verification_status).

-- 1. HARDEN RLS POLICIES ON public.users
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. CREATE FUNCTION & TRIGGER TO PREVENT UNAUTHORIZED ROLE OR STATUS MUTATION
CREATE OR REPLACE FUNCTION public.protect_user_role_and_privileges()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_user BOOLEAN := FALSE;
  is_service_role BOOLEAN := FALSE;
BEGIN
  -- Detect if caller is service_role or superuser
  IF (auth.jwt()->>'role' = 'service_role') OR (current_user = 'postgres') THEN
    is_service_role := TRUE;
  END IF;

  -- Detect if caller is an existing verified admin
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin_user;
  END IF;

  -- INSERT GUARD
  IF TG_OP = 'INSERT' THEN
    -- If a non-admin client attempts to insert role = 'admin', force to 'user'
    IF NEW.role = 'admin' AND NOT is_service_role AND NOT is_admin_user THEN
      NEW.role := 'user';
    END IF;

    -- Unprivileged users cannot insert as suspended, banned, or verified
    IF NOT is_service_role AND NOT is_admin_user THEN
      NEW.is_suspended := FALSE;
      NEW.is_banned := FALSE;
      IF NEW.verification_status IS DISTINCT FROM 'unverified' AND NEW.verification_status IS DISTINCT FROM 'pending' THEN
        NEW.verification_status := 'unverified';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- UPDATE GUARD
  IF TG_OP = 'UPDATE' THEN
    -- Prevent unauthorized role changes
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF NOT is_service_role AND NOT is_admin_user THEN
        RAISE EXCEPTION 'Unauthorized: Modifying user roles is strictly forbidden.';
      END IF;
    END IF;

    -- Prevent modifying suspension or ban flags
    IF (NEW.is_suspended IS DISTINCT FROM OLD.is_suspended OR NEW.is_banned IS DISTINCT FROM OLD.is_banned) THEN
      IF NOT is_service_role AND NOT is_admin_user THEN
        RAISE EXCEPTION 'Unauthorized: Modifying suspension or ban status is strictly forbidden.';
      END IF;
    END IF;

    -- Prevent self-granting verified status
    IF (NEW.verification_status IS DISTINCT FROM OLD.verification_status) THEN
      IF NOT is_service_role AND NOT is_admin_user THEN
        IF NEW.verification_status = 'verified' THEN
          RAISE EXCEPTION 'Unauthorized: Self-verification is strictly forbidden.';
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS tr_protect_user_role_and_privileges ON public.users;
CREATE TRIGGER tr_protect_user_role_and_privileges
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_role_and_privileges();

-- 3. SANITIZE handle_new_user TRIGGER TO FORBID CLIENT-METADATA ADMIN PROMOTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
  safe_role TEXT;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';

  -- Only allow 'caster', 'company', or 'user'. Never allow self-assigned 'admin'.
  IF requested_role IN ('caster', 'company', 'user') THEN
    safe_role := requested_role;
  ELSE
    safe_role := 'user';
  END IF;

  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    safe_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
