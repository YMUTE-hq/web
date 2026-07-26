"use client";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import NotificationBell from "@/components/NotificationBell";
import LogoutButton from "@/components/LogoutButton";

export default function CasterDashboardLayout({ children }: { children: ReactNode }) {
  const { profile, loading, signOut } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/caster", icon: "dashboard", label: "Dashboard" },
    { href: "/dashboard/caster/profile", icon: "person", label: "Profile" },
    { href: "/dashboard/caster/applications", icon: "assignment", label: "Applications" },
    { href: "/dashboard/caster/payments", icon: "account_balance_wallet", label: "Payments" },
    { href: "/dashboard/caster/messages", icon: "forum", label: "Messages" },
    { href: "/dashboard/caster/settings", icon: "settings", label: "Settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display">
      {/* Sidebar */}
      <aside className="w-72 bg-background-light border-r border-primary/10 flex flex-col p-6 hidden lg:flex">
        <Link href="/" className="flex items-center gap-2 px-4 mb-10">
          <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 object-contain" />
          <img src="/logo-text.png" alt="YMUTE" className="h-5 object-contain" />
        </Link>
        <nav className="flex-1 space-y-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isActive ? "sidebar-item-active" : "text-slate-600 hover:bg-primary/10"}`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="clay-card p-4 bg-primary/5 border border-primary/20 rounded-2xl mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Current Plan</p>
          <p className="text-sm font-bold text-slate-800">Free Tier</p>
          <button className="mt-3 w-full py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-clay-primary hover:opacity-90">UPGRADE PRO</button>
        </div>
        <div className="clay-card p-4 rounded-2xl bg-white/70 border border-primary/10 space-y-3">
          {loading ? (
            <div className="w-full h-12 rounded-xl border-2 border-primary border-t-transparent animate-spin"></div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-primary">person</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">{profile?.full_name || "Caster"}</p>
                  <p className="text-[10px] text-primary font-bold uppercase">Caster</p>
                </div>
              </div>
              <LogoutButton variant="sidebar-item" />
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background-light p-4 md:p-8 flex flex-col">
        <div className="flex justify-end items-center mb-4">
          <NotificationBell />
        </div>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
