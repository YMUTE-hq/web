"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-center bg-white/80 backdrop-blur-md border-b border-primary/10">
      <div className="max-w-7xl w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo-icon.svg" alt="Logo" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
          <img src="/logo-text.svg" alt="YMUTE" className="h-6 object-contain hidden sm:block" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-sm font-semibold hover:text-primary transition-colors text-slate-700" href="/explore-talent">Explore Talent</Link>
          <Link className="text-sm font-semibold hover:text-primary transition-colors text-slate-700" href="/jobs">Explore Jobs</Link>
          <Link className="text-sm font-semibold hover:text-primary transition-colors text-slate-700" href="/community">Community</Link>
          <Link className="text-sm font-semibold hover:text-primary transition-colors text-slate-700" href="/games">Games</Link>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          ) : user ? (
            <>
              <NotificationBell />
              <Link
                href="/dashboard"
                className="px-5 py-2 text-sm font-bold clay-btn-secondary rounded-lg text-navy-deep hidden sm:block"
              >
                Dashboard
              </Link>
              <LogoutButton variant="navbar" />
            </>
          ) : (
            <>
              <Link href="/login" className="px-5 py-2 text-sm font-bold clay-btn-secondary rounded-lg text-navy-deep">Login</Link>
              <Link href="/signup" className="px-5 py-2 text-sm font-bold clay-btn-primary rounded-lg text-white">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
