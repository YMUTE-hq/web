"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
    extraData?: any,
    skipRedirect?: boolean
  ) => Promise<{ error: string | null; user?: any }>;
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
        // Race getSession against a 3-second timeout.
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 3000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);

        if (mounted && result && 'data' in result) {
          const session = result.data?.session;
          setUser(session?.user ?? null);
          if (session?.user) await fetchProfile(session.user.id);
        }
      } catch (e) {
        console.error("Auth init failed:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) return;
          setUser(session?.user ?? null);
          if (session?.user) await fetchProfile(session.user.id);
          else setProfile(null);
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
        const role = profileData?.role || "user";

        if (role === "caster") router.push("/dashboard/caster");
        else if (role === "company") router.push("/dashboard/company");
        else if (role === "admin") router.push("/dashboard/admin");
        else router.push("/dashboard");
      } catch (e) {
        console.error("Sign in profile fetch error", e);
        router.push("/dashboard");
      }
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    role: string,
    fullName: string,
    extraData?: any,
    skipRedirect?: boolean
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    // If already logged in, treat as a role upgrade
    if (currentUser) {
      if (currentUser.email !== email) {
        return { error: "You are logged in with a different email. Please log out first to create a new account." };
      }
      
      // Perform role upgrade
      await supabase.from("users").update({
        role,
        full_name: fullName,
        ...(extraData || {})
      }).eq("id", currentUser.id);

      await fetchProfile(currentUser.id);

      if (!skipRedirect) {
        if (role === "caster") router.push("/dashboard/caster");
        else if (role === "company") router.push("/dashboard/company");
        else if (role === "admin") router.push("/dashboard/admin");
        else router.push("/");
      }
      return { error: null, user: currentUser };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
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
        role,
        full_name: fullName,
        ...(extraData || {})
      });
      if (!skipRedirect) {
        if (role === "caster") router.push("/dashboard/caster");
        else if (role === "company") router.push("/dashboard/company");
        else if (role === "admin") router.push("/dashboard/admin");
        else router.push("/");
      }
    }
    return { error: null, user: data?.user };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error", e);
    } finally {
      window.location.href = "/";
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
