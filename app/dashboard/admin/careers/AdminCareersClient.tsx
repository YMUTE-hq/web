"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, Plus, Trash2, Edit3, CheckCircle, Eye, EyeOff, 
  MapPin, Clock, DollarSign, Mail, AlertTriangle, RefreshCw, X, Sparkles 
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
  status: "open" | "closed" | "draft";
  created_at: string;
};

export default function AdminCareersClient() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    salary_range: "Competitive",
    description: "",
    requirements: "",
    apply_email: "careers@ymute.com",
    apply_url: "",
    status: "open" as "open" | "closed" | "draft"
  });

  const fetchCareers = async () => {
    setLoading(true);
    setErrorNotice(false);
    try {
      const res = await fetch("/api/admin/careers");
      if (res.ok) {
        const data = await res.json();
        setCareers(data || []);
      } else {
        setErrorNotice(true);
      }
    } catch {
      setErrorNotice(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary_range: "Competitive",
      description: "",
      requirements: "",
      apply_email: "careers@ymute.com",
      apply_url: "",
      status: "open"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Career) => {
    setEditingId(c.id);
    setFormData({
      title: c.title,
      department: c.department,
      location: c.location,
      type: c.type,
      salary_range: c.salary_range || "Competitive",
      description: c.description,
      requirements: c.requirements || "",
      apply_email: c.apply_email || "careers@ymute.com",
      apply_url: c.apply_url || "",
      status: c.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setSubmitting(true);
    try {
      const url = editingId ? `/api/admin/careers/${editingId}` : "/api/admin/careers";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCareers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save position");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (c: Career) => {
    const newStatus = c.status === "open" ? "closed" : "open";
    try {
      const res = await fetch(`/api/admin/careers/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchCareers();
    } catch {
      alert("Failed to toggle status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this career posting?")) return;
    try {
      const res = await fetch(`/api/admin/careers/${id}`, { method: "DELETE" });
      if (res.ok) fetchCareers();
    } catch {
      alert("Failed to delete position.");
    }
  };

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-lg uppercase tracking-wider">
              Organization Hiring
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">YMUTE Core Team Careers</h2>
          <p className="text-slate-500 mt-1">Manage internal job postings for YMUTE engineering, PR, and operations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCareers}
            className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="clay-btn-primary text-white font-extrabold px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shadow-clay-primary hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" /> Post New YMUTE Role
          </button>
        </div>
      </header>

      {/* SQL Setup Warning if Table doesn't exist yet */}
      {errorNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-amber-900">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900 mb-1">Database Table Missing or Unreachable</h4>
              <p className="text-xs text-amber-800 leading-relaxed mb-3">
                If you haven&apos;t created the <code>public.careers</code> table in Supabase yet, please run the SQL migration script located at:
                <code className="block bg-amber-100/80 px-2 py-1 rounded text-[11px] font-mono mt-1">supabase/migrations/20260726_create_careers_table.sql</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Careers List Table / Cards */}
      <div className="clay-card-solid bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> Active Job Postings ({careers.length})
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {careers.filter(c => c.status === "open").length} Open Roles
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm font-medium">Loading career postings...</p>
          </div>
        ) : careers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h4 className="text-slate-700 font-extrabold text-base mb-1">No Internal Openings Posted</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              Currently there are no open positions listed for YMUTE&apos;s internal engineering or PR teams. Public visitors seeing <code>/careers</code> will be informed that no openings are currently available.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              + Create First Job Opening
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {careers.map((c) => (
              <div 
                key={c.id}
                className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      c.status === "open" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                      c.status === "closed" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-700"
                    }`}>
                      {c.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
                      {c.department}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.location}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {c.type}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-slate-900">{c.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(c)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      c.status === "open"
                        ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    }`}
                    title={c.status === "open" ? "Close Role" : "Re-open Role"}
                  >
                    {c.status === "open" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{c.status === "open" ? "Close" : "Set Open"}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(c)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Edit Role"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {editingId ? "Edit YMUTE Role" : "Create New YMUTE Role"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Post an internal job position for YMUTE organization (Engineering, PR, Marketing, Operations).
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Full-Stack Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-0 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-0 text-sm font-semibold"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="PR & Marketing">PR & Marketing</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Employment Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-0 text-sm font-semibold"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / Bengaluru, India"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-0 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g. $100k - $130k or Competitive"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-0 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Role Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe key responsibilities and expectations for this role..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-0 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Requirements & Qualifications</label>
                <textarea
                  rows={3}
                  placeholder="List skills, required experience, tech stack..."
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-0 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Application Email</label>
                  <input
                    type="email"
                    value={formData.apply_email}
                    onChange={(e) => setFormData({ ...formData, apply_email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-0 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-0 text-sm font-semibold"
                  >
                    <option value="open">Open (Publicly Visible)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="closed">Closed (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="clay-btn-primary text-white font-extrabold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-clay-primary hover:scale-105 transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingId ? "Update Role" : "Post Job Opening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
