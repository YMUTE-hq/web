"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { KeyRound, ShieldCheck, Mail, ArrowLeft, CheckCircle2, Lock, Sparkles, RefreshCw } from "lucide-react";

import { useGlobalLoading } from "@/contexts/LoadingContext";

type AuthMode = "login" | "forgot_email" | "forgot_otp" | "forgot_reset" | "forgot_success";

export default function LoginPage() {
  const { signIn } = useAuth();
  const { showLoader, hideLoader } = useGlobalLoading();
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [mode, setMode] = useState<AuthMode>("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Resend Cooldown Timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // 1. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    showLoader("Authenticating & Logging in...");
    try {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const [notRegistered, setNotRegistered] = useState(false);

  // 2. Request OTP Code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setNotRegistered(false);

    if (!forgotEmail || !forgotEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP code.");
        if (data.notRegistered) {
          setNotRegistered(true);
        }
      } else {
        setSuccessMsg(data.message || "OTP code sent to your email.");
        if (data.devOtp) setDevOtpHint(data.devOtp);
        setMode("forgot_otp");
        setCooldown(60);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification OTP code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP code.");
      } else {
        setResetToken(data.resetToken);
        setSuccessMsg("OTP verified! Please set your new password.");
        setMode("forgot_reset");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit New Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          resetToken,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setSuccessMsg("Your password has been reset successfully.");
        setMode("forgot_success");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light font-display text-navy min-h-screen">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between px-10 py-6 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="Logo" className="w-10 h-10 object-contain" />
            <img src="/logo-text.svg" alt="YMUTE" className="h-6 object-contain" />
          </Link>
          <Link href="/signup" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-xl h-11 px-6 clay-button-primary text-white text-sm font-bold transition-transform hover:scale-105 active:scale-95">
            Join Now
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Form Section */}
            <div className="order-2 lg:order-1 flex flex-col gap-8">
              <div className="clay-card p-10 max-w-lg mx-auto w-full rounded-[2.5rem] relative overflow-hidden bg-white/80 backdrop-blur-xl border border-primary/10">
                
                {/* Header Navigation Tabs */}
                <div className="flex border-b border-navy/5 mb-8">
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                    className={`flex-1 pb-4 font-bold text-lg text-center transition-all ${
                      mode === "login"
                        ? "text-primary border-b-4 border-primary"
                        : "text-navy/40 hover:text-navy/60"
                    }`}
                  >
                    Login
                  </button>
                  <Link href="/signup" className="flex-1 pb-4 text-navy/40 font-bold text-lg hover:text-navy/60 transition-colors text-center">
                    Signup
                  </Link>
                </div>

                {/* Status Banners */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold mb-6 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-red-500 text-base shrink-0 mt-0.5">error</span>
                      <span>{error}</span>
                    </div>
                    {notRegistered && (
                      <Link
                        href="/signup"
                        className="mt-1 self-start inline-flex items-center gap-1 text-xs font-black text-white bg-primary px-3 py-1.5 rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
                      >
                        Register New Account &rarr;
                      </Link>
                    )}
                  </div>
                )}

                {successMsg && mode !== "forgot_success" && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-semibold mb-6 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* DEV OTP HINT BANNER FOR CONVENIENT TESTING */}
                {devOtpHint && (mode === "forgot_otp") && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-2xl text-xs mb-6">
                    <div className="flex items-center gap-2 font-black text-amber-900 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-600" /> Developer Testing Code
                    </div>
                    <p className="text-amber-800">
                      Your verification OTP is: <strong className="text-sm font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-amber-300 tracking-widest">{devOtpHint}</strong>
                    </p>
                  </div>
                )}

                {/* MODE 1: STANDARD LOGIN FORM */}
                {mode === "login" && (
                  <form className="space-y-6" onSubmit={handleLoginSubmit}>
                    <div className="space-y-2">
                      <label className="text-navy/60 text-sm font-bold ml-2">Email Address</label>
                      <input
                        className="w-full h-14 rounded-2xl clay-input px-6 text-navy font-semibold outline-none focus:ring-2 focus:ring-primary/20"
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
                        className="w-full h-14 rounded-2xl clay-input px-6 text-navy font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="••••••••"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setError("");
                          setSuccessMsg("");
                          setMode("forgot_email");
                        }}
                        className="text-primary text-xs font-black hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Forgot Password?
                      </button>
                    </div>
                    <button
                      className="w-full h-14 rounded-2xl clay-button-primary text-white font-extrabold text-lg shadow-clay-btn transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login to Dashboard"}
                    </button>
                  </form>
                )}

                {/* MODE 2: FORGOT PASSWORD - TYPE EMAIL */}
                {mode === "forgot_email" && (
                  <form className="space-y-6" onSubmit={handleRequestOtp}>
                    <div className="text-center mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Reset Your Password</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Type your registered email address and we will send you a 6-digit OTP code.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-navy/60 text-sm font-bold ml-2">Registered Email Address</label>
                      <input
                        className="w-full h-14 rounded-2xl clay-input px-6 text-navy font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="alex@example.com"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      className="w-full h-14 rounded-2xl clay-button-primary text-white font-extrabold text-base shadow-clay-btn transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Sending OTP Code..." : "Send Verification OTP Code"}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                      className="w-full text-center text-xs font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                    </button>
                  </form>
                )}

                {/* MODE 3: FORGOT PASSWORD - ENTER 6-DIGIT OTP */}
                {mode === "forgot_otp" && (
                  <form className="space-y-6" onSubmit={handleVerifyOtp}>
                    <div className="text-center mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Enter Verification OTP</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        We sent a 6-digit OTP to <strong className="text-slate-800">{forgotEmail}</strong>.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-navy/60 text-sm font-bold ml-2">6-Digit OTP Code</label>
                      <input
                        className="w-full h-14 rounded-2xl clay-input px-6 text-slate-900 font-mono text-2xl font-black tracking-widest text-center outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="••••••"
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>

                    <button
                      className="w-full h-14 rounded-2xl clay-button-primary text-white font-extrabold text-base shadow-clay-btn transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                    >
                      {loading ? "Verifying OTP..." : "Verify OTP Code"}
                    </button>

                    <div className="flex items-center justify-between text-xs font-bold pt-2">
                      <button
                        type="button"
                        onClick={() => { setMode("forgot_email"); setError(""); setSuccessMsg(""); }}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                      </button>

                      <button
                        type="button"
                        disabled={cooldown > 0 || loading}
                        onClick={handleRequestOtp}
                        className="text-primary hover:underline disabled:opacity-40 cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP Code"}
                      </button>
                    </div>
                  </form>
                )}

                {/* MODE 4: FORGOT PASSWORD - SET NEW PASSWORD */}
                {mode === "forgot_reset" && (
                  <form className="space-y-6" onSubmit={handleResetPassword}>
                    <div className="text-center mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Set New Password</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Choose a strong new password for your account.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-navy/60 text-sm font-bold ml-2">New Password</label>
                      <input
                        className="w-full h-14 rounded-2xl clay-input px-6 text-navy font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Min 8 characters"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-navy/60 text-sm font-bold ml-2">Confirm New Password</label>
                      <input
                        className="w-full h-14 rounded-2xl clay-input px-6 text-navy font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Repeat new password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>

                    <button
                      className="w-full h-14 rounded-2xl clay-button-primary text-white font-extrabold text-base shadow-clay-btn transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Updating Password..." : "Reset Password"}
                    </button>
                  </form>
                )}

                {/* MODE 5: SUCCESS CONFIRMATION */}
                {mode === "forgot_success" && (
                  <div className="text-center py-6 space-y-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Password Reset Complete!</h3>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                        Your password has been successfully updated. You can now log into your account with your new password.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEmail(forgotEmail);
                        setPassword("");
                        setError("");
                        setSuccessMsg("");
                        setMode("login");
                      }}
                      className="w-full h-14 rounded-2xl clay-button-primary text-white font-extrabold text-base shadow-clay-btn transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      Log In to Dashboard
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Right Branding Column */}
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
