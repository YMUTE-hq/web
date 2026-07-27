import { AdminService } from "@/backend/services/AdminService";
import { AdminActionButton, AdminDeleteButton } from "@/components/admin/AdminActions";
import { Search, Building2 } from "lucide-react";

import { UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const params = await searchParams;
  const companies = (await AdminService.getCompanies({ search: params.search }) || []) as UserProfile[];

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Companies Management</h2>
        <p className="text-slate-500 mt-1">{companies.length} registered companies</p>
      </header>

      <form className="flex gap-4 mb-8">
        <div className="flex items-center gap-2 clay-card shadow-clay rounded-xl px-4 py-2 bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input name="search" defaultValue={params.search} placeholder="Search companies..." className="text-sm outline-none bg-transparent w-48" />
        </div>
        <button type="submit" className="clay-btn-primary text-white px-6 py-2 rounded-xl text-sm font-bold">Search</button>
      </form>

      <section className="clay-card shadow-clay rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary/5">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Company</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Verification</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Documents</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {company.company_logo_url ? (
                          <img src={company.company_logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{company.company_name || company.full_name || "—"}</p>
                        <p className="text-[11px] text-slate-400">{company.location || "No location"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600">{company.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    {company.verification_status === "verified" ? (
                      <span className="px-3 py-1 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-600 uppercase">Verified</span>
                    ) : (
                      <span className="px-3 py-1 text-[10px] font-black rounded-full bg-amber-100 text-amber-600 uppercase">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {company.company_verification_doc_url ? (
                      <a href={company.company_verification_doc_url} target="_blank" className="text-primary text-xs font-bold hover:underline">View Doc</a>
                    ) : (
                      <span className="text-slate-300 text-xs">No docs</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {company.is_suspended ? (
                      <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-rose-100 text-rose-600 uppercase">Suspended</span>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-600 uppercase">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {company.verification_status !== "verified" ? (
                        <AdminActionButton userId={company.id} action="verify" label="Approve" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200" />
                      ) : (
                        <AdminActionButton userId={company.id} action="unverify" label="Revoke" className="bg-slate-100 text-slate-600 hover:bg-slate-200" />
                      )}
                      <AdminActionButton userId={company.id} action="suspend" label="Suspend" className="bg-amber-100 text-amber-700 hover:bg-amber-200" confirm="Suspend this company?" />
                      <AdminDeleteButton id={company.id} endpoint="/api/admin/users" />
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No companies found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
