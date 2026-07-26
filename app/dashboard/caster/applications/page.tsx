import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

type Application = {
  id: string;
  status: string;
  created_at: string;
  message: string;
  jobs: { id: string; title: string; event_date: string; domain: string } | null;
};

export const dynamic = "force-dynamic";

export default async function CasterApplicationsPage() {
  const supabase = await createClient();
  
  let user = null;
  let rawApps = [];

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    user = authData.user;
    if (!user || authError) throw new Error("Auth failed");

    const { data: rApps } = await supabase
      .from("applications")
      .select("id, status, created_at, message, jobs(id, title, event_date, domain)")
      .eq("caster_id", user.id)
      .order("created_at", { ascending: false });
    rawApps = rApps || [];
  } catch (error) {
    console.error("Applications fetch error:", error);
    redirect("/login");
  }

  const applications = (rawApps as unknown as Application[]) || [];

  const statusColor = (s: string) => {
    if (s === "accepted") return "bg-emerald-100 text-emerald-600";
    if (s === "rejected") return "bg-rose-100 text-rose-600";
    return "bg-amber-100 text-amber-600";
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">My Applications</h2>
        <p className="text-slate-500">Track all your job applications</p>
      </header>
      <div className="clay-card-solid p-6">
        {applications.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-primary/30 text-7xl block mb-4">assignment</span>
            <p className="text-slate-400 font-semibold text-lg">No applications yet</p>
            <Link href="/jobs" className="mt-4 inline-block clay-btn-primary text-white px-6 py-3 rounded-xl font-bold">Browse Jobs</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4 font-semibold">Job Title</th>
                  <th className="pb-4 font-semibold">Domain</th>
                  <th className="pb-4 font-semibold">Event Date</th>
                  <th className="pb-4 font-semibold">Applied On</th>
                  <th className="pb-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-slate-50">
                    <td className="py-4 font-bold text-slate-700">
                      {app.jobs?.id ? (
                        <Link href={`/jobs/${app.jobs.id}`} className="hover:text-primary transition-colors">{app.jobs.title}</Link>
                      ) : "—"}
                    </td>
                    <td className="py-4 text-slate-500">{app.jobs?.domain || "—"}</td>
                    <td className="py-4 text-slate-500">{app.jobs?.event_date ? new Date(app.jobs.event_date).toLocaleDateString() : "—"}</td>
                    <td className="py-4 text-slate-500">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor(app.status)}`}>
                        {app.status}
                      </span>
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
