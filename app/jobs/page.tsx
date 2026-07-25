"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase";
import ClayDropdown from "@/components/ClayDropdown";

type Job = {
  id: string;
  title: string;
  domain: string;
  budget: string;
  language: string;
  event_date: string;
  created_at: string;
  status: string;
  users: { company_name: string; verification_status: string } | null;
};

const domains = ["All", "Esports", "Sports", "Media / Events", "Voice Artist", "Anchor / Host"];
const languages = ["All", "English", "Hindi", "Malayalam", "Tamil", "Telugu", "Kannada", "Spanish", "French", "Mandarin", "Multilingual"];

const domainOptions = domains.map(d => ({ value: d, label: d }));
const languageOptions = languages.map(l => ({ value: l, label: l }));

function ExploreJobsContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [domain, setDomain] = useState(searchParams.get("domain") || "All");
  const [language, setLanguage] = useState("All");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search.length > 3 || search.length === 0) {
        setDebouncedSearch(search);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from("jobs")
      .select("id, title, domain, budget, language, event_date, created_at, status, users!company_id(company_name, verification_status)")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (domain && domain !== "All") query = query.eq("domain", domain);
    if (language && language !== "All") query = query.ilike("language", `%${language}%`);
    if (debouncedSearch) query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);

    const { data } = await query;
    setJobs((data as unknown as Job[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [domain, language, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.length > 3 || search.length === 0) {
      setDebouncedSearch(search);
      fetchJobs();
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    return `${days}d ago`;
  };

  return (
    <div className="bg-background-light font-display text-navy min-h-screen">
      {/* Header */}
      <header className="flex px-6 lg:px-20 py-5 justify-between items-center bg-white/80 backdrop-blur-md border-b border-primary/10">
        <div className="flex gap-10 items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
            <img src="/logo-text.png" alt="YMUTE" className="h-6 object-contain hidden sm:block" />
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link className="text-navy/70 hover:text-primary text-sm font-semibold transition-colors" href="/explore-talent">Explore Talent</Link>
            <Link className="text-primary text-sm font-bold border-b-2 border-primary pb-1" href="/jobs">Explore Jobs</Link>
            {user && profile?.role === "company" && <Link className="text-navy/70 hover:text-primary text-sm font-semibold transition-colors" href="/dashboard/company/jobs">My Jobs</Link>}
          </nav>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          {user ? (
            <Link href={profile?.role === "caster" ? "/dashboard/caster" : "/dashboard/company"} className="clay-btn-primary text-white px-4 py-2 rounded-xl text-sm font-bold">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="clay-btn-primary text-white px-4 py-2 rounded-xl text-sm font-bold">Login</Link>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row px-6 lg:px-20 py-8 gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex flex-col gap-6 shrink-0">
          <div>
            <h1 className="text-navy text-xl font-bold">Filters</h1>
            <p className="text-primary font-medium text-sm">Refine your search</p>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-navy/40 mb-2 block">Domain</label>
              <ClayDropdown
                options={domainOptions}
                value={domain}
                onChange={(val) => setDomain(val)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-navy/40 mb-2 block">Language</label>
              <ClayDropdown
                options={languageOptions}
                value={language}
                onChange={(val) => setLanguage(val)}
              />
            </div>
          </div>
          <button onClick={() => { setDomain("All"); setLanguage("All"); setSearch(""); }} className="mt-2 w-full bg-navy-deep text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">refresh</span> Clear All
          </button>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col gap-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative flex items-center w-full shadow-clay rounded-2xl bg-white border border-primary/10 overflow-hidden">
              <div className="pl-6 text-primary"><span className="material-symbols-outlined">search</span></div>
              <input
                className="w-full py-5 px-4 bg-transparent border-none focus:ring-0 text-navy font-medium placeholder:text-navy/30"
                placeholder="Search for jobs, domains, or companies..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="bg-primary text-white mx-3 px-8 py-2.5 rounded-xl font-bold">Search</button>
            </div>
          </form>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-navy tracking-tight">Available Opportunities</h2>
              <p className="text-navy/60 font-medium">Showing {jobs.length} {jobs.length === 1 ? "job" : "jobs"}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="clay-card p-6 rounded-3xl animate-pulse h-64"></div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-primary/30 text-8xl mb-4">work_off</span>
              <h3 className="text-xl font-bold text-navy/50">No jobs found</h3>
              <p className="text-navy/30 mt-2">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="clay-card p-6 rounded-3xl shadow-clay flex flex-col gap-4" style={{ background: "#fdfcf0", border: "1px solid rgba(201, 162, 56, 0.1)", transition: "all 0.3s ease" }}>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 flex-wrap">
                      {job.users?.verification_status === "verified" && (
                        <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-blue-200 flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>verified</span> Verified
                        </span>
                      )}
                    </div>
                    <button className="text-navy/20 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">bookmark</span>
                    </button>
                  </div>
                  <div>
                    <h3 className="text-navy text-lg font-extrabold leading-tight">{job.title}</h3>
                    <p className="text-primary text-sm font-bold mt-1">{job.users?.company_name || "Company"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 mt-2 border-t border-primary/5 pt-4">
                    {job.domain && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">category</span><span className="text-navy/60 text-xs font-semibold">{job.domain}</span></div>}
                    {job.budget && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">payments</span><span className="text-navy/60 text-xs font-semibold">{job.budget}</span></div>}
                    {job.language && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">translate</span><span className="text-navy/60 text-xs font-semibold">{job.language}</span></div>}
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">schedule</span><span className="text-navy/60 text-xs font-semibold">{timeAgo(job.created_at)}</span></div>
                  </div>
                  <Link href={`/jobs/${job.id}`} className="w-full mt-4 bg-primary/10 hover:bg-primary text-primary hover:text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-primary/20">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="px-20 py-10 bg-navy-deep text-white/50 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="font-bold text-white tracking-tight">YMUTE © 2024</span>
        <div className="flex gap-8 text-sm font-medium">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}

export default function ExploreJobsPage() {
  return (
    <Suspense fallback={<div className="bg-background-light min-h-screen"></div>}>
      <ExploreJobsContent />
    </Suspense>
  );
}
