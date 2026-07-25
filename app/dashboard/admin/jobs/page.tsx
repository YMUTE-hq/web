import { AdminService } from "@/backend/services/AdminService";
import { AdminJobActionButton, AdminDeleteButton } from "@/components/admin/AdminActions";
import { Search, IndianRupee, Globe, Flag } from "lucide-react";

export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string }> }) {
  const params = await searchParams;
  const jobs = await AdminService.getJobs({ status: params.status, search: params.search }) || [];

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Jobs Management</h2>
        <p className="text-slate-500 mt-1">{jobs.length} total jobs</p>
      </header>

      <form className="flex gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-2 clay-card shadow-clay rounded-xl px-4 py-2 bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input name="search" defaultValue={params.search} placeholder="Search jobs..." className="text-sm outline-none bg-transparent w-48" />
        </div>
        <select name="status" defaultValue={params.status} className="clay-card shadow-clay rounded-xl px-4 py-2 text-sm bg-white outline-none">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
        <button type="submit" className="clay-btn-primary text-white px-6 py-2 rounded-xl text-sm font-bold">Filter</button>
      </form>

      <section className="clay-card shadow-clay rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary/5">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Job</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Company</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Domain</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Budget</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {jobs.map((job: any) => (
                <tr key={job.id} className={`hover:bg-slate-50/50 transition-colors ${job.flagged ? "bg-rose-50" : ""}`}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 line-clamp-1 flex items-center gap-2">
                        {job.flagged && <Flag className="w-3 h-3 text-rose-500 shrink-0" />}
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-400">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{job.users?.company_name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{job.domain || "—"}</td>
                  <td className="px-6 py-4">
                    {job.budget ? (
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-800">
                        <IndianRupee className="w-3 h-3" />{job.budget}
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      job.status === "open" ? "bg-emerald-100 text-emerald-600" :
                      job.status === "closed" ? "bg-rose-100 text-rose-600" :
                      "bg-amber-100 text-amber-600"
                    }`}>{job.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {job.status !== "open" && (
                        <AdminJobActionButton jobId={job.id} action="approve" label="Approve" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200" />
                      )}
                      {job.status === "open" && (
                        <AdminJobActionButton jobId={job.id} action="reject" label="Close" className="bg-amber-100 text-amber-700 hover:bg-amber-200" />
                      )}
                      {!job.flagged ? (
                        <AdminJobActionButton jobId={job.id} action="flag" label="Flag" className="bg-rose-100 text-rose-500 hover:bg-rose-200" />
                      ) : (
                        <AdminJobActionButton jobId={job.id} action="unflag" label="Unflag" className="bg-slate-100 text-slate-600 hover:bg-slate-200" />
                      )}
                      <AdminDeleteButton id={job.id} endpoint="/api/admin/jobs" />
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No jobs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
