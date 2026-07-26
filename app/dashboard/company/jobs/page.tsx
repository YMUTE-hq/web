"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Job = {
  id: string;
  title: string;
  domain: string;
  status: string;
  budget: string;
  event_date: string;
  created_at: string;
};

export default function CompanyJobsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from("jobs").select("id, title, domain, status, budget, event_date, created_at")
        .eq("company_id", user.id).order("created_at", { ascending: false });
      setJobs((data || []) as Job[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [user]);

  const toggleStatus = async (job: Job) => {
    const newStatus = job.status === "open" ? "closed" : "open";
    try {
      await supabase.from("jobs").update({ status: newStatus }).eq("id", job.id);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black">My Jobs</h2>
          <p className="text-slate-500">Manage all your posted positions</p>
        </div>
        <Link href="/dashboard/company/post-job" className="px-5 py-3 clay-button-primary text-white rounded-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">add</span> Post Job
        </Link>
      </header>

      <div className="clay-card p-6 rounded-2xl">
        {loading ? (
          <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-primary/30 text-7xl block mb-4">work_off</span>
            <p className="text-slate-400 mb-4">No jobs posted yet</p>
            <Link href="/dashboard/company/post-job" className="clay-button-primary text-white px-6 py-3 rounded-xl font-bold inline-block">Post Your First Job</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4 font-semibold">Title</th>
                  <th className="pb-4 font-semibold">Domain</th>
                  <th className="pb-4 font-semibold">Budget</th>
                  <th className="pb-4 font-semibold">Event Date</th>
                  <th className="pb-4 font-semibold">Status</th>
                  <th className="pb-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-50">
                    <td className="py-4 font-bold text-slate-700">{job.title}</td>
                    <td className="py-4 text-slate-500">{job.domain || "—"}</td>
                    <td className="py-4 text-slate-500">{job.budget || "—"}</td>
                    <td className="py-4 text-slate-500">{job.event_date ? new Date(job.event_date).toLocaleDateString() : "—"}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${job.status === "open" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{job.status}</span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/dashboard/company/applications?job_id=${job.id}`} className="text-primary text-xs font-bold hover:underline">
                          Applications
                        </Link>
                        <button onClick={() => toggleStatus(job)} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                          {job.status === "open" ? "Close" : "Reopen"}
                        </button>
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
