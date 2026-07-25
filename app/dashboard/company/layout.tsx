"use client";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import NotificationInbox from "@/components/NotificationInbox";

export default function CompanyDashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/company", icon: "dashboard", label: "Dashboard" },
    { href: "/dashboard/company/profile", icon: "business", label: "Company Profile" },
    { href: "/dashboard/company/post-job", icon: "add_circle", label: "Post Job" },
    { href: "/dashboard/company/jobs", icon: "work", label: "My Jobs" },
    { href: "/dashboard/company/applications", icon: "person_search", label: "Applications" },
    { href: "/dashboard/company/payments", icon: "payments", label: "Payments" },
    { href: "/dashboard/company/messages", icon: "forum", label: "Messages" },
    { href: "/dashboard/company/settings", icon: "settings", label: "Settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display">
      {/* Sidebar */}
      <aside className="w-72 bg-background-light border-r border-primary/10 flex flex-col p-6 gap-8 hidden lg:flex">
        <Link href="/" className="flex items-center gap-2 px-2">
          <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <img src="/logo-text.png" alt="YMUTE" className="h-5 object-contain" />
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Dashboard</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? "bg-primary/20 text-primary" : "hover:bg-primary/10 group"}`}
              >
                <span className={`material-symbols-outlined ${isActive ? "text-primary" : "text-slate-500 group-hover:text-primary"}`}>{item.icon}</span>
                <span className={`font-medium ${isActive ? "font-bold" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="clay-card p-4 flex flex-col items-center gap-3 bg-white/50">
          <div className="w-16 h-16 rounded-full border-4 border-white shadow-inner overflow-hidden bg-primary/20 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-2xl">business</span>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">{profile?.company_name || profile?.full_name || "Company"}</p>
            <p className="text-[10px] text-slate-500">Company Admin</p>
          </div>
          <button onClick={signOut} className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">logout</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-6 md:px-8 py-6 flex flex-col">
        <div className="flex justify-end items-center mb-4">
          <NotificationInbox />
        </div>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
