import { createClient } from "@/lib/supabase-server";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types";

export interface AuthenticatedProfile {
  id: string;
  role: UserRole;
  email?: string;
  full_name?: string;
  is_suspended?: boolean;
  is_banned?: boolean;
  user: User;
}

/**
 * General authentication helper to retrieve the authenticated user and user profile.
 * Throws an Error if unauthenticated or profile is not found.
 */
export async function authenticate(_req?: Request): Promise<AuthenticatedProfile> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, full_name, is_suspended, is_banned")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

  if (profile.is_suspended || profile.is_banned) {
    throw new Error("Account suspended");
  }

  return {
    id: user.id,
    role: (profile.role || "user") as UserRole,
    email: user.email,
    full_name: profile.full_name,
    is_suspended: profile.is_suspended,
    is_banned: profile.is_banned,
    user,
  };
}

/**
 * Centralized admin authorization guard for API routes.
 * Verifies session, queries the database role, checks suspension/ban flags,
 * and returns the authenticated User object if valid, or null if unauthorized.
 */
export async function requireAdmin(_req?: Request): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role, is_suspended, is_banned")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    // Role check and status validation
    if (profile.role !== "admin" || profile.is_suspended || profile.is_banned) {
      return null;
    }

    return user;
  } catch (error: unknown) {
    console.error("[requireAdmin Error]:", error);
    return null;
  }
}
