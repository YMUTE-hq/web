"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { use } from "react";

type Job = {
  id: string;
  title: string;
  domain: string;
  budget: string;
  language: string;
  event_date: string;
  event_duration: string;
  event_mode: string;
  location: string;
  description: string;
  casters_needed: number;
  status: string;
  created_at: string;
  users: {
    id: string;
    company_name: string;
    avatar_url: string;
    company_logo_url: string;
    bio: string;
    verification_status: string;
  } | null;
};

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => { setJob(data); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (user && profile?.role === "caster") {
      fetch("/api/applications")
        .then((r) => r.json())
        .then((apps) => {
          const applied = Array.isArray(apps) && apps.some((a: { job_id: string }) => a.job_id === id);
          setHasApplied(applied);
        });
    }
  }, [user, profile, id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    setError("");
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: id, message }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to apply"); }
    else { setSuccess("Application submitted! We will notify you when the company responds."); setHasApplied(true); setShowApplyForm(false); }
    setApplying(false);
  };

  if (loading) return (
    <div className="bg-background-light min-h-screen flex items-center justify-center">
      <div className="text-primary text-2xl font-bold animate-pulse">Loading...</div>
    </div>
  );

  if (!job) return (
    <div className="bg-background-light min-h-screen flex items-center justify-center">
      <div className="text-navy/50 text-xl">Job not found</div>
    </div>
  );

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-primary/10 px-6 md:px-20 py-4 sticky top-0 bg-background-light/80 backdrop-blur-md z-50">
        <Link href="/jobs" className="flex items-center gap-4 text-primary">
          <div className="size-8 flex items-center justify-center rounded-lg bg-primary/10">
            <span className="material-symbols-outlined text-primary">grid_view</span>
          </div>
          <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-[-0.015em]">YMUTE</h2>
        </Link>
        <div className="flex gap-3">
          <Link href="/jobs" className="text-navy/60 text-sm font-semibold hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span> All Jobs
          </Link>
        </div>
      </header>

      <main className="flex flex-1 justify-center py-8 px-4 md:px-0">
        <div className="flex flex-col max-w-[800px] flex-1 gap-8">
          {/* Job Header */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="clay-card aspect-square rounded-xl h-32 w-32 flex items-center justify-center overflow-hidden border-2 border-primary/20 bg-primary/5">
                {job.users?.company_logo_url ? (
                  <img src={job.users.company_logo_url} alt={job.users.company_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-5xl">business</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-slate-900 text-3xl font-extrabold leading-tight tracking-tight">{job.title}</h1>
                <div className="flex items-center gap-2">
                  <p className="text-primary text-lg font-semibold">{job.users?.company_name || "Company"}</p>
                  {job.users?.verification_status === "verified" && <span className="material-symbols-outlined text-blue-500 text-lg" title="Verified Employer">verified</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <span className="flex items-center gap-1 text-slate-500 text-sm">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  {job.domain && <span className="flex items-center gap-1 text-slate-500 text-sm"><span className="material-symbols-outlined text-sm">category</span>{job.domain}</span>}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="clay-card flex flex-col gap-1 rounded-xl p-5 border border-primary/10">
                <p className="text-slate-500 text-sm font-medium">Budget</p>
                <p className="text-slate-900 tracking-tight text-xl font-bold">{job.budget || "Negotiable"}</p>
              </div>
              <div className="clay-card flex flex-col gap-1 rounded-xl p-5 border border-primary/10">
                <p className="text-slate-500 text-sm font-medium">Language</p>
                <p className="text-slate-900 tracking-tight text-xl font-bold">{job.language || "Any"}</p>
              </div>
              <div className="clay-card flex flex-col gap-1 rounded-xl p-5 border border-primary/10">
                <p className="text-slate-500 text-sm font-medium">Casters Needed</p>
                <p className="text-slate-900 tracking-tight text-xl font-bold">{job.casters_needed || 1}</p>
              </div>
            </div>
          </section>

          {/* Event Details */}
          <section className="clay-card rounded-xl p-6 border border-primary/10">
            <h3 className="text-slate-900 text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span> Event Details
            </h3>
            <div className="space-y-4">
              {job.event_mode && (
                <div className="flex justify-between items-center py-3 border-b border-primary/5">
                  <p className="text-slate-500 font-medium">Event Mode</p>
                  <p className="text-slate-900 font-semibold px-3 py-1 bg-primary/10 rounded-full text-sm capitalize">{job.event_mode}</p>
                </div>
              )}
              {job.event_date && (
                <div className="flex justify-between items-center py-3 border-b border-primary/5">
                  <p className="text-slate-500 font-medium">Event Date</p>
                  <p className="text-slate-900 font-semibold">{new Date(job.event_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              )}
              {job.event_duration && (
                <div className="flex justify-between items-center py-3 border-b border-primary/5">
                  <p className="text-slate-500 font-medium">Duration</p>
                  <p className="text-slate-900 font-semibold">{job.event_duration}</p>
                </div>
              )}
              {job.location && (
                <div className="flex justify-between items-center py-3">
                  <p className="text-slate-500 font-medium">Location</p>
                  <p className="text-slate-900 font-semibold">{job.location}</p>
                </div>
              )}
            </div>
          </section>

          {/* Description */}
          {job.description && (
            <section className="flex flex-col gap-4">
              <h3 className="text-slate-900 text-xl font-bold">Full Job Description</h3>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</div>
            </section>
          )}

          {/* Company Info */}
          {job.users && (
            <section className="clay-card rounded-xl p-6 border border-primary/10 bg-primary/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-14 rounded-full bg-white border-2 border-primary overflow-hidden flex items-center justify-center">
                  {job.users.company_logo_url ? (
                    <img src={job.users.company_logo_url} alt={job.users.company_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-primary text-2xl">business</span>
                  )}
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-lg flex items-center gap-1">
                    {job.users.company_name}
                    {job.users.verification_status === "verified" && <span className="material-symbols-outlined text-blue-500 text-base">verified</span>}
                  </h4>
                  <p className="text-slate-500 text-sm">Event Organizer</p>
                </div>
              </div>
              {job.users.bio && <p className="text-slate-600 text-sm leading-relaxed">{job.users.bio}</p>}
            </section>
          )}

          {/* Success / Error */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">check_circle</span> {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {/* Apply Form */}
          {showApplyForm && (
            <section className="clay-card rounded-xl p-6 border border-primary/10">
              <h3 className="text-slate-900 text-xl font-bold mb-4">Your Application</h3>
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-navy/60 ml-2 block mb-2">Cover Message (optional)</label>
                  <textarea
                    className="clay-input w-full p-4 rounded-2xl resize-none"
                    rows={4}
                    placeholder="Introduce yourself, share your experience, and why you're perfect for this role..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowApplyForm(false)} className="flex-1 py-3 rounded-xl clay-button-secondary font-bold">
                    Cancel
                  </button>
                  <button type="submit" disabled={applying} className="flex-1 py-3 rounded-xl clay-button-primary font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                    <span className="material-symbols-outlined text-sm">send</span>
                    {applying ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Apply CTA */}
          {!showApplyForm && !success && (
            <div className="sticky bottom-6 mt-4">
              {!user ? (
                <Link href={`/login`} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">login</span> Login to Apply
                </Link>
              ) : profile?.role !== "caster" ? (
                <div className="w-full bg-navy/10 text-navy/40 font-bold py-5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <span className="material-symbols-outlined">info</span> Only casters can apply
                </div>
              ) : hasApplied ? (
                <div className="w-full bg-green-500 text-white font-bold py-5 rounded-xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">check_circle</span> Application Submitted
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyForm(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2 group"
                >
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
                  Apply for this Job
                </button>
              )}
            </div>
          )}

          <footer className="py-12 text-center">
            <p className="text-slate-400 text-xs">© 2024 YMUTE Talent Hub. All rights reserved.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
