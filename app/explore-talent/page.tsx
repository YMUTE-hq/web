import { Metadata } from "next";
import { Suspense } from "react";
import ExploreTalentClient from "./ExploreTalentClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Explore Talent | YMUTE",
  description: "Find the best voices for your next event.",
};

export default function ExploreTalentPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-[var(--bg-light)]">
        <Suspense fallback={<div className="min-h-screen"></div>}>
          <ExploreTalentClient initialCasters={[]} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
