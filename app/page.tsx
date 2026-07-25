import { createClient } from "@/lib/supabase-server";
import LandingPageClient from "./LandingPageClient";

export default async function LandingPage() {
  const supabase = await createClient();

  const [jobsRes, castersRes, voicesRes] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, domain, budget, language, event_date, users(company_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("users")
      .select("id, full_name, domains, languages, rating, avatar_url")
      .eq("role", "caster")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("ratings")
      .select("id, review, users!ratings_user_id_fkey(full_name, role, avatar_url)")
      .not("review", "is", null)
      .order("created_at", { ascending: false })
      .limit(2)
  ]);

  return (
    <LandingPageClient
      recentJobs={(jobsRes.data as any) || []}
      recentCasters={castersRes.data || []}
      communityVoices={voicesRes.data || []}
    />
  );
}
