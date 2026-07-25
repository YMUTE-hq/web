import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/backend/services/AdminService";
import { createClient } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const filters = { status: searchParams.get("status") || undefined, search: searchParams.get("search") || undefined };
  const jobs = await AdminService.getJobs(filters);
  return NextResponse.json(jobs);
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { id, action } = body;
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  let result;
  switch (action) {
    case "approve": result = await AdminService.approveJob(id); break;
    case "reject": result = await AdminService.rejectJob(id); break;
    case "flag": result = await AdminService.flagJob(id, true); break;
    case "unflag": result = await AdminService.flagJob(id, false); break;
    default: return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await AdminService.deleteJob(id);
  return NextResponse.json({ success: true });
}
