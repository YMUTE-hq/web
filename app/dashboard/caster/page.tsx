import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import VerificationBadge from "@/components/VerificationBadge";

type Application = {
  id: string;
  status: string;
  created_at: string;
  jobs: { title: string; event_date: string } | null;
};

export const dynamic = "force-dynamic";

export default async function CasterDashboardPage() {
  const supabase = await createClient();
  
  let user = null;
  let profile = null;
  let rawApps = [];
  let allApps = [];

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    user = authData.user;
    if (!user || authError) throw new Error("Auth failed");

    const { data: p } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = p;

    const { data: rApps } = await supabase
      .from("applications")
      .select("id, status, created_at, jobs(title, event_date)")
      .eq("caster_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    rawApps = rApps || [];

    const { data: aApps } = await supabase
      .from("applications")
      .select("status")
      .eq("caster_id", user.id);
    allApps = aApps || [];
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    redirect("/login");
  }

  const applications = (rawApps as unknown as Application[]) || [];
  
  // Fetch overall application stats for this caster
  const stats = {
    total: allApps?.length || 0,
    active: (allApps as Application[])?.filter((a) => a.status === "pending").length || 0,
    accepted: (allApps as Application[])?.filter((a) => a.status === "accepted").length || 0,
  };

  const statusColor = (s: string) => {
    if (s === "accepted") return "bg-emerald-100 text-emerald-600";
    if (s === "rejected") return "bg-rose-100 text-rose-600";
    return "bg-amber-100 text-amber-600";
  };

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold text-slate-900">Welcome, {profile?.full_name?.split(" ")[0] || "Caster"}!</h2>
            <VerificationBadge status={profile?.verification_status} />
          </div>
          <p className="text-slate-500">Here&apos;s what&apos;s happening with your caster profile today.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/jobs" className="px-4 py-2 clay-btn-primary text-white rounded-xl text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">search</span> Find Jobs
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { icon: "send", label: "Applications", value: stats.total, bg: "bg-primary/10", color: "text-primary" },
          { icon: "work", label: "Active (Pending)", value: stats.active, bg: "bg-blue-100", color: "text-blue-600" },
          { icon: "task_alt", label: "Accepted", value: stats.accepted, bg: "bg-emerald-100", color: "text-emerald-600" },
          { icon: "star", label: "Avg Rating", value: profile?.rating || "New", bg: "bg-amber-100", color: "text-amber-500" },
        ].map((stat) => (
          <div key={stat.label} className="clay-card-solid p-6 flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
              <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="clay-card-solid p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Recent Applications</h3>
          <Link href="/dashboard/caster/applications" className="text-primary text-sm font-bold hover:underline">View All</Link>
        </div>
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-primary/30 text-6xl mb-3 block">assignment</span>
            <p className="text-slate-400 font-medium">No applications yet</p>
            <Link href="/jobs" className="mt-4 inline-block text-primary font-bold text-sm hover:underline">Browse Jobs →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4 font-semibold">Job Title</th>
                  <th className="pb-4 font-semibold">Event Date</th>
                  <th className="pb-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-slate-50">
                    <td className="py-4 font-bold text-slate-700">{app.jobs?.title || "—"}</td>
                    <td className="py-4 text-slate-500">
                      {app.jobs?.event_date ? new Date(app.jobs.event_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upgrade Banner */}
      <section className="clay-card-dark p-8 md:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-primary text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 shadow-sm">Limited Offer</span>
            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Elevate Your Career</h3>
            <p className="text-slate-300 max-w-md text-sm font-medium leading-relaxed">Get featured at the top of organizer searches and double your application success rate with YMUTE Premium.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-lg min-w-[180px] flex flex-col justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Standard</p>
                <p className="text-2xl font-black text-white mb-4">₹0 <span className="text-sm font-normal text-slate-400">/mo</span></p>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold shadow-inner">Current Plan</button>
            </div>
            <div className="p-5 rounded-2xl bg-primary text-slate-950 shadow-clay-primary border border-yellow-300/40 min-w-[180px] flex flex-col justify-between">
              <div>
                <p className="text-slate-950/80 text-xs font-black uppercase tracking-wider mb-1">Elite Caster</p>
                <p className="text-2xl font-black text-slate-950 mb-4">₹1,499 <span className="text-sm font-bold text-slate-900/80">/mo</span></p>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-slate-950 text-white hover:bg-slate-900 text-xs font-black shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">Upgrade Now</button>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>
    </>
  );
}
