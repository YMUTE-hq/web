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
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data as UserProfile);
      }
    } catch (e) {
      console.error("Error fetching profile", e);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    if (data.user) {
      try {
        const res = await fetch("/api/auth/profile");
        let role = "user";
        if (res.ok) {
          const userProfile = await res.json();
          role = userProfile?.role || "user";
          setProfile(userProfile as UserProfile);
        }
        if (role === "caster") router.push("/dashboard/caster");
        else if (role === "company") router.push("/dashboard/company");
        else if (role === "admin") router.push("/dashboard/admin");
        else router.push("/");
      } catch (e) {
        console.error("Sign in profile fetch error", e);
        router.push("/");
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
