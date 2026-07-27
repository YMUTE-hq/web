"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

export default function CasterProfilePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [form, setForm] = useState({ full_name: "", bio: "", languages: "", domains: "" });
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
          if (data) {
            setForm({
              full_name: data.full_name || "",
              bio: data.bio || "",
              languages: (data.languages || []).join(", "),
              domains: (data.domains || []).join(", "),
            });
            setAudioUrl(data.audio_sample_url || "");
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await supabase.from("users").update({
        full_name: form.full_name, bio: form.bio,
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        domains: form.domains.split(",").map((s) => s.trim()).filter(Boolean),
      }).eq("id", user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", e.target.files[0]);
      fd.append("folder", "audio");
      fd.append("resource_type", "auto");
      fd.append("field", "audio_sample_url");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setAudioUrl(data.url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">My Profile</h2>
        <p className="text-slate-500">Showcase yourself to companies</p>
      </header>
      <div className="clay-card-solid p-6 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {saved && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"><span className="material-symbols-outlined text-sm">check_circle</span> Profile saved!</div>}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2">Full Name</label>
            <input className="clay-input p-4 rounded-2xl" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2">Bio</label>
            <textarea className="clay-input p-4 rounded-2xl resize-none" rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="5+ years experience casting top-tier events..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2">Languages (comma-separated)</label>
            <input className="clay-input p-4 rounded-2xl" value={form.languages} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} placeholder="English, Hindi, Spanish" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2">Domains (comma-separated)</label>
            <input className="clay-input p-4 rounded-2xl" value={form.domains} onChange={(e) => setForm((f) => ({ ...f, domains: e.target.value }))} placeholder="Esports, Sports" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2">Audio Sample</label>
            <label className={`cursor-pointer p-8 border-2 border-dashed rounded-3xl flex flex-col items-center gap-4 transition-colors ${uploading ? "border-primary/50 bg-primary/10" : "border-primary/20 bg-primary/5 hover:bg-primary/10"}`}>
              <span className="material-symbols-outlined text-4xl text-primary">
                {uploading ? "hourglass_empty" : (audioUrl ? "check_circle" : "cloud_upload")}
              </span>
              <div className="text-center">
                <p className="font-bold text-navy">
                  {uploading ? "Uploading..." : (audioUrl ? "Audio sample uploaded" : "Click to upload your audio demo")}
                </p>
                <p className="text-xs text-navy/50 mt-1">MP3, WAV up to 10MB</p>
              </div>
              <input type="file" className="hidden" accept="audio/*" onChange={handleAudioUpload} disabled={uploading} />
            </label>
            {audioUrl && !uploading && (
              <div className="flex items-center justify-end gap-2 mt-2">
                <a href={audioUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">play_arrow</span> Listen to uploaded sample
                </a>
              </div>
            )}
          </div>
          <button type="submit" className="px-8 py-3 clay-button-primary text-white rounded-xl font-bold w-full">Save Profile</button>
        </form>
      </div>
    </>
  );
}
