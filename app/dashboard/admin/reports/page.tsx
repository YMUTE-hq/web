import { AdminService } from "@/backend/services/AdminService";
import { TrendingUp, Users, Briefcase, FileText, IndianRupee } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const stats = await AdminService.getStats();
  const jobs = await AdminService.getJobs() || [];
  const apps = await AdminService.getApplications() || [];

  const openJobs = jobs.filter((j: any) => j.status === "open").length;
  const closedJobs = jobs.filter((j: any) => j.status === "closed").length;
  const pendingApps = apps.filter((a: any) => a.status === "pending").length;
  const acceptedApps = apps.filter((a: any) => a.status === "accepted").length;

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Platform Reports & Analytics</h2>
        <p className="text-slate-500 mt-1">Live platform data and metrics</p>
      </header>

      {/* Key Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="clay-card shadow-clay rounded-xl p-6 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Users</p>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{stats.totalUsers}</h3>
          <p className="text-xs text-slate-400 mt-1">{stats.totalCasters} casters · {stats.totalCompanies} companies</p>
        </div>
        <div className="clay-card shadow-clay rounded-xl p-6 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jobs</p>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{stats.totalJobs}</h3>
          <p className="text-xs text-slate-400 mt-1">{openJobs} open · {closedJobs} closed</p>
        </div>
        <div className="clay-card shadow-clay rounded-xl p-6 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Applications</p>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{stats.totalApplications}</h3>
          <p className="text-xs text-slate-400 mt-1">{pendingApps} pending · {acceptedApps} accepted</p>
        </div>
        <div className="clay-card shadow-clay rounded-xl p-6 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
          </div>
          <h3 className="text-3xl font-black text-slate-900">₹{stats.totalRevenue.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 mt-1">Total paid transactions</p>
        </div>
      </section>

      {/* Job Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="clay-card shadow-clay rounded-xl p-8 bg-white">
          <h4 className="text-lg font-black text-slate-900 mb-6">Job Status Distribution</h4>
          <div className="space-y-4">
            {[
              { label: "Open Jobs", count: openJobs, total: stats.totalJobs, color: "bg-emerald-400" },
              { label: "Closed Jobs", count: closedJobs, total: stats.totalJobs, color: "bg-rose-400" },
              { label: "Draft Jobs", count: Math.max(0, stats.totalJobs - openJobs - closedJobs), total: stats.totalJobs, color: "bg-amber-400" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-semibold">{item.label}</span>
                  <span className="font-black text-slate-800">{item.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.total ? (item.count / item.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="clay-card shadow-clay rounded-xl p-8 bg-white">
          <h4 className="text-lg font-black text-slate-900 mb-6">Application Status Distribution</h4>
          <div className="space-y-4">
            {[
              { label: "Pending", count: pendingApps, color: "bg-amber-400" },
              { label: "Accepted", count: acceptedApps, color: "bg-emerald-400" },
              { label: "Rejected", count: Math.max(0, stats.totalApplications - pendingApps - acceptedApps), color: "bg-rose-400" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-semibold">{item.label}</span>
                  <span className="font-black text-slate-900">{item.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${stats.totalApplications ? (item.count / stats.totalApplications) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
