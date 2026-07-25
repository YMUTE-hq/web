"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, Users, Mic, Building2, Briefcase, 
  FileText, CreditCard, ShieldCheck, BarChart3, Settings, LogOut, MessageSquare
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const links = [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/casters", label: "Casters", icon: Mic },
    { href: "/dashboard/admin/companies", label: "Companies", icon: Building2 },
    { href: "/dashboard/admin/jobs", label: "Jobs", icon: Briefcase },
    { href: "/dashboard/admin/applications", label: "Applications", icon: FileText },
    { href: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/dashboard/admin/verification", label: "Verification", icon: ShieldCheck },
    { href: "/dashboard/admin/community", label: "Community", icon: MessageSquare },
    { href: "/dashboard/admin/reports", label: "Reports", icon: BarChart3, separator: true },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-72 h-full flex flex-col bg-background-light/50 border-r border-primary/10 p-6 overflow-y-auto shrink-0">
      <Link href="/" className="flex items-center gap-2 mb-10 px-2 cursor-pointer group">
        <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
        <div>
          <img src="/logo-text.png" alt="YMUTE" className="h-5 object-contain" />
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Super Admin</p>
        </div>
      </Link>
      <nav className="flex flex-col gap-2 flex-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                link.separator ? "border-t border-primary/5 mt-4 pt-4" : ""
              } ${
                isActive 
                  ? "bg-primary text-white shadow-clay" 
                  : "text-slate-600 hover:bg-primary/10 hover:text-primary"
              }`} 
              href={link.href}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-6">
        <div className="clay-card shadow-clay rounded-xl p-4 flex items-center gap-3 bg-white/50">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
            <span className="font-bold text-primary">AR</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-900 line-clamp-1">Admin YMUTE</p>
            <button type="button" onClick={() => signOut()} className="text-[10px] text-slate-500 hover:text-red-500 transition-colors">Sign out</button>
          </div>
          <LogOut className="text-slate-400 w-4 h-4 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
