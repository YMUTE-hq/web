"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import VerificationBadge from "@/components/VerificationBadge";
import ClayDropdown from "@/components/ClayDropdown";
import { createClient } from "@/lib/supabase";
import LogoLoader from "@/components/ui/LogoLoader";

type Caster = {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  domains: string[];
  languages: string[];
  rating: number;
  verification_status?: string | null;
};

const DOMAINS = ["All Domains", "Esports", "Sports", "Media / Events", "Voice Artist", "Anchor / Host / RJ"];
const LANGUAGES = ["English", "Hindi", "Malayalam", "Tamil", "Telugu", "Kannada", "Spanish", "French", "German", "Japanese"];

const languageOptions = [
  { value: "", label: "Any Language" },
  ...LANGUAGES.map(l => ({ value: l, label: l }))
];

export default function ExploreTalentClient({ initialCasters }: { initialCasters: Caster[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [domain, setDomain] = useState(searchParams.get("domain") || "All Domains");
  const [language, setLanguage] = useState(searchParams.get("language") || "");
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "0");

  const [casters, setCasters] = useState<Caster[]>(initialCasters);
  const [loading, setLoading] = useState(true);

  // Fetch casters from database
  const fetchCasters = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("users")
        .select("id, full_name, avatar_url, bio, domains, languages, rating, verification_status")
        .eq("role", "caster")
        .order("created_at", { ascending: false });

      if (domain && domain !== "All Domains") {
        query = query.contains("domains", [domain]);
      }
      if (language) {
        query = query.contains("languages", [language]);
      }
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`);
      }

      const { data } = await query;
      setCasters((data as unknown as Caster[]) || []);
    } catch (err) {
      console.error(err);
      setCasters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasters();
  }, [domain, language, searchParams]);

  // Debouncing search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search.length > 3 || search.length === 0) {
        const currentSearch = searchParams.get("search") || "";
        if (search !== currentSearch) {
          applyFilters({ search });
        }
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const applyFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "All Domains" && value !== "0") params.set(key, value);
      else params.delete(key);
    });
    router.push(`/explore-talent?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.length > 3 || search.length === 0) {
      applyFilters({ search });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 pt-10 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
      {/* Sidebar Filters */}
      <aside className="space-y-8">
        <div className="clay-card-solid p-6 rounded-3xl">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">filter_list</span> Filters
          </h3>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-3 block">Domain</label>
              <div className="space-y-2">
                {DOMAINS.map((d) => (
                  <label key={d} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="domain"
                      checked={domain === d}
                      onChange={() => {
                        setDomain(d);
                        applyFilters({ domain: d });
                      }}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                    />
                    <span className={`text-sm ${domain === d ? "font-bold text-slate-900" : "text-slate-600 group-hover:text-slate-900"}`}>{d}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <label className="text-sm font-bold text-slate-700 mb-3 block">Language</label>
              <ClayDropdown
                options={languageOptions}
                value={language}
                onChange={(val) => {
                  setLanguage(val);
                  applyFilters({ language: val });
                }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              setSearch("");
              setDomain("All Domains");
              setLanguage("");
              setMinRating("0");
              applyFilters({ search: "", domain: "All Domains", language: "", rating: "0" });
            }}
            className="w-full mt-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">refresh</span> Clear All Filters
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="space-y-8">
        {/* Search Bar */}
        <div className="clay-card-solid p-4 rounded-3xl">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search by caster name or bio keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full clay-input p-4 pl-12 rounded-2xl text-sm"
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-xl hover:bg-primary/90 transition">
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="min-h-[400px] w-full flex items-center justify-center py-16">
            <LogoLoader size="lg" label="Searching Talent Directory..." />
          </div>
        ) : casters.length === 0 ? (
          <div className="clay-card-solid p-16 text-center rounded-[2rem] border border-slate-100">
            <span className="material-symbols-outlined text-primary/30 text-7xl block mb-4">person_search</span>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No casters found</h3>
            <p className="text-slate-500">Try adjusting your filters to see more results.</p>
            <button
              onClick={() => { setSearch(""); setDomain("All Domains"); setLanguage(""); setMinRating("0"); applyFilters({ search: "", domain: "All Domains", language: "", rating: "0" }); }}
              className="mt-6 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {casters.map((caster) => (
              <div key={caster.id} className="clay-card p-6 rounded-3xl group hover:shadow-xl transition-all border border-transparent hover:border-primary/20 bg-white/60">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {caster.avatar_url ? (
                      <img src={caster.avatar_url} alt={caster.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-3xl">face</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <span className="material-symbols-outlined text-amber-500 text-[16px] fill-1">star</span>
                    <span className="text-xs font-bold text-amber-700">{caster.rating || "New"}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{caster.full_name}</h3>
                    {caster.verification_status === "verified" && (
                      <VerificationBadge status="verified" showText={false} />
                    )}
                  </div>
                  <p className="text-sm text-primary font-bold mt-1 line-clamp-1">{(caster.domains || []).join(", ") || "Caster"}</p>
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10">
                  {caster.bio || "Available for casting opportunities. View profile for more details."}
                </p>

                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  {(caster.languages || []).slice(0, 3).map((lang) => (
                    <span key={lang} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">{lang}</span>
                  ))}
                  {(caster.languages?.length || 0) > 3 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">+{caster.languages.length - 3}</span>
                  )}
                </div>

                <Link href={`/explore-talent/${caster.id}`} className="block w-full text-center py-3 clay-button-secondary text-slate-800 font-bold rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
