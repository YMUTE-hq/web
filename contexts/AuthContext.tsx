"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
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

// Fail-open helper: never let auth hang the UI forever if Supabase is slow/unreachable.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // Memoize browser client — createClient() throws when env missing (fail-fast).
  const [supabase] = useState(() => createClient());

  const inFlightProfileRef = useRef<Map<string, Promise<UserProfile | null>>>(new Map());
  const profileRef = useRef<UserProfile | null>(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = async (userId: string, force = false): Promise<UserProfile | null> => {
    // If not forced and we already have this user's profile in state, return it directly
    if (!force && profileRef.current && profileRef.current.id === userId) {
      return profileRef.current;
    }

    // In-flight deduplication: reuse active network promise if already fetching for this userId
    if (!force && inFlightProfileRef.current.has(userId)) {
      return inFlightProfileRef.current.get(userId)!;
    }

    const fetchPromise = (async () => {
      const ctrl = new AbortController();
      const abortTimer = setTimeout(() => ctrl.abort(), 10000);
      try {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .abortSignal(ctrl.signal)
          .single();
        
        if (data) {
          const up = data as UserProfile;
          setProfile(up);
          profileRef.current = up;
          return up;
        }

        // Fallback API route if direct query returns no data (8s cap so UI never hangs)
        const res = await fetch("/api/auth/profile", { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const userProfile = await res.json();
          const up = userProfile as UserProfile;
          setProfile(up);
          profileRef.current = up;
          return up;
        }
      } catch (e) {
        console.error("Error fetching profile", e);
      } finally {
        clearTimeout(abortTimer);
        inFlightProfileRef.current.delete(userId);
      }
      return null;
    })();

    inFlightProfileRef.current.set(userId, fetchPromise);
    return fetchPromise;
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        type SessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>>;
        const { data, error } = (await withTimeout(
          supabase.auth.getSession(),
          8000,
          "Session fetch"
        )) as SessionResult;

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
            await withTimeout(fetchProfile(session.user.id), 12000, "Profile fetch").catch((e) => {
              console.error("Profile fetch timed out, continuing without profile", e);
            });
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
            // Only fetch profile if not already cached or matching this user
            if (!profileRef.current || profileRef.current.id !== session.user.id) {
              await fetchProfile(session.user.id);
            }
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

  // Hard safety net: never leave the UI in a permanent loading state.
  // If init hangs for any unforeseen reason, degrade to logged-out UI after 15s.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 15000);
    return () => clearTimeout(t);
  }, [loading]);

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
        if (!profileData) {
          router.replace("/dashboard");
        } else {
          router.replace(getDashboardUrlForRole(profileData.role));
        }
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
      
      // Perform role upgrade — whitelist profile fields only; never allow role override via extraData
      const ALLOWED_EXTRA = ["bio", "languages", "domains", "location", "company_name"] as const;
      const safeExtra: Record<string, unknown> = {};
      for (const k of ALLOWED_EXTRA) {
        if (extraData?.[k] !== undefined) safeExtra[k] = extraData[k];
      }
      const { error: upgradeError } = await supabase.from("users").update({
        role: safeRole,
        full_name: fullName,
        ...safeExtra
      }).eq("id", currentUser.id);
      if (upgradeError) {
        console.error("[Auth] role upgrade failed:", upgradeError.message);
        return { error: "Failed to update profile. Please try again." };
      }

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
      // Insert/upsert user profile — whitelist only, role fixed to safeRole
      const ALLOWED_EXTRA = ["bio", "languages", "domains", "location", "company_name"] as const;
      const safeExtra: Record<string, unknown> = {};
      for (const k of ALLOWED_EXTRA) {
        if (extraData?.[k] !== undefined) safeExtra[k] = extraData[k];
      }
      const { error: upsertError } = await supabase.from("users").upsert({
        id: data.user.id,
        email,
        role: safeRole,
        full_name: fullName,
        ...safeExtra
      });
      if (upsertError) {
        console.error("[Auth] profile upsert failed:", upsertError.message);
      }
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

      // 3. Clear client-side document cookies as extra safety net (non-HttpOnly only)
      if (typeof document !== "undefined") {
        document.cookie.split(";").forEach((c) => {
          const name = c.split("=")[0].trim();
          if (name.startsWith("sb-") && name.includes("auth-token")) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;
          }
        });
      }
    } catch (e) {
      console.error("Sign out error", e);
    } finally {
      router.replace("/login");
      router.refresh();
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
