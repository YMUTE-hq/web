"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminActionButtonProps {
  userId: string;
  action: string;
  label: string;
  className?: string;
  confirm?: string;
}

export function AdminActionButton({ userId, action, label, className = "", confirm: confirmMsg }: AdminActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, action }),
      });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${className}`}>
      {loading ? "..." : label}
    </button>
  );
}

interface AdminDeleteButtonProps {
  id: string;
  endpoint: string;
  label?: string;
}

export function AdminDeleteButton({ id, endpoint, label = "Delete" }: AdminDeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-600 hover:bg-rose-200 transition-all disabled:opacity-50">
      {loading ? "..." : label}
    </button>
  );
}

interface AdminJobActionButtonProps {
  jobId: string;
  action: string;
  label: string;
  className?: string;
}

export function AdminJobActionButton({ jobId, action, label, className = "" }: AdminJobActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, action }),
      });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${className}`}>
      {loading ? "..." : label}
    </button>
  );
}

interface AdminAppStatusButtonProps {
  appId: string;
  status: string;
  label: string;
  className?: string;
}

export function AdminAppStatusButton({ appId, status, label, className = "" }: AdminAppStatusButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, status }),
      });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${className}`}>
      {loading ? "..." : label}
    </button>
  );
}

export function AdminSettingToggle({ settingKey, currentValue, label, description }: {
  settingKey: string;
  currentValue: string;
  label: string;
  description: string;
}) {
  const [value, setValue] = useState(currentValue === "true");
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const newVal = !value;
    setLoading(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value: String(newVal) }),
      });
      setValue(newVal);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-5 clay-card shadow-clay rounded-xl bg-white">
      <div>
        <p className="font-bold text-slate-800 text-sm">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-all ${value ? "bg-primary" : "bg-slate-200"} disabled:opacity-50`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export function AdminSettingInput({ settingKey, currentValue, label, description, type = "text" }: {
  settingKey: string;
  currentValue: string;
  label: string;
  description: string;
  type?: string;
}) {
  const [value, setValue] = useState(currentValue);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 clay-card shadow-clay rounded-xl bg-white">
      <p className="font-bold text-slate-800 text-sm mb-1">{label}</p>
      <p className="text-xs text-slate-500 mb-3">{description}</p>
      <div className="flex gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
        />
        <button
          onClick={save}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : saved ? "Saved!" : "Save"}
        </button>
      </div>
    </div>
  );
}

export function AdminLeaderboardPoints({ leaderboardId, currentPoints }: { leaderboardId: string; currentPoints: number }) {
  const [points, setPoints] = useState(currentPoints);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leaderboardId, points }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
        className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-slate-800"
      />
      <button
        onClick={save}
        disabled={loading || points === currentPoints}
        className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : saved ? "✓" : "Set"}
      </button>
    </div>
  );
}
