import { AdminService } from "@/backend/services/AdminService";
import { AdminAppStatusButton, AdminDeleteButton } from "@/components/admin/AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const applications = await AdminService.getApplications({ status: params.status }) || [];

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Applications Management</h2>
        <p className="text-slate-500 mt-1">{applications.length} total applications</p>
      </header>

      <form className="flex gap-4 mb-8">
        <select name="status" defaultValue={params.status} className="clay-card shadow-clay rounded-xl px-4 py-2 text-sm bg-white outline-none">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <button type="submit" className="clay-btn-primary text-white px-6 py-2 rounded-xl text-sm font-bold">Filter</button>
      </form>

      <section className="clay-card shadow-clay rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary/5">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Applicant</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Job</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Message</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {applications.map((app: any) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                        {app.users?.avatar_url ? <img src={app.users.avatar_url} className="w-full h-full object-cover" /> : app.users?.full_name?.substring(0,2)?.toUpperCase() || "—"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{app.users?.full_name || "—"}</p>
                        <p className="text-[11px] text-slate-400">{app.users?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-700 line-clamp-1">{app.jobs?.title || "—"}</p>
                    <p className="text-[11px] text-slate-400">{app.jobs?.domain}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 max-w-[200px] truncate">{app.message || "—"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      app.status === "accepted" ? "bg-emerald-100 text-emerald-600" :
                      app.status === "rejected" ? "bg-rose-100 text-rose-600" :
                      "bg-amber-100 text-amber-600"
                    }`}>{app.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {app.status !== "accepted" && (
                        <AdminAppStatusButton appId={app.id} status="accepted" label="Accept" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200" />
                      )}
                      {app.status !== "rejected" && (
                        <AdminAppStatusButton appId={app.id} status="rejected" label="Reject" className="bg-rose-100 text-rose-600 hover:bg-rose-200" />
                      )}
                      <AdminDeleteButton id={app.id} endpoint="/api/admin/applications" />
                    </div>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No applications found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
