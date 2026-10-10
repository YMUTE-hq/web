import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/backend/middleware/auth";
import { getErrorMessage } from "@/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing job ID" }, { status: 400 });

    const body = await req.json();
    const adminSupabase = createAdminClient();

    const ALLOWED_CAREER_FIELDS = [
      "title",
      "department",
      "location",
      "type",
      "description",
      "requirements",
      "salary_range",
      "apply_email",
      "apply_url",
      "status",
    ] as const;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of ALLOWED_CAREER_FIELDS) {
      if (body?.[key] !== undefined) updates[key] = body[key];
    }
    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from("careers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing job ID" }, { status: 400 });

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("careers")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
