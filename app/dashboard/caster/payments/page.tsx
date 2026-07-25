"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

type Application = {
  id: string;
  status: string;
  jobs: { title: string; budget: string } | null;
  created_at: string;
};

export default function CasterPaymentsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [accepted, setAccepted] = useState<Application[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("applications").select("id, status, created_at, jobs(title, budget)")
      .eq("caster_id", user.id).eq("status", "accepted")
      .then(({ data }) => setAccepted((data as unknown as Application[]) || []));
  }, [user]);

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Payments</h2>
        <p className="text-slate-500">Track your earnings and payment history</p>
      </header>
      <div className="clay-card-solid p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Accepted Jobs (Earnings)</h3>
        </div>
        {accepted.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-primary/30 text-6xl block mb-4">account_balance_wallet</span>
            <p className="text-slate-400">No accepted jobs yet. Apply and get hired to start earning!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4 font-semibold">Event</th>
                  <th className="pb-4 font-semibold">Budget</th>
                  <th className="pb-4 font-semibold">Date</th>
                  <th className="pb-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {accepted.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="py-4 font-bold text-slate-700">{a.jobs?.title || "—"}</td>
                    <td className="py-4 font-bold text-slate-700">{a.jobs?.budget || "Negotiable"}</td>
                    <td className="py-4 text-slate-500 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-emerald-600 font-bold">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span className="text-[10px] uppercase">Hired</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
