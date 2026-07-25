import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Play & Predict | YMUTE",
  description: "Test your casting knowledge and predict match outcomes to climb the leaderboard.",
};

const GAMES = [
  {
    id: 1,
    title: "Valorant Masters Prediction",
    type: "Prediction",
    status: "Live",
    participants: 1240,
    reward: "1,000 pts",
    description: "Predict the correct map scores for the upcoming Grand Finals.",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    icon: "sports_esports"
  },
  {
    id: 2,
    title: "Casting Terminology Quiz #4",
    type: "Quiz",
    status: "Live",
    participants: 450,
    reward: "500 pts",
    description: "Test your knowledge of advanced broadcasting terms and techniques.",
    image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=2070&auto=format&fit=crop",
    icon: "quiz"
  },
  {
    id: 3,
    title: "The 'Hype' Challenge",
    type: "Voice Challenge",
    status: "Closed",
    participants: 89,
    reward: "Exclusive Badge",
    description: "Record your best 30-second hype cast for a pre-selected clip. Community votes on the winner.",
    image: "https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?q=80&w=1974&auto=format&fit=crop",
    icon: "mic_external_on"
  }
];

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-[var(--bg-light)] pb-20">
        
        {/* Header */}
        <div className="bg-navy-deep text-white py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-navy-deep to-transparent"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <span className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-2xl mb-6 shadow-clay border border-primary/30">
              <span className="material-symbols-outlined text-primary text-4xl">emoji_events</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Play, Predict, Win</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Engage with the community through casting challenges, trivia quizzes, and match predictions. Earn points and unlock exclusive dashboard badges!
            </p>
          </div>
        </div>

        {/* Dashboard/Stats Banner */}
        <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
          <div className="clay-card-solid bg-white p-6 md:p-8 rounded-3xl flex flex-col md:flex-row shadow-xl justify-around items-center gap-8">
            <div className="text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Your Score</p>
              <p className="text-4xl font-black text-primary">2,450</p>
            </div>
            <div className="w-px h-16 bg-slate-100 hidden md:block"></div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Global Rank</p>
              <p className="text-4xl font-black text-slate-800">#428</p>
            </div>
            <div className="w-px h-16 bg-slate-100 hidden md:block"></div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Active Streaks</p>
              <p className="text-4xl font-black text-amber-500 flex items-center justify-center gap-2">
                4 <span className="material-symbols-outlined text-2xl fill-1">local_fire_department</span>
              </p>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900">Active Challenges</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm font-bold">Past Events</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {GAMES.map((game) => (
              <div key={game.id} className="clay-card bg-white rounded-3xl overflow-hidden group flex flex-col hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-2xl">
                {/* Image Header */}
                <div className="h-48 relative overflow-hidden">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                  
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm ${game.status === 'Live' ? 'bg-green-500 text-white' : 'bg-slate-800 text-white'}`}>
                      {game.status === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                      {game.status}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/20">
                      {game.type}
                    </span>
                    <span className="flex items-center gap-1 text-white font-bold text-sm">
                      <span className="material-symbols-outlined text-amber-400 text-lg">hotel_class</span>
                      {game.reward}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-black text-xl text-slate-900 mb-2 line-clamp-1">{game.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 flex-1">{game.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">group</span>
                      {game.participants.toLocaleString()} joined
                    </div>
                    
                    <button className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${game.status === 'Live' ? 'clay-btn-primary text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                      {game.status === 'Live' ? "Play Now" : "View Results"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
