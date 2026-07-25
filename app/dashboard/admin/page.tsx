import { AdminService } from "@/backend/services/AdminService";
import { Calendar, Plus, TrendingUp, Check, X, Users, Briefcase, Mic, Building2 } from "lucide-react";

export default async function AdminDashboardOverview() {
  const [stats, applications] = await Promise.all([
    AdminService.getStats(),
    AdminService.getApplications(),
  ]);

  const recentApps = (applications || []).slice(0, 8);

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="clay-card shadow-clay rounded-xl px-4 py-2 flex items-center gap-2 bg-white">
            <Calendar className="text-slate-400 w-5 h-5" />
            <span className="text-sm font-semibold text-slate-600">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-100 text-blue-600" },
          { label: "Casters", value: stats.totalCasters, icon: Mic, color: "bg-purple-100 text-purple-600" },
          { label: "Companies", value: stats.totalCompanies, icon: Building2, color: "bg-emerald-100 text-emerald-600" },
          { label: "Jobs", value: stats.totalJobs, icon: Briefcase, color: "bg-amber-100 text-amber-600" },
          { label: "Applications", value: stats.totalApplications, icon: TrendingUp, color: "bg-primary/10 text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="clay-card shadow-clay rounded-xl p-6 bg-white flex flex-col gap-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
            <div className="flex items-center gap-1 mt-2 text-emerald-500">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-bold">Live</span>
            </div>
          </div>
        ))}
      </section>

      {/* Revenue Stat */}
      <section className="mb-10">
        <div className="clay-card shadow-clay rounded-xl p-6 bg-white inline-flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-black text-lg">₹</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Platform Revenue</p>
            <h3 className="text-3xl font-black text-slate-900">₹{stats.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </section>

      {/* Recent Applications Table */}
      <section className="clay-card shadow-clay rounded-xl bg-white overflow-hidden mb-12">
        <div className="p-8 border-b border-primary/5 flex items-center justify-between">
          <h4 className="text-xl font-black text-slate-900">Recent Applications</h4>
          <a href="/dashboard/admin/applications" className="text-primary font-bold text-sm hover:underline">View All →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary/5">
                <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Applicant</th>
                <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Job Title</th>
                <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {recentApps.map((app: any) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {app.users?.full_name?.substring(0, 2)?.toUpperCase() || "NA"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{app.users?.full_name || "—"}</p>
                        <p className="text-[10px] text-slate-400">{app.users?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-semibold text-slate-600">{app.jobs?.title || "—"}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      app.status === "accepted" ? "bg-emerald-100 text-emerald-600" :
                      app.status === "rejected" ? "bg-rose-100 text-rose-600" :
                      "bg-amber-100 text-amber-600"
                    }`}>{app.status}</span>
                  </td>
                  <td className="px-8 py-5 text-right text-xs text-slate-400">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentApps.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400">No applications yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
