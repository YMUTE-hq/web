import Link from "next/link";
import { MicOff, Home, Search, Briefcase, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background-light font-display text-navy flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/logo-icon.svg"
            alt="YMUTE Logo"
            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
          />
          <img
            src="/logo-text.svg"
            alt="YMUTE"
            className="h-6 object-contain hidden sm:block"
          />
        </Link>
        <Link
          href="/"
          className="text-xs font-bold text-navy/60 hover:text-primary transition-colors flex items-center gap-1 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-primary/10 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </header>

      {/* Main 404 Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-8 z-10 px-4">
        <div className="clay-card-solid p-8 sm:p-14 rounded-[3rem] max-w-lg w-full bg-white/90 backdrop-blur-xl border border-primary/10 shadow-clay flex flex-col items-center relative overflow-hidden">
          
          {/* 404 Badge */}
          <span className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 text-xs font-black uppercase tracking-widest mb-6 inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Error 404
          </span>

          {/* Broken Mic Visual Hero */}
          <div className="relative mb-6 group">
            {/* Outer Glow Ring */}
            <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 shadow-clay-inner relative">
              
              {/* Broken Soundwaves Left */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-40">
                <span className="w-4 h-1 bg-primary/40 rounded-full transform -rotate-12" />
                <span className="w-6 h-1 bg-primary/60 rounded-full" />
                <span className="w-3 h-1 bg-primary/40 rounded-full transform rotate-12" />
              </div>

              {/* Center Broken Microphone Vector Icon */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-slate-100 shadow-clay flex items-center justify-center text-primary relative">
                <MicOff className="w-10 h-10 text-primary drop-shadow-sm" />
                
                {/* Crack Line Accent Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-red-500/60 stroke-2" viewBox="0 0 100 100">
                  <path d="M 30 20 L 45 45 L 55 40 L 70 80" strokeDasharray="3,2" fill="none" />
                </svg>
              </div>

              {/* Broken Soundwaves Right */}
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-40">
                <span className="w-3 h-1 bg-primary/40 rounded-full transform rotate-12" />
                <span className="w-6 h-1 bg-primary/60 rounded-full" />
                <span className="w-4 h-1 bg-primary/40 rounded-full transform -rotate-12" />
              </div>
            </div>

            {/* Muted Offline Chip */}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-navy text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full tracking-wider border-2 border-white shadow-sm">
              Muted Signal
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight mb-3">
            Oops! Page Doesn&apos;t Exist
          </h1>

          {/* Subtext */}
          <p className="text-navy/60 font-medium text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
            It looks like this frequency is offline or the link you followed has been moved.
          </p>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href="/"
              className="clay-btn-primary text-white py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-clay-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex-1"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
            
            <Link
              href="/explore-talent"
              className="py-3.5 px-5 rounded-2xl bg-white text-navy hover:text-primary font-bold text-sm border border-primary/20 hover:border-primary/40 shadow-sm transition-all flex items-center justify-center gap-2 flex-1"
            >
              <Search className="w-4 h-4" />
              Explore Talent
            </Link>
          </div>

          {/* Secondary Job Link */}
          <Link
            href="/jobs"
            className="mt-4 text-xs font-bold text-navy/50 hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5" /> Or browse available jobs
          </Link>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full max-w-7xl mx-auto text-center py-4 text-xs font-medium text-navy/40">
        YMUTE &copy; {new Date().getFullYear()} &bull; Your Voice Deserves a Stage
      </footer>
    </div>
  );
}
