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
  const filters = { status: searchParams.get("status") || undefined };
  const apps = await AdminService.getApplications(filters);
  return NextResponse.json(apps);
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const result = await AdminService.overrideApplicationStatus(id, status);
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await AdminService.deleteApplication(id);
  return NextResponse.json({ success: true });
}
