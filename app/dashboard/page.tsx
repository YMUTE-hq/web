"use client";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardRouter() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (profile) {
        if (profile.role === "caster") {
          router.push("/dashboard/caster");
        } else if (profile.role === "company") {
          router.push("/dashboard/company");
        } else if (profile.role === "admin") {
          router.push("/dashboard/admin");
        } else {
          // Fallback
          router.push("/");
        }
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="text-navy font-bold text-lg">Loading Dashboard...</p>
      </div>
    </div>
  );
}
