import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getErrorMessage } from "@/types";

const ALLOWED_JOB_UPDATES = [
  "title",
  "domain",
  "language",
  "budget",
  "event_date",
  "event_duration",
  "event_mode",
  "location",
  "description",
  "casters_needed",
  "payment_type",
  "status",
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, users!company_id(id, full_name, company_name, avatar_url, company_logo_url, bio, verification_status)")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Enforce strict whitelist to prevent mass-assignment attacks
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_JOB_UPDATES) {
      if (key in body && body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    // Validate status values if being modified
    if (updates.status && !["open", "closed", "draft"].includes(updates.status as string)) {
      return NextResponse.json(
        { error: "Invalid status value. Permitted: open, closed, draft." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("company_id", user.id)
      .select()
      .single();

    if (error) {
      const code = (error as { code?: string }).code;
      if (code === "PGRST116") return NextResponse.json({ error: "Job not found" }, { status: 404 });
      if (code === "42501") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
