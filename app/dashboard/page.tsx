"use client";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import LogoLoader from "@/components/ui/LogoLoader";

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
          router.push("/");
        }
      } else {
        router.push("/");
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <LogoLoader size="lg" label="Loading Dashboard..." />
    </div>
  );
}
