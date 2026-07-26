"use client";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

type Application = {
  id: string;
  status: string;
  created_at: string;
  message: string;
  users: { id: string; full_name: string; avatar_url: string; bio: string; languages: string[]; domains: string[]; audio_sample_url: string } | null;
  jobs: { id: string; title: string } | null;
};

function ApplicationsContent() {
  const { user } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchApps = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from("applications")
        .select("id, status, created_at, message, users!caster_id(id, full_name, avatar_url, bio, languages, domains, audio_sample_url), jobs(id, title)")
        .order("created_at", { ascending: false });

      if (jobId) query = query.eq("job_id", jobId);
      else {
        const { data: jobs } = await supabase.from("jobs").select("id").eq("company_id", user.id);
        const jobIds = jobs?.map((j) => j.id) || [];
        if (jobIds.length === 0) { setApplications([]); return; }
        query = query.in("job_id", jobIds);
      }
      const { data } = await query;
      setApplications((data as unknown as Application[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, [user, jobId]);

  const updateStatus = async (id: string, status: string) => {
    setProcessing(id);
    try {
      await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchApps();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (s: string) => {
    if (s === "accepted") return "bg-emerald-100 text-emerald-600";
    if (s === "rejected") return "bg-rose-100 text-rose-600";
    return "bg-amber-100 text-amber-600";
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-black">Applications</h2>
        <p className="text-slate-500">{jobId ? "Applications for this job" : "All applications across your jobs"}</p>
      </header>

      <div className="clay-card p-6 rounded-2xl">
        {loading ? (
          <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-primary/30 text-7xl block mb-4">person_search</span>
            <p className="text-slate-400 font-semibold text-lg">No applications yet</p>
            <p className="text-slate-300 text-sm mt-2">Share your job listing to attract casters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Link href={`/explore-talent/${app.users?.id}`} className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 hover:scale-105 transition-transform block">
                      {app.users?.avatar_url ? (
                        <img src={app.users.avatar_url} alt={app.users.full_name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-2xl">person</span>
                      )}
                    </Link>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        <Link href={`/explore-talent/${app.users?.id}`} className="hover:text-primary hover:underline transition-colors">
                          {app.users?.full_name || "Caster"}
                        </Link>
                      </h3>
                      {app.jobs?.title && <p className="text-xs text-primary font-bold">For: {app.jobs.title}</p>}
                      {(app.users?.domains?.length ?? 0) > 0 && <p className="text-xs text-slate-500 mt-0.5">{app.users!.domains.join(", ")}</p>}
                      {(app.users?.languages?.length ?? 0) > 0 && <p className="text-xs text-slate-400">{app.users!.languages.join(", ")}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusBadge(app.status)}`}>{app.status}</span>
                    {app.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(app.id, "accepted")}
                          disabled={processing === app.id}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">check</span> Accept
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, "rejected")}
                          disabled={processing === app.id}
                          className="px-4 py-2 rounded-xl bg-rose-100 text-rose-600 text-xs font-bold hover:bg-rose-200 transition-colors disabled:opacity-60 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">close</span> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {app.message && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600 italic">&ldquo;{app.message}&rdquo;</p>
                  </div>
                )}
                {app.users?.audio_sample_url && (
                  <div className="mt-4 flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
                    <span className="material-symbols-outlined text-primary">headphones</span>
                    <span className="text-sm font-semibold text-navy">Audio Sample</span>
                    <a href={app.users.audio_sample_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-bold hover:underline ml-auto">Listen →</a>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-3">Applied {new Date(app.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function CompanyApplicationsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse"><div className="h-8 bg-slate-100 rounded mb-4 w-48"/></div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
