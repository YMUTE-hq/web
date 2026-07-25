"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignupForm() {
  const { signUp } = useAuth();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "caster";

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(defaultRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error: err } = await signUp(email, password, role, fullName);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="bg-background-light font-display text-navy min-h-screen">
      <div className="flex h-full grow flex-col">
        <header className="flex items-center justify-between px-10 py-6 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 object-contain" />
            <img src="/logo-text.png" alt="YMUTE" className="h-6 object-contain" />
          </Link>
          <Link href="/login" className="text-sm font-bold text-navy/60 hover:text-primary transition-colors">
            Already have an account? <span className="text-primary">Login</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="order-2 lg:order-1 flex flex-col gap-8">
              <div className="clay-card p-8 lg:p-10 w-full mx-auto rounded-[2.5rem]">
                <div className="flex border-b border-navy/5 mb-8">
                  <Link href="/login" className="flex-1 pb-4 text-navy/40 font-bold text-lg hover:text-navy/60 transition-colors text-center">Login</Link>
                  <span className="flex-1 pb-4 text-primary border-b-4 border-primary font-bold text-lg text-center">Signup</span>
                </div>

                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-center lg:text-left">
                      <h2 className="text-2xl font-black text-navy mb-2">Join YMUTE</h2>
                      <p className="text-navy/50 text-sm">Choose your role to get started</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { value: "caster", icon: "mic", label: "Caster", desc: "Showcase talent & find jobs" },
                        { value: "company", icon: "business", label: "Company", desc: "Post jobs & hire casters" }
                      ].map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`flex flex-col items-center text-center gap-3 p-6 rounded-3xl border-2 transition-all ${role === r.value ? "border-primary bg-primary/5 shadow-clay-inner" : "border-transparent clay-card hover:-translate-y-1"}`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-1 ${role === r.value ? "bg-primary text-white shadow-clay-btn" : "bg-navy/5 text-navy/40"}`}>
                            <span className="material-symbols-outlined text-3xl">{r.icon}</span>
                          </div>
                          <div>
                            <span className={`block text-lg font-bold mb-1 ${role === r.value ? "text-primary" : "text-navy"}`}>{r.label}</span>
                            <span className="block text-xs font-medium text-navy/50">{r.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (role === "caster") window.location.href = "/signup/caster";
                        else setStep(2);
                      }}
                      className="w-full h-14 rounded-2xl clay-button-primary text-white font-bold text-lg shadow-clay-btn transition-transform hover:scale-[1.02] active:scale-[0.98] mt-4"
                    >
                      Continue as {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center lg:text-left">
                      <button type="button" onClick={() => setStep(1)} className="text-primary text-sm font-bold flex items-center justify-center lg:justify-start gap-1 mb-4 hover:underline mx-auto lg:mx-0">
                        <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                      </button>
                      <h2 className="text-2xl font-black text-navy mb-2">Create your account</h2>
                      <p className="text-navy/50 text-sm">Signing up as <span className="text-primary font-bold capitalize">{role}</span></p>
                    </div>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-navy/60 text-sm font-bold ml-2">Full Name</label>
                        <input
                          className="w-full h-14 rounded-2xl clay-input px-6 text-navy focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder={role === "company" ? "Company Name" : "Your full name"}
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-navy/60 text-sm font-bold ml-2">Email Address</label>
                        <input
                          className="w-full h-14 rounded-2xl clay-input px-6 text-navy focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="you@example.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-navy/60 text-sm font-bold ml-2">Password</label>
                        <input
                          className="w-full h-14 rounded-2xl clay-input px-6 text-navy focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="••••••••"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-navy/60 text-sm font-bold ml-2">Confirm Password</label>
                        <input
                          className="w-full h-14 rounded-2xl clay-input px-6 text-navy focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="••••••••"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-2">
                      <input className="mt-1 rounded-md text-primary focus:ring-primary border-navy/20" id="terms" type="checkbox" required />
                      <label className="text-sm text-navy/60 leading-snug" htmlFor="terms">
                          I agree to the <a className="text-primary font-bold hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-bold hover:underline" href="#">Privacy Policy</a>.
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 rounded-2xl clay-button-primary text-white font-bold text-lg shadow-clay-btn transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-8 lg:pt-8">
              <div className="space-y-4 text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-black text-navy leading-tight">
                  Join the <span className="text-primary">YMUTE</span> Community
                </h1>
                <p className="text-navy/60 text-lg font-medium max-w-md mx-auto lg:mx-0">
                  Discover talent, rate casters, and participate in community games.
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="bg-background-light min-h-screen flex items-center justify-center"><div className="text-primary font-bold">Loading...</div></div>}>
      <SignupForm />
    </Suspense>
  );
}
