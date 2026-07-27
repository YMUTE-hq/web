"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LANGUAGES_LIST } from "@/lib/languages";

const DOMAINS = ["Esports", "Sports", "Media / Events", "Voice Artist", "Anchor / Host / RJ"];

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventMode, setEventMode] = useState("online");
  const [form, setForm] = useState({
    title: "", domain: "Esports", language: "", casters_needed: 1,
    event_date: "", event_duration: "", location: "",
    budget: "", payment_type: "fixed", description: "",
  });

  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [popularLocations, setPopularLocations] = useState<string[]>([]);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [languageQuery, setLanguageQuery] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showLangSuggestions, setShowLangSuggestions] = useState(false);
  const langSuggestionRef = useRef<HTMLDivElement>(null);

  const set = (key: string, val: string | number) => setForm((f) => ({ ...f, [key]: val }));

  // Sync selected languages with the main form state
  useEffect(() => {
    set("language", selectedLanguages.join(", "));
  }, [selectedLanguages]);

  // Click-away listener for language dropdown
  useEffect(() => {
    function handleClickOutsideLang(event: MouseEvent) {
      if (langSuggestionRef.current && !langSuggestionRef.current.contains(event.target as Node)) {
        setShowLangSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideLang);
    return () => document.removeEventListener("mousedown", handleClickOutsideLang);
  }, []);

  // Fetch previously used locations from jobs table for cache
  useEffect(() => {
    const fetchPopularLocations = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("jobs")
          .select("location")
          .neq("location", "Online")
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (data) {
          const unique = Array.from(new Set(data.map((j) => j.location).filter(Boolean)));
          setPopularLocations(unique);
        }
      } catch (err) {
        console.error("Failed to fetch popular locations:", err);
      }
    };
    fetchPopularLocations();
  }, []);

  // Handle click outside suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync event mode and location
  useEffect(() => {
    if (eventMode === "online") {
      set("location", "Online");
      setLocationQuery("Online");
    } else {
      if (form.location === "Online") {
        set("location", "");
        setLocationQuery("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventMode]);

  // Geocoding query effect
  useEffect(() => {
    if (locationQuery.length < 3 || locationQuery === "Online") {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        // Bias results to India via viewbox (approx: 68.1 to 97.4 long, 8.0 to 35.5 lat) and bounded=0 (priority bias)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&featuretype=settlement&viewbox=68.1,8.0,97.4,35.5&bounded=0&limit=5`,
          {
            headers: {
              "User-Agent": "YMUTE-Voice-Marketplace-App/1.0"
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          const items = data.map((item: { display_name: string }) => ({
            name: item.display_name
          }));
          setSuggestions(items);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("OSM Geocoding Error:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [locationQuery]);

  const handleSubmit = async (e: React.FormEvent, status = "open") => {
    e.preventDefault();
    setError("");

    if (form.event_date) {
      const selectedDate = new Date(form.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setError("Event date cannot be in the past");
        return;
      }
    }

    setLoading(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, event_mode: eventMode, status }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to post job"); setLoading(false); return; }
    router.push("/dashboard/company/jobs");
  };

  const localMatches = locationQuery && locationQuery !== "Online"
    ? popularLocations.filter(loc => loc.toLowerCase().includes(locationQuery.toLowerCase()))
    : popularLocations.slice(0, 5);

  const filteredSuggestions = suggestions.filter(
    s => !localMatches.some(m => m.toLowerCase() === s.name.toLowerCase())
  );

  const filteredLanguages = languageQuery
    ? LANGUAGES_LIST.filter(
        (lang) =>
          lang.toLowerCase().includes(languageQuery.toLowerCase()) &&
          !selectedLanguages.includes(lang)
      ).slice(0, 5)
    : LANGUAGES_LIST.filter((lang) => !selectedLanguages.includes(lang)).slice(0, 5);

  return (
    <>
      <header className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Post New Job</h2>
          <p className="text-slate-500">Create opportunities for world-class casting talent</p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto pb-20">
        <div className="clay-card p-8 bg-white/60 rounded-[2rem]">
          <form className="space-y-8" onSubmit={(e) => handleSubmit(e, "open")}>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold ml-2">Event Name / Job Title</label>
                <input className="clay-input p-4 rounded-2xl" placeholder="e.g. World Esports Finals 2024" type="text" value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold ml-2">Casting Domain</label>
                <select className="clay-input p-4 rounded-2xl appearance-none" value={form.domain} onChange={(e) => set("domain", e.target.value)}>
                  {DOMAINS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2" ref={langSuggestionRef}>
                <label className="text-sm font-bold ml-2">Languages Required</label>
                <div className="relative">
                  {selectedLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedLanguages.map((lang) => (
                        <span
                          key={lang}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-xl shadow-clay-inner border border-primary/20"
                        >
                          {lang}
                          <button
                            type="button"
                            onClick={() => setSelectedLanguages((prev) => prev.filter((l) => l !== lang))}
                            className="hover:text-red-500 transition-colors text-xs font-medium"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    className="clay-input p-4 rounded-2xl w-full"
                    placeholder="Type language (e.g. English, Hindi)..."
                    type="text"
                    value={languageQuery}
                    onFocus={() => setShowLangSuggestions(true)}
                    onChange={(e) => {
                      setLanguageQuery(e.target.value);
                      setShowLangSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && languageQuery.trim()) {
                        e.preventDefault();
                        const match = LANGUAGES_LIST.find(
                          (l) => l.toLowerCase() === languageQuery.trim().toLowerCase()
                        );
                        const valueToAdd = match || languageQuery.trim();
                        if (!selectedLanguages.includes(valueToAdd)) {
                          setSelectedLanguages((prev) => [...prev, valueToAdd]);
                        }
                        setLanguageQuery("");
                        setShowLangSuggestions(false);
                      }
                    }}
                  />
                  {showLangSuggestions && filteredLanguages.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 z-50 clay-card rounded-2xl shadow-clay overflow-hidden bg-white/95 backdrop-blur-md border border-white/40 max-h-60 overflow-y-auto">
                      {filteredLanguages.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            if (!selectedLanguages.includes(lang)) {
                              setSelectedLanguages((prev) => [...prev, lang]);
                            }
                            setLanguageQuery("");
                            setShowLangSuggestions(false);
                          }}
                          className="w-full text-left px-5 py-3 text-sm hover:bg-primary/10 hover:text-primary transition-colors font-medium border-b border-slate-50 last:border-b-0"
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold ml-2">No. of Casters Needed</label>
                <input className="clay-input p-4 rounded-2xl" placeholder="2" type="number" min={1} value={form.casters_needed} onChange={(e) => set("casters_needed", parseInt(e.target.value))} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold ml-2">Event Date</label>
                <input className="clay-input p-4 rounded-2xl" type="date" min={new Date().toISOString().split("T")[0]} value={form.event_date} onChange={(e) => set("event_date", e.target.value)} required />
              </div>
            </div>

            {/* Logistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold ml-2">Event Duration (Hours)</label>
                <input className="clay-input p-4 rounded-2xl" placeholder="e.g. 5 Hours" type="text" value={form.event_duration} onChange={(e) => set("event_duration", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold ml-2">Event Mode</label>
                <div className="flex gap-2 p-1 clay-input rounded-2xl">
                  {["online", "offline"].map((m) => (
                    <button key={m} type="button" onClick={() => setEventMode(m)} className={`flex-1 py-3 rounded-xl font-bold capitalize ${eventMode === m ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2" ref={suggestionRef}>
                <label className="text-sm font-bold ml-2">Location</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
                  <input
                    className="clay-input p-4 pl-12 rounded-2xl w-full"
                    placeholder={eventMode === "online" ? "Online" : "e.g. Mumbai, India"}
                    type="text"
                    disabled={eventMode === "online"}
                    value={eventMode === "online" ? "Online" : locationQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      set("location", e.target.value);
                    }}
                  />
                  {loadingSuggestions && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {showSuggestions && eventMode !== "online" && (localMatches.length > 0 || filteredSuggestions.length > 0) && (
                    <div className="absolute left-0 right-0 mt-2 z-50 clay-card rounded-2xl shadow-clay overflow-hidden bg-white/95 backdrop-blur-md border border-white/40 max-h-60 overflow-y-auto">
                      {/* Local / Popular Matches */}
                      {localMatches.length > 0 && (
                        <div className="bg-slate-50/50">
                          <div className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            {locationQuery ? "Matches from Previous Jobs" : "Recently Used Locations"}
                          </div>
                          {localMatches.map((name, idx) => (
                            <button
                              key={`local-${idx}`}
                              type="button"
                              onClick={() => {
                                set("location", name);
                                setLocationQuery(name);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-5 py-3 text-sm hover:bg-primary/10 hover:text-primary transition-colors font-semibold text-navy-deep border-b border-slate-50 last:border-b-0"
                            >
                              📍 {name}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Global OSM Matches */}
                      {filteredSuggestions.length > 0 && (
                        <div>
                          {localMatches.length > 0 && (
                            <div className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                              Search Results (Biased to India)
                            </div>
                          )}
                          {filteredSuggestions.map((s, idx) => (
                            <button
                              key={`global-${idx}`}
                              type="button"
                              onClick={() => {
                                set("location", s.name);
                                setLocationQuery(s.name);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-5 py-3 text-sm hover:bg-primary/10 hover:text-primary transition-colors font-medium border-b border-slate-50 last:border-b-0"
                            >
                              🗺️ {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span> Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold ml-2">Budget (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
                    <input className="clay-input p-4 pl-8 rounded-2xl w-full" placeholder="10,000" type="text" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold ml-2">Payment Type</label>
                  <div className="flex gap-4 items-center h-full pt-2">
                    {["fixed", "hourly"].map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="paytype" checked={form.payment_type === t} onChange={() => set("payment_type", t)} className="w-5 h-5 text-primary border-slate-300 focus:ring-primary" />
                        <span className="text-sm font-medium capitalize">{t} Rate</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-2">Event Description</label>
              <textarea className="clay-input p-4 rounded-2xl resize-none" placeholder="Describe the role, game knowledge needed, and any specific requirements..." rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6">
              <button type="button" onClick={(e) => handleSubmit(e as React.MouseEvent<HTMLButtonElement> as unknown as React.FormEvent, "draft")} disabled={loading} className="px-8 py-4 rounded-2xl clay-button-secondary font-bold text-slate-600 transition-all disabled:opacity-60">
                Save Draft
              </button>
              <button type="submit" disabled={loading} className="px-10 py-4 rounded-2xl clay-button-primary font-bold shadow-xl flex items-center gap-2 disabled:opacity-60">
                <span className="material-symbols-outlined">rocket_launch</span>
                {loading ? "Publishing..." : "Publish Job"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
