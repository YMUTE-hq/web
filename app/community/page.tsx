import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "YMUTE Community | Discussions & Networking",
  description: "Join the largest community of casting professionals and event organizers.",
};

const DISCUSSIONS = [
  {
    id: 1,
    author: "Alex Rivers",
    role: "Esports Caster",
    avatar: "",
    time: "2 hours ago",
    content: "What's everyone's setup like for remote casting? I'm currently using a Shure SM7B with a GoXLR, but looking for good travel-friendly alternatives for when I'm on the road.",
    likes: 24,
    comments: 12,
    tags: ["Gear", "Setup", "Remote"]
  },
  {
    id: 2,
    author: "Global Events Co",
    role: "Organizer",
    avatar: "",
    time: "5 hours ago",
    content: "We're looking for multilingual casters for an upcoming marathon series in Europe. Spanish, French, and German speakers highly requested. Will be posting the formal job opening soon, but wanted to see who's active here!",
    likes: 89,
    comments: 45,
    tags: ["Opportunities", "Networking"]
  },
  {
    id: 3,
    author: "Sarah Chen",
    role: "Voice Artist",
    avatar: "",
    time: "1 day ago",
    content: "Just hit 100 completed jobs on YMUTE! Huge thanks to the community here for the constant feedback and support. Drop your voice reels below, I'd love to listen to new talent.",
    likes: 156,
    comments: 82,
    tags: ["Milestone", "Community"]
  }
];

const LEADERBOARD = [
  { rank: 1, name: "Marcus H.", score: "14,250", badge: "🏆" },
  { rank: 2, name: "Elena V.", score: "12,900", badge: "🥈" },
  { rank: 3, name: "David K.", score: "11,400", badge: "🥉" },
  { rank: 4, name: "Sarah C.", score: "9,850", badge: "" },
  { rank: 5, name: "Team Liquid", score: "8,900", badge: "" },
];

export default function CommunityPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-[var(--bg-light)] pb-20">
        
        {/* Header */}
        <div className="bg-navy-deep text-white py-16 relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Community Hub</h1>
              <p className="text-lg text-white/70 max-w-xl">Discuss gear, share opportunities, network with industry professionals, and climb the leaderboards.</p>
            </div>
            <button className="clay-btn-primary px-8 py-4 font-bold text-white rounded-xl shadow-clay flex items-center gap-2 whitespace-nowrap">
              <span className="material-symbols-outlined">edit_square</span> New Post
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-10">
          
          {/* Main Feed */}
          <div className="space-y-6">
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {["All Discussions", "Opportunities", "Gear & Setup", "Milestones", "Q&A"].map((tab, i) => (
                <button 
                  key={tab} 
                  className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${i === 0 ? "bg-primary text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {DISCUSSIONS.map((post) => (
              <div key={post.id} className="clay-card-solid p-6 rounded-3xl group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border-2 border-primary/20">
                      <span className="material-symbols-outlined text-slate-400">person</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{post.author}</h3>
                      <p className="text-xs text-primary font-bold">{post.role}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{post.time}</span>
                </div>
                
                <p className="text-slate-700 leading-relaxed mb-4">{post.content}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-slate-100/80 text-slate-500 rounded-md text-[10px] uppercase font-bold tracking-wider">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                  <button className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors text-sm font-bold group/btn">
                    <span className="material-symbols-outlined text-lg group-hover/btn:scale-110 transition-transform">thumb_up</span> {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors text-sm font-bold group/btn">
                    <span className="material-symbols-outlined text-lg group-hover/btn:scale-110 transition-transform">chat_bubble</span> {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors text-sm font-bold ml-auto opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-lg">share</span>
                  </button>
                </div>
              </div>
            ))}

            <button className="w-full py-4 text-center text-primary font-bold bg-primary/5 rounded-2xl hover:bg-primary/10 transition-colors">
              Load More Discussions
            </button>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            
            {/* Top Contributors Leaderboard */}
            <div className="clay-card-solid p-6 rounded-3xl bg-gradient-to-b from-white to-slate-50">
              <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">social_leaderboard</span> 
                Top Contributors
              </h3>
              
              <div className="space-y-4">
                {LEADERBOARD.map((user) => (
                  <div key={user.rank} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${user.rank === 1 ? 'bg-amber-100 text-amber-600' : user.rank === 2 ? 'bg-slate-200 text-slate-500' : user.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>
                        {user.rank}
                      </div>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
                        {user.name} {user.badge}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {user.score} pts
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 text-center text-sm font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                View Full Leaderboard
              </button>
            </div>

            {/* Trending Tags */}
            <div className="clay-card-solid p-6 rounded-3xl">
              <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">trending_up</span> 
                Trending Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {["#ValorantCasting", "#MicSetup", "#EventLogistics", "#VoiceReels", "#HiringTips", "#RemoteWork"].map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-primary hover:text-white cursor-pointer transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
