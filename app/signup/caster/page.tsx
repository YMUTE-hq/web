"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mic, UserPlus, CloudUpload, Trash2, Youtube, Twitch, 
  ArrowRight, ArrowLeft, CheckCircle, Info, Languages, LayoutGrid, TrendingUp, 
  BookOpen, Plus, PlusCircle, Gamepad2, Trophy, Mic2, FileAudio, Radio
} from "lucide-react";

export default function CasterSignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Step 2 State (Mocked File Upload)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [workHistory, setWorkHistory] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  
  // Step 3 State
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [domains, setDomains] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!fullName || !email || !password || !confirmPassword) {
        setError("Please fill all required fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }
    setStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const { error: err, user } = await signUp(email, password, "caster", fullName, {
      bio,
      languages,
      domains
    }, true); // skipRedirect = true

    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    if (user && uploadedFile) {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("folder", "audio_reels");
      formData.append("resource_type", "auto");
      formData.append("field", "audio_sample_url");

      try {
        await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
      } catch (uploadErr) {
        console.error("Audio upload failed:", uploadErr);
        // Continue anyway since signup succeeded
      }
    }

    router.push("/dashboard/caster");
  };

  const toggleDomain = (domain: string) => {
    setDomains(prev => prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]);
  };

  const availableDomains = [
    { id: "esports", label: "Esports", icon: Gamepad2 },
    { id: "sports", label: "Sports", icon: Trophy },
    { id: "media", label: "Media / Events", icon: Mic2 },
    { id: "voice_artist", label: "Voice Artist", icon: FileAudio },
    { id: "host", label: "Anchor / Host", icon: Radio },
  ];

  return (
    <div className="bg-background-light min-h-screen font-display text-navy flex flex-col">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between sticky top-0 z-50 bg-background-light/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-clay group-hover:scale-105 transition-transform">
            <Mic className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-navy">YMUTE</h2>
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          <Link className="text-navy/60 font-bold hover:text-primary transition-colors" href="/">Home</Link>
          <Link className="text-navy/60 font-bold hover:text-primary transition-colors" href="/explore-talent">Explore Talent</Link>
          <Link className="text-navy/60 font-bold hover:text-primary transition-colors" href="/jobs">Jobs</Link>
        </nav>
        <Link href="/login" className="px-8 py-2.5 clay-btn-secondary rounded-full font-bold text-navy hover:text-primary transition-colors">
          Login
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-12 px-4">
        
        {/* Progress Stepper */}
        <div className="w-full max-w-2xl mb-12">
          <div className="flex justify-between items-center relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-1.5 bg-navy/10 -translate-y-1/2 rounded-full z-0">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            </div>
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-colors ${step >= 1 ? "bg-primary text-white" : "bg-white text-navy/40 border-4 border-white"}`}>1</div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${step >= 1 ? "text-navy" : "text-navy/40"}`}>Basic Info</span>
            </div>
            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-colors ${step >= 2 ? "bg-primary text-white" : "bg-white text-navy/40 border-4 border-white"}`}>2</div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${step >= 2 ? "text-navy" : "text-navy/40"}`}>Portfolio</span>
            </div>
            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-colors ${step >= 3 ? "bg-primary text-white" : "bg-white text-navy/40 border-4 border-white"}`}>3</div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${step >= 3 ? "text-navy" : "text-navy/40"}`}>Details</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-3xl clay-card p-8 md:p-14 mb-10">
          {error && <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm text-center">{error}</div>}

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 text-primary mb-4 shadow-clay-inner">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-navy mb-2">Create Your Caster Account</h1>
                <p className="text-navy/50 font-medium">Step 1: Let&apos;s start with your basic information.</p>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-black text-navy/60 ml-2">Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="clay-input w-full h-14 px-6 rounded-2xl focus:ring-2 focus:ring-primary/20 text-navy font-bold outline-none transition-all" placeholder="John Doe" type="text" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-black text-navy/60 ml-2">Email Address</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} className="clay-input w-full h-14 px-6 rounded-2xl focus:ring-2 focus:ring-primary/20 text-navy font-bold outline-none transition-all" placeholder="john@example.com" type="email" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-black text-navy/60 ml-2">Password</label>
                    <input value={password} onChange={e => setPassword(e.target.value)} className="clay-input w-full h-14 px-6 rounded-2xl focus:ring-2 focus:ring-primary/20 text-navy font-bold outline-none transition-all" placeholder="••••••••" type="password" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-black text-navy/60 ml-2">Confirm Password</label>
                    <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="clay-input w-full h-14 px-6 rounded-2xl focus:ring-2 focus:ring-primary/20 text-navy font-bold outline-none transition-all" placeholder="••••••••" type="password" />
                  </div>
                </div>

                <div className="pt-8 flex justify-center">
                  <button onClick={handleNext} className="clay-btn-primary min-w-[240px] h-14 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 group transition-transform hover:scale-105" type="button">
                    Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-primary font-black text-sm uppercase tracking-widest">Step 2 of 3</span>
                  <h1 className="text-3xl font-black text-navy mt-1">Portfolio & Experience</h1>
                </div>
              </div>

              <div className="space-y-8">
                <section className="flex flex-col gap-4">
                  <label className="text-lg font-black text-navy">Upload Audio Sample</label>
                  {!uploadedFile ? (
                    <label className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-12 hover:bg-primary/10 transition-all cursor-pointer">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary shadow-clay group-hover:scale-105 transition-transform">
                        <CloudUpload className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-navy font-black">Drag and drop your MP3 or WAV files here</p>
                        <p className="text-navy/50 font-bold text-sm mt-1">or click to browse your computer (Max 25MB)</p>
                      </div>
                      <div className="mt-2 px-6 py-2 clay-btn-secondary rounded-xl font-black text-sm text-navy">Select File</div>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadedFile(e.target.files[0]);
                          }
                        }} 
                      />
                    </label>
                  ) : (
                    <div className="clay-input rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shrink-0">
                        <FileAudio className="w-6 h-6" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-navy truncate pr-2">{uploadedFile.name}</p>
                          <p className="text-xs text-navy/50 shrink-0">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <div className="relative h-1.5 w-full bg-navy/10 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-primary w-full"></div>
                        </div>
                      </div>
                      <button onClick={() => setUploadedFile(null)} className="w-8 h-8 flex items-center justify-center text-navy/40 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </section>

                <section className="flex flex-col gap-3">
                  <label className="text-lg font-black text-navy">Previous Work & Experience</label>
                  <textarea value={workHistory} onChange={e => setWorkHistory(e.target.value)} className="clay-input w-full rounded-2xl p-6 text-navy font-bold placeholder:text-navy/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Tell us about the events you've casted, tournaments you've worked on, or relevant media experience..." rows={4}></textarea>
                </section>

                <section className="flex flex-col gap-3">
                  <label className="text-lg font-black text-navy">Platform Links</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-600">
                        <Youtube className="w-5 h-5" />
                      </div>
                      <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="clay-input w-full h-12 rounded-xl pl-12 pr-4 text-sm font-bold text-navy outline-none" placeholder="YouTube Channel URL" type="text" />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-purple-600">
                        <Twitch className="w-5 h-5" />
                      </div>
                      <input value={twitchUrl} onChange={e => setTwitchUrl(e.target.value)} className="clay-input w-full h-12 rounded-xl pl-12 pr-4 text-sm font-bold text-navy outline-none" placeholder="Twitch Profile URL" type="text" />
                    </div>
                  </div>
                </section>

                <div className="flex items-center justify-between pt-6 border-t border-navy/5">
                  <button onClick={handleBack} className="clay-btn-secondary px-8 py-4 rounded-2xl font-black text-navy flex items-center gap-2 hover:-translate-x-1 transition-transform">
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button onClick={handleNext} className="clay-btn-primary px-10 py-4 rounded-2xl font-black text-white text-lg flex items-center gap-2 hover:scale-105 transition-transform">
                    Continue <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="mb-10 text-center md:text-left">
                <span className="text-primary font-black text-sm uppercase tracking-widest">Step 3 of 3</span>
                <h1 className="text-3xl font-black text-navy mt-1">Tell Us More About You</h1>
                <p className="text-navy/50 font-medium mt-2">Your profile is almost ready! Just a few final details.</p>
              </div>

              <div className="space-y-10">
                {/* Languages */}
                <div className="flex flex-col gap-4">
                  <label className="text-navy text-lg font-black flex items-center gap-2">
                    <Languages className="text-primary w-5 h-5" /> Languages
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {languages.map(lang => (
                      <div key={lang} className="flex h-12 items-center justify-center gap-x-2 rounded-xl bg-primary text-white px-5 shadow-clay cursor-pointer hover:opacity-90" onClick={() => setLanguages(languages.filter(l => l !== lang))}>
                        <p className="text-sm font-black">{lang}</p>
                        <Trash2 className="w-4 h-4" />
                      </div>
                    ))}
                    <div className="flex h-12 items-center justify-center gap-x-2 rounded-xl clay-btn-secondary px-5 text-navy font-black cursor-pointer hover:scale-105 transition-transform" onClick={() => !languages.includes("Spanish") && setLanguages([...languages, "Spanish"])}>
                      <p className="text-sm">Spanish</p>
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="flex h-12 items-center justify-center gap-x-2 rounded-xl border-2 border-dashed border-primary/30 px-5 text-primary cursor-pointer hover:bg-primary/5 transition-colors">
                      <PlusCircle className="w-4 h-4" />
                      <p className="text-sm font-black">Add Others</p>
                    </div>
                  </div>
                </div>

                {/* Casting Domains */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-navy text-lg font-black flex items-center gap-2">
                      <LayoutGrid className="text-primary w-5 h-5" /> Casting Domains
                    </label>
                    <p className="text-navy/50 text-sm font-bold mt-1">Select the areas where you provide casting or hosting services.</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableDomains.map((domain) => {
                      const Icon = domain.icon;
                      const isSelected = domains.includes(domain.label);
                      return (
                        <div 
                          key={domain.id} 
                          onClick={() => toggleDomain(domain.label)}
                          className={`flex flex-col items-center justify-center p-6 h-full rounded-2xl cursor-pointer transition-all text-center ${isSelected ? 'bg-primary text-white shadow-clay scale-105' : 'clay-btn-secondary text-navy hover:-translate-y-1'}`}
                        >
                          <Icon className="w-8 h-8 mb-2" />
                          <span className="font-black text-sm leading-tight">{domain.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Experience Level */}
                <div className="flex flex-col gap-4">
                  <label className="text-navy text-lg font-black flex items-center gap-2">
                    <TrendingUp className="text-primary w-5 h-5" /> Experience Level
                  </label>
                  <select value={experience} onChange={e => setExperience(e.target.value)} className="w-full h-14 clay-input rounded-2xl px-6 text-navy font-black outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option disabled value="">Select your experience level</option>
                    <option value="entry">Entry Level (0-1 years)</option>
                    <option value="intermediate">Intermediate (2-4 years)</option>
                    <option value="expert">Expert (5+ years)</option>
                    <option value="pro">Professional / Broadcast Veteran</option>
                  </select>
                </div>

                {/* Short Bio */}
                <div className="flex flex-col gap-4">
                  <label className="text-navy text-lg font-black flex items-center gap-2">
                    <BookOpen className="text-primary w-5 h-5" /> Short Bio
                  </label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full min-h-[150px] clay-input rounded-2xl p-6 text-navy font-bold placeholder:text-navy/30 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Tell us about your casting style, favorite moments, and what makes you unique..."></textarea>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-4 pt-6 border-t border-navy/5">
                  <button onClick={handleBack} disabled={loading} className="flex-1 h-14 rounded-2xl clay-btn-secondary flex items-center justify-center gap-2 text-navy font-black hover:-translate-x-1 transition-transform disabled:opacity-50">
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-[2] h-14 rounded-2xl clay-btn-primary flex items-center justify-center gap-2 font-black text-white text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                    {loading ? "Creating Account..." : "Finish Signup"}
                    {!loading && <CheckCircle className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-navy/50 font-bold text-sm">
          <Info className="w-4 h-4" />
          <span>Need help? Check our <a className="text-primary hover:underline" href="#">Caster Profile Guide</a></span>
        </div>
      </main>

      <footer className="py-10 text-center text-navy/40 font-bold text-xs uppercase tracking-widest">
        <p>© 2024 YMUTE Professional Casting Platform</p>
      </footer>
    </div>
  );
}
