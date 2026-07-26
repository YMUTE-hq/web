"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import VerificationBadge from "@/components/VerificationBadge";

type Caster = {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  domains: string[];
  languages: string[];
  rating: number;
  audio_sample_url: string;
  created_at: string;
  verification_status: string;
};

export default function CasterProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [caster, setCaster] = useState<Caster | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const viewerRole = profile?.role || "";

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    const fetchCasterData = async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("id, full_name, avatar_url, bio, domains, languages, rating, audio_sample_url, created_at, verification_status")
          .eq("id", id)
          .eq("role", "caster")
          .single();

        if (data) {
          setCaster(data as any);
          try {
            const { data: r } = await supabase
              .from("ratings")
              .select("id, rating, review, created_at, users!user_id(full_name, avatar_url)")
              .eq("caster_id", data.id)
              .order("created_at", { ascending: false })
              .limit(5);
            if (r) setReviews(r);
          } catch {}
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCasterData();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-24 min-h-screen bg-[var(--bg-light)] pb-20">
          <div className="max-w-5xl mx-auto px-6 pt-10">
            <div className="animate-pulse space-y-8">
              <div className="h-4 w-32 bg-slate-200 rounded"></div>
              <div className="clay-card-solid p-8 rounded-[2rem]">
                <div className="flex gap-8">
                  <div className="w-32 h-32 bg-slate-200 rounded-3xl"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-8 w-48 bg-slate-200 rounded"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-4 w-full bg-slate-200 rounded"></div>
                    <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !caster) {
    return (
      <>
        <Navbar />
        <main className="pt-24 min-h-screen bg-[var(--bg-light)] flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">person_off</span>
            <h2 className="text-2xl font-black text-slate-700 mb-2">Caster Not Found</h2>
            <p className="text-slate-500 mb-6">This profile doesn&apos;t exist or is unavailable.</p>
            <Link href="/explore-talent" className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition">
              Browse Talent
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-[var(--bg-light)] pb-20">
        <div className="max-w-5xl mx-auto px-6 pt-10">
          
          <Link href="/explore-talent" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-8 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Talent
          </Link>

          {/* Profile Header Card */}
          <div className="clay-card-solid p-8 md:p-12 rounded-[2rem] mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
              {/* Avatar */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {caster.avatar_url ? (
                  <img src={caster.avatar_url} alt={caster.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-6xl">face</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight">{caster.full_name}</h1>
                      <VerificationBadge status={caster.verification_status} showText={false} />
                    </div>
                    <p className="text-lg text-primary font-bold mt-1">{(caster.domains || []).join(" • ") || "Professional Caster"}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl">
                    <span className="material-symbols-outlined text-amber-500 fill-1 text-xl">star</span>
                    <span className="text-lg font-bold text-amber-700">{caster.rating || "New"}</span>
                    <span className="text-xs text-amber-600/70 ml-1">({reviews?.length || 0} reviews)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  {(caster.languages || []).map((lang: string) => (
                    <span key={lang} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide">{lang}</span>
                  ))}
                  {(!caster.languages || caster.languages.length === 0) && (
                    <span className="text-sm border border-slate-200 text-slate-400 px-3 py-1 rounded-lg">Language not specified</span>
                  )}
                </div>

                <p className="text-slate-600 leading-relaxed max-w-3xl">
                  {caster.bio || "This caster hasn't added a bio yet, but they are ready for their next big event!"}
                </p>
                
                <p className="text-xs text-slate-400 mt-6 font-medium">Joined {new Date(caster.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Media & Actions */}
            <div className="space-y-8">
              {/* Audio Sample */}
              <div className="clay-card-solid p-6 rounded-3xl">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                  <span className="material-symbols-outlined text-primary">headphones</span> Voice Reel
                </h3>
                {caster.audio_sample_url ? (
                  <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                    <audio controls className="w-full h-10 outline-none">
                      <source src={caster.audio_sample_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">mic_off</span>
                    <p className="text-sm text-slate-400">No voice reel uploaded yet.</p>
                  </div>
                )}
              </div>

              {/* Hire CTA */}
              <div className="clay-card p-6 bg-gradient-to-br from-primary to-[#a88628] rounded-3xl text-white text-center shadow-2xl shadow-primary/20">
                <h3 className="font-bold text-xl mb-2 text-navy-deep">Contact {caster.full_name.split(' ')[0]}</h3>
                <p className="text-sm mb-6 text-navy-deep/70">Invite this caster or start a conversation.</p>
                <Link href="/dashboard/company/post-job" className="block w-full py-4 bg-white text-navy-deep font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-center">
                  Create a Job
                </Link>
                {user && (viewerRole === "company" || viewerRole === "admin") && (
                  <Link href={`/dashboard/${viewerRole}/messages?userId=${caster.id}`} className="block w-full mt-3 py-3 border border-white/40 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-center">
                    Message Caster
                  </Link>
                )}
                <p className="text-[10px] mt-4 uppercase tracking-widest font-semibold text-navy-deep/50">Only companies can hire</p>
              </div>
            </div>

            {/* Right Column: Reviews */}
            <div className="lg:col-span-2 space-y-8">
              <div className="clay-card-solid p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-2xl text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">reviews</span> Reviews
                  </h3>
                </div>

                {(!reviews || reviews.length === 0) ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-3">rate_review</span>
                    <p className="text-slate-500 font-medium">No reviews yet.</p>
                    <p className="text-sm text-slate-400 mt-1">Be the first organizer to work with them!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((r: any) => (
                      <div key={r.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                              {r.users?.avatar_url ? (
                                <img src={r.users.avatar_url} alt="Reviewer" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{r.users?.full_name || "Organizer"}</p>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">{new Date(r.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`material-symbols-outlined text-sm ${star <= r.rating ? "fill-1" : "text-slate-200"}`}>star</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">&ldquo;{r.review}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
