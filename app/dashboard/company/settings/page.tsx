"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

export default function CompanySettingsPage() {
  const { user, signOut } = useAuth();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("users").select("full_name").eq("id", user.id).single().then(({ data }) => {
        if (data) setFullName(data.full_name || "");
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await supabase.from("users").update({ full_name: fullName }).eq("id", user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-black">Company Settings</h2>
        <p className="text-slate-500">Manage your administrative account preferences</p>
      </header>

      <div className="clay-card p-6 max-w-xl rounded-2xl bg-white">
        <form onSubmit={handleSave} className="space-y-6">
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Settings saved!
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2">Administrator Name</label>
            <input
              className="clay-input p-4 rounded-2xl text-slate-800"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2">Email Address</label>
            <input
              className="clay-input p-4 rounded-2xl bg-slate-50 text-slate-400 cursor-not-allowed"
              value={user?.email || ""}
              disabled
            />
            <p className="text-[10px] text-slate-400 ml-2">Email address updates require contacting support.</p>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button type="submit" className="px-8 py-3 clay-button-primary text-white rounded-xl font-bold">
              Save Changes
            </button>
            <button
              type="button"
              onClick={signOut}
              className="text-rose-500 font-bold text-sm hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">logout</span> Logout
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
