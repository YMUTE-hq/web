import { AdminService } from "@/backend/services/AdminService";
import { AdminActionButton, AdminDeleteButton } from "@/components/admin/AdminActions";
import { Search, Star, Mic } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCastersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const params = await searchParams;
  const casters = await AdminService.getCasters({ search: params.search }) || [];

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Casters Management</h2>
          <p className="text-slate-500 mt-1">{casters.length} registered casters</p>
        </div>
      </header>

      <form className="flex gap-4 mb-8">
        <div className="flex items-center gap-2 clay-card shadow-clay rounded-xl px-4 py-2 bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input name="search" defaultValue={params.search} placeholder="Search casters..." className="text-sm outline-none bg-transparent w-48" />
        </div>
        <button type="submit" className="clay-btn-primary text-white px-6 py-2 rounded-xl text-sm font-bold">Search</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {casters.map((caster: any) => (
          <div key={caster.id} className="clay-card shadow-clay rounded-xl bg-white p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg font-black text-primary overflow-hidden">
                {caster.avatar_url ? (
                  <img src={caster.avatar_url} alt={caster.full_name} className="w-full h-full object-cover" />
                ) : (
                  caster.full_name?.substring(0,2)?.toUpperCase() || "CA"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 truncate">{caster.full_name || "—"}</p>
                  {caster.verification_status === "verified" && <span className="text-emerald-500 text-xs font-bold shrink-0">✓</span>}
                  {caster.is_featured && <span className="text-primary text-xs font-bold shrink-0">★ Featured</span>}
                </div>
                <p className="text-xs text-slate-500">{caster.email}</p>
                {caster.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-bold text-slate-700">{caster.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {caster.domains?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {caster.domains.map((d: string) => (
                  <span key={d} className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">{d}</span>
                ))}
              </div>
            )}

            {caster.languages?.length > 0 && (
              <p className="text-xs text-slate-500">🌐 {caster.languages.join(", ")}</p>
            )}

            {caster.audio_sample_url && (
              <div>
                <p className="text-xs text-slate-400 mb-1 font-semibold">Audio Sample</p>
                <audio controls className="w-full h-8" src={caster.audio_sample_url} />
              </div>
            )}

            {/* Profile completeness */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Profile Completeness</span>
                <span className="font-bold text-slate-700">
                  {Math.round(
                    ([caster.full_name, caster.bio, caster.avatar_url, caster.audio_sample_url, caster.domains?.length > 0, caster.languages?.length > 0]
                      .filter(Boolean).length / 6) * 100
                  )}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full">
                <div className="h-1.5 bg-primary rounded-full" style={{ width: `${Math.round(([caster.full_name, caster.bio, caster.avatar_url, caster.audio_sample_url, caster.domains?.length > 0, caster.languages?.length > 0].filter(Boolean).length / 6) * 100)}%` }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {caster.verification_status !== "verified" ? (
                <AdminActionButton userId={caster.id} action="verify" label="✓ Verify" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200" />
              ) : (
                <AdminActionButton userId={caster.id} action="unverify" label="Unverify" className="bg-slate-100 text-slate-600 hover:bg-slate-200" />
              )}
              {!caster.is_featured ? (
                <AdminActionButton userId={caster.id} action="feature" label="★ Feature" className="bg-primary/10 text-primary hover:bg-primary/20" />
              ) : (
                <AdminActionButton userId={caster.id} action="unfeature" label="Unfeature" className="bg-slate-100 text-slate-600 hover:bg-slate-200" />
              )}
              <AdminActionButton userId={caster.id} action="suspend" label="Suspend" className="bg-amber-100 text-amber-700 hover:bg-amber-200" confirm="Suspend this caster?" />
              <AdminDeleteButton id={caster.id} endpoint="/api/admin/users" />
            </div>
          </div>
        ))}
        {casters.length === 0 && (
          <div className="col-span-3 text-center py-20 text-slate-400">No casters found.</div>
        )}
      </div>
    </main>
  );
}
