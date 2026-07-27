"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { 
  Mic, Search, Trophy, Headphones, Gamepad2, CircleDot, Mic2, Radio,
  Star, UserCircle, MicVocal, Handshake, Briefcase, GraduationCap, Brain, 
  Quote, Globe, ArrowRight, ArrowUpRight, Calendar, IndianRupee
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  domain: string;
  budget: string;
  language: string;
  event_date: string;
  users: { company_name: string } | null;
};

interface CommunityVoice {
  id: string;
  review?: string | null;
  users?: {
    full_name?: string | null;
    role?: string | null;
    avatar_url?: string | null;
  } | null;
}

export default function LandingPageClient() {
  const { user } = useAuth();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentCasters, setRecentCasters] = useState<Partial<UserProfile>[]>([]);
  const [communityVoices, setCommunityVoices] = useState<CommunityVoice[]>([]);

  // Non-blocking async data fetch — page renders immediately, data fills in
  useEffect(() => {
    const supabase = createClient();

    // Fire all 3 queries independently — none block each other or the page
    (async () => {
      try {
        const { data } = await supabase
          .from("jobs")
          .select("id, title, domain, budget, language, event_date, users(company_name)")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(3);
        if (data) setRecentJobs(data as unknown as Job[]);
      } catch {}
    })();

    (async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("id, full_name, domains, languages, rating, avatar_url")
          .eq("role", "caster")
          .order("created_at", { ascending: false })
          .limit(4);
        if (data) setRecentCasters(data as Partial<UserProfile>[]);
      } catch {}
    })();

    (async () => {
      try {
        const { data } = await supabase
          .from("ratings")
          .select("id, review, users!ratings_user_id_fkey(full_name, role, avatar_url)")
          .not("review", "is", null)
          .order("created_at", { ascending: false })
          .limit(2);
        if (data) setCommunityVoices(data as unknown as CommunityVoice[]);
      } catch {}
    })();
  }, []);

  const domains = [
    { icon: <Gamepad2 />, name: "Esports", desc: "Professional gaming commentary.", slug: "esports" },
    { icon: <CircleDot />, name: "Sports", desc: "Live action for traditional sports.", slug: "sports" },
    { icon: <Mic2 />, name: "Media / Events", desc: "Corporate, social, and live media events.", slug: "media-events" },
    { icon: <MicVocal />, name: "Voice Artist", desc: "Commercials, narration, and character work.", slug: "voice-artist" },
    { icon: <Radio />, name: "Anchor / Host", desc: "Radio, television, and podcast hosting.", slug: "anchor-host" },
  ];

  return (
    <div className="bg-background-light font-display text-navy-deep antialiased min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      <div className="flex-grow">
        {/* Hero Section */}
        <header className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-bold text-primary tracking-wider uppercase">The Voice Marketplace</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] text-navy-deep">
              Your Voice <br />
              <span className="text-primary">Deserves a Stage</span>
            </h1>
            <p className="text-lg text-navy-muted/80 max-w-md leading-relaxed">
              Connect with professional casters for your next big event or start your journey as a world-class commentator.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <Link href={user ? "/dashboard" : "/signup?role=caster"} className="clay-btn-primary px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                <Mic className="w-5 h-5"/> I am a Caster
              </Link>
              <Link href={user ? "/explore-talent" : "/signup?role=company"} className="clay-btn-secondary px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                <Search className="w-5 h-5"/> I Need a Caster
              </Link>
            </div>
          </motion.div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="aspect-square rounded-full bg-gradient-to-br from-primary/20 to-navy-muted/10 absolute -inset-4 blur-3xl"></div>
            <div className="clay-card aspect-square rounded-[3rem] shadow-clay flex items-center justify-center p-8 relative overflow-hidden">
              <div className="w-full h-full bg-navy-muted/5 rounded-[2rem] shadow-clay-inner flex items-center justify-center">
                <MicVocal className="w-48 h-48 text-primary/40 drop-shadow-lg" />
              </div>
              <div className="absolute top-10 right-10 p-4 bg-white rounded-2xl shadow-clay animate-bounce">
                <Trophy className="text-primary w-6 h-6"/>
              </div>
              <div className="absolute bottom-10 left-10 p-4 bg-white rounded-2xl shadow-clay animate-pulse">
                <Headphones className="text-navy-muted w-6 h-6"/>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Explore Casting Domains */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-navy-deep mb-2">Explore Casting Domains</h2>
            <p className="text-navy-muted/60">Find the perfect voice for your specific niche</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {domains.map((d) => (
              <Link key={d.slug} href={`/explore-talent?domain=${d.name}`} className="block">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="clay-card p-8 rounded-2xl shadow-clay flex flex-col items-center text-center group cursor-pointer h-full"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-clay-inner group-hover:scale-110 transition-transform">
                    <span className="text-primary">{d.icon}</span>
                  </div>
                  <h3 className="font-bold text-navy-deep mb-2">{d.name}</h3>
                  <p className="text-xs text-navy-muted/60 leading-tight">{d.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Casters */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-black text-navy-deep mb-2">Featured Casters</h2>
              <p className="text-navy-muted/60">Top-rated professionals ready for your stage</p>
            </div>
            <Link href="/explore-talent" className="text-primary font-bold flex items-center gap-2">View all <ArrowRight className="w-5 h-5"/></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentCasters.length === 0 ? (
              <div className="col-span-full text-center py-10">
                <p className="text-navy-muted/60 font-bold">No featured casters available right now.</p>
              </div>
            ) : (
              recentCasters.map((caster) => (
                <div key={caster.id} className="clay-card p-6 rounded-xl shadow-clay flex flex-col items-center text-center group">
                  <div className="w-24 h-24 rounded-full bg-navy-muted/10 mb-4 p-1 shadow-clay-inner">
                    <div className="w-full h-full rounded-full bg-cover bg-center shadow-clay" style={{ backgroundImage: `url('${caster.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(caster.full_name || "Caster") + "&background=random"}')` }}></div>
                  </div>
                  <h3 className="font-bold text-lg">{caster.full_name}</h3>
                  <p className="text-primary text-sm font-semibold mb-2">{caster.domains?.[0] || "General"} • {caster.languages?.[0] || "English"}</p>
                  <div className="flex items-center gap-1 text-yellow-500 mb-6">
                    <Star className="w-4 h-4 fill-current"/>
                    <span className="text-sm font-bold text-navy-deep">{caster.rating || "New"}</span>
                  </div>
                  <Link href={`/explore-talent/${caster.id}`} className="w-full py-2.5 clay-btn-secondary rounded-lg text-sm font-bold text-navy-deep group-hover:bg-primary group-hover:text-white transition-all text-center block">View Profile</Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-navy-deep/5 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-black text-center mb-16">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { icon: <UserCircle className="w-10 h-10"/>, title: "Create Profile", desc: "Sign up and build your portfolio showcasing your best casting moments and achievements." },
                { icon: <MicVocal className="w-10 h-10"/>, title: "Showcase Your Voice", desc: "Upload audio clips and highlight reels for event organizers to review your style and energy." },
                { icon: <Handshake className="w-10 h-10"/>, title: "Get Hired", desc: "Receive offers directly or apply for featured jobs posted by top event organizers worldwide." },
              ].map((step) => (
                <div key={step.title} className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-clay flex items-center justify-center mb-6">
                    <span className="text-primary">{step.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-navy-muted/70">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Job Openings */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-black text-navy-deep mb-2">Latest Job Openings</h2>
              <p className="text-navy-muted/60">Exciting opportunities for talented voices</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentJobs.length === 0 ? (
              <div className="col-span-full text-center py-10">
                <p className="text-navy-muted/60 font-bold">No open jobs available right now.</p>
              </div>
            ) : (
              recentJobs.map((job) => (
                <div key={job.id} className="clay-card p-8 rounded-xl shadow-clay flex flex-col gap-6 relative overflow-hidden group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-navy-deep flex items-center justify-center shadow-clay-inner">
                      <Briefcase className="text-white w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1">{job.title}</h3>
                      <p className="text-sm font-medium text-navy-muted/60 line-clamp-1">{job.users?.company_name || "Company"}</p>
                    </div>
                  </div>
                  <div className="space-y-3 flex-grow">
                    <div className="flex items-center gap-2 text-sm">
                      <CircleDot className="text-primary w-4 h-4 flex-shrink-0" />
                      <span className="text-navy-muted truncate">{job.domain}</span>
                    </div>
                    {job.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <IndianRupee className="text-primary w-4 h-4 flex-shrink-0" />
                        <span className="font-bold text-navy-deep truncate">{job.budget}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="text-primary w-4 h-4 flex-shrink-0" />
                      <span className="text-navy-muted truncate">{job.language}</span>
                    </div>
                    {job.event_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="text-primary w-4 h-4 flex-shrink-0" />
                        <span className="text-navy-muted truncate">{new Date(job.event_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/jobs/${job.id}`} className="mt-auto w-full py-4 px-6 clay-btn-primary rounded-xl text-center font-bold block hover:shadow-clay-hover transition-all">
                    Apply Now
                  </Link>
                </div>
              ))
            )}
          </div>
          <div className="mt-16 flex justify-center">
            <Link href="/jobs" className="px-10 py-4 clay-btn-secondary font-black rounded-xl hover:shadow-clay-hover transition-all flex items-center gap-3">
              View All Jobs <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Learning Hub */}
        <section className="bg-navy-muted text-white py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4">Level Up Your Casting</h2>
              <p className="text-white/60">Expert resources to help you master the craft of commentary.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/5 p-8 rounded-[2rem] shadow-clay-inner backdrop-blur-sm border border-white/10 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-primary mb-6 flex items-center justify-center">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">Becoming a Caster</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-6">The ultimate roadmap for beginners entering the world of sports and esports broadcasting.</p>
                <Link href="#" className="text-primary font-bold inline-flex items-center gap-2">Learn More <ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="bg-white/5 p-8 rounded-[2rem] shadow-clay-inner backdrop-blur-sm border border-white/10 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-primary mb-6 flex items-center justify-center">
                  <MicVocal className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">Best Mics &amp; Setup</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-6">Equipment guide: From entry-level USB mics to professional XLR studio setups.</p>
                <Link href="#" className="text-primary font-bold inline-flex items-center gap-2">Read Guide <ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="bg-white/5 p-8 rounded-[2rem] shadow-clay-inner backdrop-blur-sm border border-white/10 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-primary mb-6 flex items-center justify-center">
                  <Brain className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">Improving Skills</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-6">Advanced techniques: Controlling your breath, pitch modulation, and building hype.</p>
                <Link href="#" className="text-primary font-bold inline-flex items-center gap-2">Discover <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
          </div>
        </section>

        {/* Community & Success Stories */}
        <section className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-20">
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl font-black text-navy-deep mb-6">A Community of Voices</h2>
            <p className="text-lg text-navy-muted/70 leading-relaxed mb-8">
              Join over 10,000+ casters and organizers worldwide. Share tips, network with industry veterans, and find collaborators for your next big project.
            </p>
            <Link href="/signup" className="px-8 py-4 clay-btn-primary font-bold rounded-xl flex w-fit">
              Join the Community
            </Link>
          </div>
          <div className="space-y-6">
            {communityVoices.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-navy-muted/50 font-bold">No community stories yet.</p>
              </div>
            ) : (
              communityVoices.map((voice, idx) => (
                <div key={voice.id} className={`clay-card p-6 rounded-2xl shadow-clay italic text-navy-muted/80 relative ${idx === 1 ? 'translate-x-4' : ''}`}>
                  <Quote className="absolute -top-4 -left-4 text-primary w-12 h-12 opacity-20" />
                  <p>&ldquo;{voice.review}&rdquo;</p>
                  <div className="mt-4 not-italic flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-muted/20 bg-cover bg-center" style={{ backgroundImage: `url('${voice.users?.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(voice.users?.full_name || "User")}')` }}></div>
                    <div>
                      <p className="text-sm font-bold text-navy-deep">{voice.users?.full_name || "Anonymous"}</p>
                      <p className="text-xs text-navy-muted/50 capitalize">{voice.users?.role || "Member"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center shadow-clay relative overflow-hidden">
            <div className="absolute inset-0 bg-navy-deep opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Start Your Casting Journey?</h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">Whether you&apos;re looking to hire or looking to be heard, the stage is set for you.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/signup" className="px-10 py-4 bg-white text-primary font-black rounded-xl shadow-clay hover:scale-105 transition-transform">Join Now</Link>
                <Link href="/login" className="px-10 py-4 bg-navy-deep text-white font-black rounded-xl shadow-clay hover:scale-105 transition-transform">Login</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
