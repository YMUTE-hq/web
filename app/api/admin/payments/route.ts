import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/backend/services/AdminService";
import { createClient } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return null;
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return null;
    return user;
  } catch (error: any) {
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const payments = await AdminService.getPayments({ status: searchParams.get("status") || undefined });
    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const result = status === "paid"
      ? await AdminService.markPaymentPaid(id)
      : await AdminService.refundPayment(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
