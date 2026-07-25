import { createAdminClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, Shield, CheckCircle2, Clock, XCircle,
  AlertCircle, Building, Mic, Edit3, Globe, Briefcase, Calendar
} from "lucide-react";
import AdminUserEditForm from "./AdminUserEditForm";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: u, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // Show error instead of silent 404 so we can diagnose
    return (
      <main className="flex-1 h-full overflow-y-auto p-12">
        <Link href="/dashboard/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mt-6">
          <h2 className="text-xl font-black text-red-700 mb-2">Failed to Load User</h2>
          <p className="text-red-600 text-sm font-mono">{error.message}</p>
          <p className="text-slate-500 text-sm mt-4">
            If this says <strong>column &quot;verification_status&quot; does not exist</strong>, please run the SQL migration below in your Supabase SQL Editor:
          </p>
          <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs mt-4 overflow-x-auto whitespace-pre-wrap">
{`ALTER TABLE public.users 
  DROP COLUMN IF EXISTS is_verified;
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' 
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));`}
          </pre>
        </div>
      </main>
    );
  }

  if (!u) return notFound();


  // Fetch recent applications if caster
  const { data: apps } = u.role === "caster"
    ? await supabase
        .from("applications")
        .select("id, status, created_at, jobs(title)")
        .eq("caster_id", u.id)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  // Fetch posted jobs if company
  const { data: jobs } = u.role === "company"
    ? await supabase
        .from("jobs")
        .select("id, title, status, created_at")
        .eq("company_id", u.id)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const verificationBadge = (status: string) => {
    switch (status) {
      case "verified":   return { label: "Verified",              cls: "bg-blue-100 text-blue-600",    icon: <CheckCircle2 className="w-4 h-4" /> };
      case "pending":    return { label: "Pending",               cls: "bg-amber-100 text-amber-600",  icon: <Clock className="w-4 h-4" /> };
      case "rejected":   return { label: "Rejected",              cls: "bg-red-100 text-red-600",      icon: <XCircle className="w-4 h-4" /> };
      default:           return { label: "Unverified",            cls: "bg-slate-100 text-slate-500",  icon: <AlertCircle className="w-4 h-4" /> };
    }
  };

  const roleColor = (role: string) => {
    if (role === "admin")   return "bg-purple-100 text-purple-600";
    if (role === "caster")  return "bg-blue-100 text-blue-600";
    if (role === "company") return "bg-emerald-100 text-emerald-600";
    return "bg-slate-100 text-slate-600";
  };

  const badge = verificationBadge(u.verification_status || "unverified");

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12 bg-background-light">
      {/* Back */}
      <Link href="/dashboard/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center overflow-hidden shadow-clay shrink-0">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-primary">
                {u.full_name?.substring(0, 2)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-slate-900">{u.full_name || "Unnamed User"}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${roleColor(u.role)}`}>
                {u.role}
              </span>
            </div>
            <p className="text-slate-500 mt-1">{u.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.cls}`}>
                {badge.icon} {badge.label}
              </span>
              {u.is_suspended && <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Suspended</span>}
              {u.is_banned && <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Banned</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Edit Form */}
        <div className="lg:col-span-2 space-y-8">

          {/* Verification Control Panel */}
          <section className="bg-white clay-card rounded-2xl p-8 shadow-clay">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Verification Control
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Current status: <strong className={`${badge.cls.split(" ")[1]} font-bold`}>{badge.label}</strong>. Use the buttons below to change the verification status for this user.
            </p>
            <div className="flex flex-wrap gap-3">
              <form action={`/api/admin/users/${u.id}/verify`} method="POST">
                <input type="hidden" name="status" value="verified" />
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${u.verification_status === "verified" ? "bg-blue-600 text-white cursor-default" : "bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white"}`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Verified
                </button>
              </form>
              <form action={`/api/admin/users/${u.id}/verify`} method="POST">
                <input type="hidden" name="status" value="pending" />
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${u.verification_status === "pending" ? "bg-amber-500 text-white cursor-default" : "bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white"}`}
                >
                  <Clock className="w-4 h-4" /> Set Pending
                </button>
              </form>
              <form action={`/api/admin/users/${u.id}/verify`} method="POST">
                <input type="hidden" name="status" value="rejected" />
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${u.verification_status === "rejected" ? "bg-red-600 text-white cursor-default" : "bg-red-100 text-red-700 hover:bg-red-600 hover:text-white"}`}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </form>
              <form action={`/api/admin/users/${u.id}/verify`} method="POST">
                <input type="hidden" name="status" value="unverified" />
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${u.verification_status === "unverified" ? "bg-slate-600 text-white cursor-default" : "bg-slate-100 text-slate-700 hover:bg-slate-600 hover:text-white"}`}
                >
                  <AlertCircle className="w-4 h-4" /> Reset to Unverified
                </button>
              </form>
            </div>
          </section>

          {/* Edit Form */}
          <section className="bg-white clay-card rounded-2xl p-8 shadow-clay">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" /> Edit Profile
            </h2>
            <AdminUserEditForm user={u} />
          </section>
        </div>

        {/* Right: Info + Activity */}
        <div className="space-y-6">
          {/* Profile Details */}
          <section className="bg-white clay-card rounded-2xl p-6 shadow-clay">
            <h3 className="text-base font-black text-slate-800 mb-5">Profile Details</h3>
            <dl className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400 uppercase font-semibold">Email</dt>
                  <dd className="font-medium text-slate-700 break-all">{u.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400 uppercase font-semibold">Role</dt>
                  <dd className="font-medium capitalize text-slate-700">{u.role}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-slate-400 uppercase font-semibold">Joined</dt>
                  <dd className="font-medium text-slate-700">{new Date(u.created_at).toLocaleDateString()}</dd>
                </div>
              </div>
              {u.location && (
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-400 uppercase font-semibold">Location</dt>
                    <dd className="font-medium text-slate-700">{u.location}</dd>
                  </div>
                </div>
              )}
              {u.company_name && (
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-400 uppercase font-semibold">Company</dt>
                    <dd className="font-medium text-slate-700">{u.company_name}</dd>
                  </div>
                </div>
              )}
              {u.domains?.length > 0 && (
                <div className="flex items-start gap-3">
                  <Mic className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-400 uppercase font-semibold">Domains</dt>
                    <dd className="font-medium text-slate-700">{u.domains.join(", ")}</dd>
                  </div>
                </div>
              )}
              {u.languages?.length > 0 && (
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-400 uppercase font-semibold">Languages</dt>
                    <dd className="font-medium text-slate-700">{u.languages.join(", ")}</dd>
                  </div>
                </div>
              )}
              {u.audio_sample_url && (
                <div>
                  <dt className="text-xs text-slate-400 uppercase font-semibold mb-2">Audio Sample</dt>
                  <audio controls className="w-full h-9 outline-none rounded-xl">
                    <source src={u.audio_sample_url} />
                  </audio>
                </div>
              )}
            </dl>
          </section>

          {/* Recent Activity */}
          {apps && apps.length > 0 && (
            <section className="bg-white clay-card rounded-2xl p-6 shadow-clay">
              <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Recent Applications
              </h3>
              <div className="space-y-3">
                {apps.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium line-clamp-1 mr-2">{a.jobs?.title || "—"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${a.status === "accepted" ? "bg-emerald-100 text-emerald-600" : a.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {jobs && jobs.length > 0 && (
            <section className="bg-white clay-card rounded-2xl p-6 shadow-clay">
              <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Posted Jobs
              </h3>
              <div className="space-y-3">
                {jobs.map((j: any) => (
                  <div key={j.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium line-clamp-1 mr-2">{j.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${j.status === "open" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>
                      {j.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
