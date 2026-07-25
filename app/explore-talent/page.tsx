import { Metadata } from "next";
import ExploreTalentClient from "./ExploreTalentClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Explore Talent | YMUTE",
  description: "Find the best voices for your next event.",
};

export default async function ExploreTalentPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const domain = resolvedSearchParams.domain || "";
  const language = resolvedSearchParams.language || "";
  const minRating = resolvedSearchParams.rating ? parseFloat(resolvedSearchParams.rating) : 0;
  const search = resolvedSearchParams.search || "";

  let query = supabase.from("users").select("id, full_name, avatar_url, bio, domains, languages, rating, verification_status").eq("role", "caster").order("rating", { ascending: false });

  if (domain && domain !== "All Domains") query = query.contains("domains", [domain]);
  if (language) query = query.contains("languages", [language]);
  if (minRating > 0) query = query.gte("rating", minRating);
  if (search) query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`);

  const { data: casters } = await query;

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-[var(--bg-light)]">
        <ExploreTalentClient initialCasters={casters || []} />
      </main>
      <Footer />
    </>
  );
}
