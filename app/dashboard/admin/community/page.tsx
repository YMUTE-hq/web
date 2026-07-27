import { AdminService } from "@/backend/services/AdminService";
import { AdminDeleteButton, AdminLeaderboardPoints } from "@/components/admin/AdminActions";
import { MessageSquare, Star, Trophy } from "lucide-react";

import { RatingItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage() {
  const posts = (await AdminService.getCommunityPosts() || []) as (RatingItem & { users?: { full_name: string }; casters?: { full_name: string } })[];
  const leaderboard = (await AdminService.getLeaderboard() || []) as { id: string; points: number; users?: { full_name: string; email: string } }[];

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Community Moderation</h2>
        <p className="text-slate-500 mt-1">Manage ratings, reviews, and leaderboard standings</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Ratings & Reviews Moderation */}
        <section>
          <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Recent Reviews ({posts.length})
          </h3>
          <div className="clay-card shadow-clay rounded-xl bg-white overflow-hidden">
            <div className="divide-y divide-primary/5">
              {posts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{post.users?.full_name || "Unknown User"}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(post.created_at).toLocaleDateString()} · Rated {post.casters?.full_name || "Unknown Caster"}
                      </p>
                    </div>
                    <AdminDeleteButton id={post.id} endpoint="/api/admin/community" label="Delete" />
                  </div>
                  
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= (post.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">{post.review || "No review text provided."}</p>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p>No community reviews found.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Leaderboard Moderation */}
        <section>
          <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Leaderboard Standings
          </h3>
          <div className="clay-card shadow-clay rounded-xl bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-primary/5">
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Points</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {leaderboard.map((entry, index: number) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-xs text-primary shrink-0">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 line-clamp-1">{entry.users?.full_name || "—"}</p>
                          <p className="text-[10px] text-slate-400">{entry.users?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-800">{entry.points || 0} pts</span>
                    </td>
                    <td className="px-6 py-4 flex justify-end">
                      <AdminLeaderboardPoints leaderboardId={entry.id} currentPoints={entry.points || 0} />
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                      No leaderboard entries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
