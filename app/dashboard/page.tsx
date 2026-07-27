"use client";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LogoLoader from "@/components/ui/LogoLoader";

export default function DashboardRouter() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = "/login";
      } else if (profile) {
        if (profile.role === "caster") {
          window.location.href = "/dashboard/caster";
        } else if (profile.role === "company") {
          window.location.href = "/dashboard/company";
        } else if (profile.role === "admin") {
          window.location.href = "/dashboard/admin";
        } else {
          window.location.href = "/";
        }
      } else {
        window.location.href = "/";
      }
    }
  }, [user, profile, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <LogoLoader size="lg" label="Loading Dashboard..." />
    </div>
  );
}
