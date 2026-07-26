import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("careers")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Careers API] Error fetching careers (table may not exist yet):", error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.warn("[Careers API] Network or server error:", error?.message);
    return NextResponse.json([]);
  }
}
