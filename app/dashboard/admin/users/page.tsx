import { AdminService } from "@/backend/services/AdminService";
import { AdminActionButton, AdminDeleteButton } from "@/components/admin/AdminActions";
import { Users, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ role?: string; search?: string }> }) {
  const params = await searchParams;
  const users = await AdminService.getUsers({ role: params.role, search: params.search }) || [];

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h2>
          <p className="text-slate-500 mt-1">{users.length} total users</p>
        </div>
      </header>

      {/* Filters */}
      <form className="flex gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-2 clay-card shadow-clay rounded-xl px-4 py-2 bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input name="search" defaultValue={params.search} placeholder="Search users..." className="text-sm outline-none bg-transparent w-48" />
        </div>
        <select name="role" defaultValue={params.role} className="clay-card shadow-clay rounded-xl px-4 py-2 text-sm bg-white outline-none">
          <option value="">All Roles</option>
          <option value="caster">Casters</option>
          <option value="company">Companies</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        <button type="submit" className="clay-btn-primary text-white px-6 py-2 rounded-xl text-sm font-bold">Filter</button>
      </form>

      <section className="clay-card shadow-clay rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary/5">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Verified</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {u.full_name?.substring(0,2)?.toUpperCase() || u.email?.substring(0,2)?.toUpperCase() || "NA"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{u.full_name || "—"}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      u.role === "admin" ? "bg-purple-100 text-purple-600" :
                      u.role === "caster" ? "bg-blue-100 text-blue-600" :
                      u.role === "company" ? "bg-emerald-100 text-emerald-600" :
                      "bg-slate-100 text-slate-600"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_banned ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-600">Banned</span>
                    ) : u.is_suspended ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-600">Suspended</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-600">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const vs = u.verification_status || "unverified";
                      if (vs === "verified") return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-600">✓ Verified</span>;
                      if (vs === "pending") return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-600">⏳ Pending</span>;
                      if (vs === "rejected") return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-600">✗ Rejected</span>;
                      return <span className="text-slate-300 text-sm">—</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Link href={`/dashboard/admin/users/${u.id}`} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-colors">
                        View
                      </Link>
                      {u.verification_status !== "verified" && u.role !== "user" && u.role !== "admin" && (
                        <AdminActionButton userId={u.id} action="verify" label="Verify" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200" />
                      )}
                      {!u.is_suspended && u.role !== "admin" && (
                        <AdminActionButton userId={u.id} action="suspend" label="Suspend" className="bg-amber-100 text-amber-700 hover:bg-amber-200" confirm="Suspend this user?" />
                      )}
                      {u.is_suspended && (
                        <AdminActionButton userId={u.id} action="unsuspend" label="Restore" className="bg-blue-100 text-blue-700 hover:bg-blue-200" />
                      )}
                      {!u.is_banned && u.role !== "admin" && (
                        <AdminActionButton userId={u.id} action="ban" label="Ban" className="bg-rose-100 text-rose-700 hover:bg-rose-200" confirm="Permanently ban this user?" />
                      )}
                      {u.role !== "admin" && (
                        <AdminDeleteButton id={u.id} endpoint="/api/admin/users" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
