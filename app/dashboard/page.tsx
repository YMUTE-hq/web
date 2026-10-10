"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardUrlForRole } from "@/lib/auth-routing";
import LogoLoader from "@/components/ui/LogoLoader";

export default function DashboardRouter() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    // Wait until auth initialization finishes
    if (loading) return;

    // If unauthenticated, redirect to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Once profile is settled, redirect smoothly via Next.js router
    if (profile) {
      const targetUrl = getDashboardUrlForRole(profile.role);
      router.replace(targetUrl);
      return;
    }

    // If user is authenticated but profile query is still resolving, hold loading state.
    // Use a ref-style guard so the timeout sees the latest profile value.
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        setErrorState("Unable to load profile. Please try signing in again.");
      }
    }, 6000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, profile, loading, router]);

  if (errorState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light gap-4 px-4 text-center">
        <p className="text-navy font-bold text-lg">{errorState}</p>
        <button
          onClick={() => router.replace("/login")}
          className="px-6 py-3 clay-button-primary text-white font-bold rounded-2xl"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <LogoLoader size="lg" label="Loading Dashboard..." />
    </div>
  );
}
