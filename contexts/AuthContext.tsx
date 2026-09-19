"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getDashboardUrlForRole } from "@/lib/auth-routing";

type UserProfile = {
  id: string;
  email: string;
  role: "caster" | "company" | "user" | "admin";
  full_name: string | null;
  avatar_url: string | null;
  company_name?: string | null;
  verification_status?: string | null;
  bio?: string | null;
  location?: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    role: string,
    fullName: string,
    extraData?: Record<string, unknown>,
    skipRedirect?: boolean
  ) => Promise<{ error: string | null; user?: User | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      // Direct query to Supabase users table
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (data) {
        setProfile(data as UserProfile);
        return data as UserProfile;
      }

      // Fallback API route if direct query returns no data
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const userProfile = await res.json();
        setProfile(userProfile as UserProfile);
        return userProfile as UserProfile;
      }
    } catch (e) {
      console.error("Error fetching profile", e);
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          if (error.message?.includes("Refresh Token") || error.message?.includes("invalid")) {
            await supabase.auth.signOut().catch(() => {});
          }
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
          return;
        }

        const session = data?.session;
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        }
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        if (errorMsg.includes("Refresh Token") || errorMsg.includes("invalid")) {
          await supabase.auth.signOut().catch(() => {});
        }
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (!mounted) return;
          if (event === "SIGNED_OUT" || !session) {
            setUser(null);
            setProfile(null);
          } else if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        }
      );
      subscription = data.subscription;
    } catch (e) {
      console.error("Auth state change subscription failed:", e);
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    if (data.user) {
      setUser(data.user);
      try {
        const profileData = await fetchProfile(data.user.id);
        const targetUrl = getDashboardUrlForRole(profileData?.role);
        router.replace(targetUrl);
      } catch (e) {
        console.error("Sign in profile fetch error", e);
        router.replace("/dashboard");
      }
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    role: string,
    fullName: string,
    extraData?: Record<string, unknown>,
    skipRedirect?: boolean
  ) => {
    // Whitelist allowed signup roles; forbid client self-promotion to admin
    const ALLOWED_SIGNUP_ROLES = ["caster", "company"];
    if (!ALLOWED_SIGNUP_ROLES.includes(role)) {
      return { error: "Invalid registration role selected." };
    }
    const safeRole = role as "caster" | "company";

    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    // If already logged in, treat as a role upgrade between permitted roles
    if (currentUser) {
      if (currentUser.email !== email) {
        return { error: "You are logged in with a different email. Please log out first to create a new account." };
      }
      
      // Perform role upgrade
      await supabase.from("users").update({
        role: safeRole,
        full_name: fullName,
        ...(extraData || {})
      }).eq("id", currentUser.id);

      await fetchProfile(currentUser.id);

      if (!skipRedirect) {
        router.push(getDashboardUrlForRole(safeRole));
      }
      return { error: null, user: currentUser };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: safeRole, full_name: fullName },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        return { error: "Email already registered. Please log in first to upgrade your account." };
      }
      return { error: error.message };
    }
    if (data.user) {
      // Insert/upsert user profile
      await supabase.from("users").upsert({
        id: data.user.id,
        email,
        role: safeRole,
        full_name: fullName,
        ...(extraData || {})
      });
      if (!skipRedirect) {
        router.push(getDashboardUrlForRole(safeRole));
      }
    }
    return { error: null, user: data?.user };
  };

  const signOut = async () => {
    try {
      setUser(null);
      setProfile(null);

      // 1. Call server logout API to purge all server cookies (handles chunked cookies)
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});

      // 2. Client-side Supabase sign out
      await supabase.auth.signOut().catch(() => {});

      // 3. Clear client-side document cookies as extra safety net
      if (typeof document !== "undefined") {
        document.cookie.split(";").forEach((c) => {
          const name = c.split("=")[0].trim();
          if (name.includes("auth-token") || name.includes("token") || name.startsWith("sb-")) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }
    } catch (e) {
      console.error("Sign out error", e);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
