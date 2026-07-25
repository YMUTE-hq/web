"use client";
import { useState } from "react";
import { Save, Loader2 } from "lucide-react";

export default function AdminUserEditForm({ user }: { user: any }) {
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    bio: user.bio || "",
    location: user.location || "",
    company_name: user.company_name || "",
    role: user.role || "user",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save changes.");
      } else {
        setSuccess("Profile updated successfully!");
      }
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Full Name</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="clay-input w-full h-12 px-4 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="clay-input w-full h-12 px-4 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
          >
            <option value="user">User</option>
            <option value="caster">Caster</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="City, Country"
            className="clay-input w-full h-12 px-4 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Company Name</label>
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            placeholder="Only applicable for companies"
            className="clay-input w-full h-12 px-4 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Bio</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={4}
          placeholder="Short bio or description..."
          className="clay-input w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="clay-btn-primary px-8 py-3 rounded-xl text-white font-black text-sm flex items-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
