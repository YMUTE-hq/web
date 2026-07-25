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

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
  const { searchParams } = new URL(req.url);
  const filters = {
    role: searchParams.get("role") || undefined,
    search: searchParams.get("search") || undefined,
  };
  
  const users = await AdminService.getUsers(filters);
  return NextResponse.json(users);
}

// PATCH /api/admin/users
export async function PATCH(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
  const body = await req.json();
  const { id, action, updates } = body;
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  
  let result;
  switch (action) {
    case "suspend": result = await AdminService.suspendUser(id); break;
    case "unsuspend": result = await AdminService.unsuspendUser(id); break;
    case "ban": result = await AdminService.banUser(id); break;
    case "verify": result = await AdminService.verifyCaster(id); break;
    case "unverify": result = await AdminService.unVerifyCaster(id); break;
    case "feature": result = await AdminService.featureCaster(id, true); break;
    case "unfeature": result = await AdminService.featureCaster(id, false); break;
    case "update": result = await AdminService.updateUser(id, updates); break;
    default: return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  
  return NextResponse.json(result);
}

// DELETE /api/admin/users
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  
  await AdminService.deleteUser(id);
  return NextResponse.json({ success: true });
}
