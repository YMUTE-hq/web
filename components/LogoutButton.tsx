"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  variant?: "sidebar-item" | "sidebar-compact" | "navbar" | "danger-pill";
  className?: string;
  showText?: boolean;
};

export default function LogoutButton({
  variant = "sidebar-item",
  className = "",
  showText = true,
}: LogoutButtonProps) {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoggingOut(false);
    }
  };

  if (variant === "navbar" || variant === "danger-pill") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        type="button"
        className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-black rounded-xl 
          bg-red-50 text-red-600 border border-red-200/80 shadow-sm
          hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-red-500/20 hover:shadow-lg hover:scale-[1.03]
          active:scale-[0.97] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        title="Sign Out"
      >
        <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        {showText && <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>}
      </button>
    );
  }

  if (variant === "sidebar-compact") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        type="button"
        className={`p-2.5 rounded-xl text-red-500 bg-red-50/80 border border-red-100 
          hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-md hover:scale-105
          active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center disabled:opacity-60 ${className}`}
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      type="button"
      className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-black rounded-xl
        bg-red-50/90 text-red-600 border border-red-200/60
        hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-red-500/20 hover:shadow-md hover:scale-[1.02]
        active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-60 ${className}`}
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}
