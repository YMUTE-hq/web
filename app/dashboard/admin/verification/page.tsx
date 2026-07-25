import { AdminService } from "@/backend/services/AdminService";
import { AdminActionButton } from "@/components/admin/AdminActions";
import { ShieldCheck } from "lucide-react";

export default async function AdminVerificationPage() {
  // Show casters and companies pending verification
  const allUsers = await AdminService.getUsers() || [];
  const pending = allUsers.filter((u: any) => !u.is_verified && (u.role === "caster" || u.role === "company"));
  const verified = allUsers.filter((u: any) => u.is_verified && (u.role === "caster" || u.role === "company"));

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Verification System</h2>
        <p className="text-slate-500 mt-1">{pending.length} pending requests · {verified.length} verified accounts</p>
      </header>

      {/* Pending Verification */}
      <section className="mb-12">
        <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
          Pending Verification ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <div className="clay-card shadow-clay rounded-xl bg-white p-10 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            All clear! No pending verifications.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pending.map((user: any) => (
              <div key={user.id} className="clay-card shadow-clay rounded-xl bg-white p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-black text-sm shrink-0">
                    {user.full_name?.substring(0,2)?.toUpperCase() || "??"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{user.full_name || user.company_name || "—"}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${user.role === "caster" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>{user.role}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  {user.role === "caster" && (
                    <>
                      {user.audio_sample_url && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 mb-1">Audio Sample</p>
                          <audio controls className="w-full h-8" src={user.audio_sample_url} />
                        </div>
                      )}
                      {user.domains?.length > 0 && <p className="text-xs text-slate-500">Domains: {user.domains.join(", ")}</p>}
                      {user.languages?.length > 0 && <p className="text-xs text-slate-500">Languages: {user.languages.join(", ")}</p>}
                      {user.bio && <p className="text-xs text-slate-500 line-clamp-2">{user.bio}</p>}
                    </>
                  )}
                  {user.role === "company" && (
                    <>
                      {user.company_name && <p className="text-xs text-slate-500">Company: <strong>{user.company_name}</strong></p>}
                      {user.company_verification_doc_url && (
                        <a href={user.company_verification_doc_url} target="_blank" className="text-xs text-primary font-bold hover:underline">View Verification Document →</a>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <AdminActionButton userId={user.id} action="verify" label="✓ Approve" className="flex-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-center" />
                  <AdminActionButton userId={user.id} action="suspend" label="✗ Reject" className="flex-1 bg-rose-100 text-rose-600 hover:bg-rose-200 text-center" confirm="Reject this verification request?" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Verified Accounts */}
      <section>
        <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
          Verified Accounts ({verified.length})
        </h3>
        <div className="clay-card shadow-clay rounded-xl bg-white overflow-hidden">
          <div className="divide-y divide-primary/5">
            {verified.map((user: any) => (
              <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500 text-lg">✓</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.full_name || user.company_name}</p>
                    <p className="text-xs text-slate-400">{user.email} · {user.role}</p>
                  </div>
                </div>
                <AdminActionButton userId={user.id} action="unverify" label="Revoke" className="bg-slate-100 text-slate-600 hover:bg-slate-200" />
              </div>
            ))}
            {verified.length === 0 && <p className="px-6 py-10 text-center text-slate-400 text-sm">No verified accounts yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
