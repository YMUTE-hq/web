"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [form, setForm] = useState({ company_name: "", bio: "", location: "" });
  const [logoUrl, setLogoUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  // OSM geocoding suggestions states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      supabase.from("users").select("*").eq("id", user.id).single().then(({ data }) => {
        if (data) {
          setForm({
            company_name: data.company_name || "",
            bio: data.bio || "",
            location: data.location || "",
          });
          setLogoUrl(data.company_logo_url || "");
          setLocationQuery(data.location || "");
        }
      });
    }
  }, [user]);

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
          const items = data.map((item: any) => ({
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", e.target.files[0]);
    fd.append("folder", "logos");
    fd.append("resource_type", "image");
    fd.append("field", "company_logo_url");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setLogoUrl(data.url);
    setUploading(false);
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-black">Company Profile</h2>
        <p className="text-slate-500">Manage how your company is displayed to casters</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Editor */}
        <div className="lg:col-span-2 clay-card p-6 rounded-2xl bg-white">
          <form onSubmit={handleSave} className="space-y-6">
            {saved && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Profile updated successfully!
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-2">Company Name</label>
              <input
                className="clay-input p-4 rounded-2xl text-slate-800"
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                placeholder="e.g. YMUTE Media"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-2">Company Bio</label>
              <textarea
                className="clay-input p-4 rounded-2xl resize-none text-slate-800"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell casters about your brand, matches, or events..."
              />
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
                  <div className="absolute left-0 right-0 mt-2 z-50 clay-card rounded-2xl shadow-clay overflow-hidden bg-white/95 backdrop-blur-md border border-white/40 max-h-60 overflow-y-auto">
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
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-2">Company Logo</label>
              <label className={`cursor-pointer p-8 border-2 border-dashed rounded-3xl flex flex-col items-center gap-4 transition-colors ${uploading ? "border-primary/50 bg-primary/10" : "border-primary/20 bg-primary/5 hover:bg-primary/10"}`}>
                {logoUrl && !uploading ? (
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-clay-inner">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-4xl text-primary">
                    {uploading ? "hourglass_empty" : "cloud_upload"}
                  </span>
                )}
                <div className="text-center">
                  <p className="font-bold text-navy">
                    {uploading ? "Uploading..." : (logoUrl ? "Logo uploaded. Click to change." : "Click to upload your company logo")}
                  </p>
                  <p className="text-xs text-navy/50 mt-1">PNG, JPG up to 5MB</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
              </label>
            </div>
            <button type="submit" className="px-8 py-3 clay-button-primary text-white rounded-xl font-bold w-full">Save Profile</button>
          </form>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold ml-2 text-slate-700">Live Preview</h3>
          <div className="clay-card p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl text-center shadow-lg">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white border-2 border-primary/20 shadow-md flex items-center justify-center overflow-hidden mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-primary text-3xl">business</span>
              )}
            </div>
            <h4 className="font-black text-xl text-navy truncate">{form.company_name || "Company Name"}</h4>
            <p className="text-xs text-primary font-bold uppercase mt-1 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span> Verified Organizer
            </p>
            <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {form.location || "City, Country"}
            </p>
            <hr className="my-4 border-primary/10" />
            <p className="text-xs text-slate-500 text-left line-clamp-4 leading-relaxed h-16">
              {form.bio || "Provide a bio on the left to tell casters about your company goals, match schedules, and more."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
