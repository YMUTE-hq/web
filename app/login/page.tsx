"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="bg-background-light font-display text-navy min-h-screen">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between px-10 py-6 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 object-contain" />
            <img src="/logo-text.png" alt="YMUTE" className="h-6 object-contain" />
          </Link>
          <Link href="/signup" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-xl h-11 px-6 clay-button-primary text-white text-sm font-bold transition-transform hover:scale-105 active:scale-95">
            Join Now
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 flex flex-col gap-8">
              <div className="clay-card p-10 max-w-lg mx-auto w-full rounded-[2.5rem]">
                <div className="flex border-b border-navy/5 mb-8">
                  <span className="flex-1 pb-4 text-primary border-b-4 border-primary font-bold text-lg text-center">Login</span>
                  <Link href="/signup" className="flex-1 pb-4 text-navy/40 font-bold text-lg hover:text-navy/60 transition-colors text-center">Signup</Link>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-navy/60 text-sm font-bold ml-2">Email Address</label>
                    <input
                      className="w-full h-14 rounded-2xl clay-input px-6 text-navy"
                      placeholder="alex@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-navy/60 text-sm font-bold ml-2">Password</label>
                    <input
                      className="w-full h-14 rounded-2xl clay-input px-6 text-navy"
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <a className="text-primary text-xs font-bold hover:underline" href="#">Forgot Password?</a>
                  </div>
                  <button
                    className="w-full h-14 rounded-2xl clay-button-primary text-white font-bold text-lg shadow-clay-btn transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login to Dashboard"}
                  </button>
                </form>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8 lg:pt-8">
              <div className="space-y-4 text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-black text-navy leading-tight">
                  Elevate your <span className="text-primary">casting</span> experience.
                </h1>
                <p className="text-navy/60 text-lg font-medium max-w-md mx-auto lg:mx-0">
                  Join the premiere community for aspiring talent and competitive gaming enthusiasts.
                </p>
              </div>
              <div className="space-y-5">
                {[
                  { icon: "star", title: "Rate Casters", desc: "Provide feedback to emerging broadcast talent.", color: "text-orange-500", bg: "bg-orange-100" },
                  { icon: "sports_esports", title: "Community Games", desc: "Play and compete in weekly community-led tournaments.", color: "text-blue-500", bg: "bg-blue-100" },
                  { icon: "person_search", title: "Discover Talent", desc: "Find the next big names in the esports scene.", color: "text-purple-500", bg: "bg-purple-100" },
                  { icon: "event_available", title: "Follow Events", desc: "Never miss a major event with our custom calendar.", color: "text-green-500", bg: "bg-green-100" },
                ].map((f) => (
                  <div key={f.title} className="clay-card p-5 lg:p-6 flex items-center gap-5 transition-transform hover:-translate-y-1">
                    <div className={`w-14 h-14 shrink-0 rounded-2xl ${f.bg} flex items-center justify-center ${f.color} shadow-clay-inner`}>
                      <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-lg">{f.title}</h4>
                      <p className="text-sm text-navy/50">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <footer className="py-8 px-10 text-center text-navy/40 text-sm font-medium">
          © 2024 YMUTE. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
