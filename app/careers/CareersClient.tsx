"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, Code2, Megaphone, Palette, Cpu, Sparkles, 
  MapPin, Clock, ArrowRight, Mail, X, ChevronRight, Building, DollarSign
} from "lucide-react";

type Career = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements?: string;
  salary_range?: string;
  apply_email?: string;
  apply_url?: string;
  created_at: string;
};

const DEPARTMENTS = [
  { id: "all", label: "All Departments", icon: Briefcase },
  { id: "Engineering", label: "Engineering & Tech", icon: Code2 },
  { id: "PR & Marketing", label: "PR & Communications", icon: Megaphone },
  { id: "Product & Design", label: "Product & Design", icon: Palette },
  { id: "Operations", label: "Operations & Media", icon: Cpu },
];

export default function CareersClient() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const res = await fetch("/api/careers");
        if (res.ok) {
          const data = await res.json();
          setCareers(data || []);
        }
      } catch (err) {
        console.error("Error fetching careers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCareers();
  }, []);

  const filteredCareers = careers.filter((c) => {
    if (selectedDept === "all") return true;
    return c.department.toLowerCase().includes(selectedDept.toLowerCase());
  });

  return (
    <div className="bg-background-light font-display text-navy-deep antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-16">
          <div className="clay-card-solid p-10 md:p-16 rounded-[2.5rem] relative overflow-hidden text-center md:text-left bg-white/70 backdrop-blur-xl border border-primary/10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <div className="max-w-3xl relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-6">
                <Sparkles className="w-4 h-4" /> YMUTE Internal Team Careers
              </span>

              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
                Build the Next Generation of <span className="text-primary">Live Broadcasting</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-8">
                We are building the infrastructure and marketplace for professional casters, esports broadcasts, and live media events. Join our core engineering, product, and communications team.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <a 
                  href="#openings" 
                  className="clay-btn-primary text-white font-extrabold px-8 py-4 rounded-2xl shadow-clay-primary text-sm flex items-center gap-2 transition-all hover:scale-105"
                >
                  View Current Openings <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="mailto:careers@ymute.com?subject=General Inquiry - YMUTE Team" 
                  className="px-6 py-4 rounded-2xl border border-slate-200 hover:border-primary text-slate-700 font-bold text-sm transition-all hover:bg-primary/5 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-primary" /> Contact Recruiting
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Culture / Value Props Section */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="clay-card p-8 rounded-3xl bg-white/60 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">High Impact Engineering</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Work on real-time WebSocket audio streaming, low-latency audio processing, and resilient cloud architectures.
              </p>
            </div>

            <div className="clay-card p-8 rounded-3xl bg-white/60 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-6">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Remote-First Culture</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Work from anywhere with flexible hours, async-first workflows, and team retreats across major esports hub cities.
              </p>
            </div>

            <div className="clay-card p-8 rounded-3xl bg-white/60 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Competitive Compensation</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Top-tier salaries, performance bonuses, equity options, and wellness allowances for all core team members.
              </p>
            </div>
          </div>
        </section>

        {/* Open Positions Section */}
        <section id="openings" className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Open Positions</h2>
              <p className="text-slate-500 font-medium mt-1">Explore career opportunities inside the YMUTE organization</p>
            </div>

            {/* Department Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {DEPARTMENTS.map((dept) => {
                const Icon = dept.icon;
                const active = selectedDept === dept.id;
                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
                      active
                        ? "bg-slate-900 text-white shadow-md"
                        : "bg-white/80 text-slate-600 border border-slate-200 hover:border-primary hover:text-primary"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{dept.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job List / Empty State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="clay-card p-8 rounded-3xl animate-pulse h-32 bg-white/60"></div>
              ))}
            </div>
          ) : filteredCareers.length === 0 ? (
            /* Empty State Container */
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="clay-card-solid p-12 md:p-16 rounded-[2.5rem] text-center bg-white/80 border border-primary/10 max-w-3xl mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6 relative">
                <Briefcase className="w-10 h-10" />
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center border-2 border-white">
                  0
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-3">No Openings Available Right Now</h3>
              
              <p className="text-slate-600 font-medium leading-relaxed max-w-lg mx-auto mb-8">
                There are currently no active job postings available for YMUTE&apos;s teams. Please check back later as we post new roles regularly.
              </p>

              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 max-w-md mx-auto mb-8 text-left">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed font-medium">
                    <strong>Want to get in touch anyway?</strong> We are always open to hearing from exceptional software engineers, audio researchers, and PR specialists.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href="mailto:careers@ymute.com?subject=Unsolicited Application - YMUTE Team"
                  className="clay-btn-primary text-white font-bold px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shadow-clay-primary hover:scale-105 transition-all"
                >
                  <Mail className="w-4 h-4" /> Drop Your Resume / CV
                </a>
                <Link
                  href="/explore-talent"
                  className="px-6 py-3.5 rounded-xl border border-slate-200 hover:border-slate-400 font-bold text-slate-700 text-sm transition-colors"
                >
                  Browse Talent Platform
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Open Positions Grid */
            <div className="space-y-4">
              {filteredCareers.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="clay-card p-8 rounded-3xl bg-white hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-black uppercase tracking-wide">
                        {c.department}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {c.location}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {c.type}
                      </span>
                      {c.salary_range && (
                        <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200">
                          <DollarSign className="w-3 h-3" /> {c.salary_range}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 max-w-3xl">
                      {c.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedCareer(c)}
                    className="clay-btn-primary text-white font-extrabold px-6 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shrink-0 shadow-clay-primary hover:scale-105 transition-all"
                  >
                    View Role Details <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Role Details Modal */}
      <AnimatePresence>
        {selectedCareer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative border border-slate-100"
            >
              <button
                onClick={() => setSelectedCareer(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-black uppercase tracking-wide">
                  {selectedCareer.department}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                  {selectedCareer.location}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                  {selectedCareer.type}
                </span>
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-4">{selectedCareer.title}</h2>

              {selectedCareer.salary_range && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Salary Range: {selectedCareer.salary_range}
                </div>
              )}

              <div className="space-y-6 mb-8 text-slate-700 text-sm leading-relaxed">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base mb-2">Role Overview</h4>
                  <p className="whitespace-pre-line">{selectedCareer.description}</p>
                </div>

                {selectedCareer.requirements && (
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base mb-2">Requirements & Qualifications</h4>
                    <p className="whitespace-pre-line text-slate-600">{selectedCareer.requirements}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedCareer(null)}
                  className="px-5 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 text-sm hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <a
                  href={selectedCareer.apply_url || `mailto:${selectedCareer.apply_email || "careers@ymute.com"}?subject=Application for ${encodeURIComponent(selectedCareer.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-btn-primary text-white font-extrabold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-clay-primary hover:scale-105 transition-all"
                >
                  <Mail className="w-4 h-4" /> Apply for this Position
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
