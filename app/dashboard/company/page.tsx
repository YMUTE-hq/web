import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CompanyDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, status, created_at, domain")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentJobs = jobs || [];

  const { data: apps } = await supabase
    .from("applications")
    .select("id, status, jobs!inner(company_id)")
    .eq("jobs.company_id", user.id);

  const stats = {
    jobs: recentJobs.length,
    applications: apps?.length || 0,
    hired: apps?.filter((a) => a.status === "accepted").length || 0,
  };

  return (
    <>
      <header className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Company Dashboard</h2>
          <p className="text-slate-500">Welcome back, {profile?.company_name || profile?.full_name || "Company"}!</p>
        </div>
        <Link href="/dashboard/company/post-job" className="px-6 py-3 clay-button-primary text-white rounded-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">add_circle</span> Post New Job
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { icon: "work", label: "Jobs Posted", value: stats.jobs, color: "text-primary", bg: "bg-primary/10" },
          { icon: "group", label: "Applications", value: stats.applications, color: "text-blue-600", bg: "bg-blue-100" },
          { icon: "handshake", label: "Casters Hired", value: stats.hired, color: "text-emerald-600", bg: "bg-emerald-100" },
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

      {/* Recent Jobs */}
      <div className="clay-card-solid p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Recent Jobs</h3>
          <Link href="/dashboard/company/jobs" className="text-primary text-sm font-bold hover:underline">View All</Link>
        </div>
        {recentJobs.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-primary/30 text-6xl block mb-4">work_off</span>
            <p className="text-slate-400 mb-4">No jobs posted yet</p>
            <Link href="/dashboard/company/post-job" className="clay-button-primary text-white px-6 py-3 rounded-xl font-bold inline-block">Post Your First Job</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">{job.title}</p>
                  <p className="text-xs text-slate-500">{job.domain} · {new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${job.status === "open" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{job.status}</span>
                  <Link href={`/dashboard/company/applications?job_id=${job.id}`} className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">people</span> Applications
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
