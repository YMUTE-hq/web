import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { JobController } from "@/backend/controllers/JobController";

export async function GET(request: NextRequest) {
  return await JobController.getJobs(request as unknown as Request);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  
  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  // Merge profile details safely to pass into Controller parsing
  const requestUser = { ...user, role: profile.role };

  return await JobController.createJob(request as unknown as Request, requestUser);
}
