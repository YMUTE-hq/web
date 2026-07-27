"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

export default function CasterSettingsPage() {
  const { user, profile, signOut } = useAuth();
  const supabase = createClient();
  const [form, setForm] = useState({ full_name: "", bio: "", location: "" });
  const [saved, setSaved] = useState(false);

  // OSM geocoding suggestions states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
      });
      setLocationQuery(profile.location || "");
    }
  }, [profile]);

  // Click outside to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Geocoding query effect
  useEffect(() => {
    if (locationQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await supabase.from("users").update(form).eq("id", user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500">Manage your account preferences</p>
      </header>
      <div className="clay-card-solid p-6 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {saved && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"><span className="material-symbols-outlined text-sm">check_circle</span> Settings saved!</div>}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2">Full Name</label>
            <input className="clay-input p-4 rounded-2xl" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2">Bio</label>
            <textarea className="clay-input p-4 rounded-2xl resize-none" rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Tell companies about yourself..." />
          </div>
          <div className="flex flex-col gap-2 relative" ref={suggestionRef}>
            <label className="text-sm font-bold ml-2">Location</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
              <input
                className="clay-input p-4 pl-12 rounded-2xl w-full text-slate-800"
                value={locationQuery}
                placeholder="City, Country"
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setForm((f) => ({ ...f, location: e.target.value }));
                }}
              />
              {loadingSuggestions && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 z-50 clay-card-solid rounded-2xl shadow-lg border border-slate-100 max-h-60 overflow-y-auto bg-white">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, location: s.name }));
                        setLocationQuery(s.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-5 py-3 text-sm hover:bg-primary/10 hover:text-primary transition-colors font-semibold text-slate-800 border-b border-slate-50 last:border-b-0"
                    >
                      📍 {s.name}
                      </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <button type="submit" className="px-8 py-3 clay-button-primary text-white rounded-xl font-bold">Save Changes</button>
            <button type="button" onClick={signOut} className="text-rose-500 font-bold text-sm hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">logout</span> Logout
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
