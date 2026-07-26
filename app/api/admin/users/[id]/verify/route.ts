import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase-server";

const VALID_STATUSES = ["unverified", "pending", "verified", "rejected"];

async function requireAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id } = await params;
    const formData = await req.formData();
    const status = formData.get("status") as string;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid verification status." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("users")
      .update({ verification_status: status })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Redirect back to user detail page
    const url = new URL(req.url);
    const redirectUrl = new URL(`/dashboard/admin/users/${id}`, url.origin);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
