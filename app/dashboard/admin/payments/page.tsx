import { AdminService } from "@/backend/services/AdminService";
import { PaymentActionButton } from "@/components/admin/PaymentActionButton";
import { CreditCard, IndianRupee } from "lucide-react";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const payments = await AdminService.getPayments({ status: params.status }) || [];

  const totalRevenue = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payments Management</h2>
          <p className="text-slate-500 mt-1">{payments.length} transactions</p>
        </div>
        <div className="clay-card shadow-clay rounded-xl p-4 bg-white text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
          <p className="text-2xl font-black text-primary">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </header>

      <form className="flex gap-4 mb-8">
        <select name="status" defaultValue={params.status} className="clay-card shadow-clay rounded-xl px-4 py-2 text-sm bg-white outline-none">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
        <button type="submit" className="clay-btn-primary text-white px-6 py-2 rounded-xl text-sm font-bold">Filter</button>
      </form>

      <section className="clay-card shadow-clay rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary/5">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Job</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Caster</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {payments.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="text-sm font-semibold text-slate-700 line-clamp-1">{payment.jobs?.title || "—"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{payment.users?.full_name || "—"}</p>
                    <p className="text-[11px] text-slate-400">{payment.users?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 font-black text-slate-900">
                      <IndianRupee className="w-4 h-4 text-primary" />
                      {payment.amount?.toLocaleString() || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      payment.status === "paid" ? "bg-emerald-100 text-emerald-600" :
                      payment.status === "refunded" ? "bg-blue-100 text-blue-600" :
                      "bg-amber-100 text-amber-600"
                    }`}>{payment.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {payment.status === "pending" && (
                        <PaymentActionButton paymentId={payment.id} action="paid" label="Mark Paid" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200" />
                      )}
                      {payment.status === "paid" && (
                        <PaymentActionButton paymentId={payment.id} action="refunded" label="Refund" className="bg-blue-100 text-blue-600 hover:bg-blue-200" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No payment records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
