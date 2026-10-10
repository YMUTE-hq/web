import Link from "next/link";
import { Globe, Video, Share2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy-deep text-white pt-20 pb-10 w-full relative z-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <img src="/logo-icon.svg" alt="Logo" className="w-10 h-10 object-contain" />
            <img src="/logo-text.svg" alt="YMUTE" className="h-5 object-contain filter brightness-0 invert" />
          </div>
          <p className="text-white/50 text-sm leading-relaxed">
            The world&apos;s leading marketplace for broadcasting talent and events. Empowering voices everywhere.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6">Platform</h4>
          <ul className="space-y-4 text-white/60 text-sm">
            <li><Link className="hover:text-primary transition-colors" href="/explore-talent">Find Casters</Link></li>
            <li><Link className="hover:text-primary transition-colors" href="/jobs">Browse Jobs</Link></li>
            <li><Link className="hover:text-primary transition-colors" href="/community">Community</Link></li>
            <li><Link className="hover:text-primary transition-colors" href="/games">Games</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Company</h4>
          <ul className="space-y-4 text-white/60 text-sm">
            <li><Link className="hover:text-primary transition-colors" href="/careers">Careers</Link></li>
            <li><Link className="hover:text-primary transition-colors" href="/explore-talent">Explore Talent</Link></li>
            <li><Link className="hover:text-primary transition-colors" href="/jobs">Jobs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Social</h4>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
              <Globe className="w-5 h-5"/>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
              <Video className="w-5 h-5"/>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
              <Share2 className="w-5 h-5"/>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-white/30 text-xs">© 2024 YMUTE. All rights reserved.</p>
        <div className="flex gap-8 text-white/30 text-xs">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Cookie Policy</span>
        </div>
      </div>
    </footer>
  );
}
