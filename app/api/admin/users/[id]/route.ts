import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/backend/middleware/auth";
import { getErrorMessage } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const supabase = createAdminClient();

    const allowed = ["full_name", "bio", "location", "company_name"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No permitted fields to update. Role changes require a dedicated audited endpoint." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ user: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}
