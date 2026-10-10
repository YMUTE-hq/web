import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/backend/middleware/auth";
import { getErrorMessage } from "@/types";

const VALID_STATUSES = ["unverified", "pending", "verified", "rejected"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";
    let status: string | null = null;
    if (contentType.includes("application/json")) {
      const body = await req.json();
      status = body.status;
    } else {
      const formData = await req.formData();
      status = formData.get("status") as string;
    }

    if (!VALID_STATUSES.includes(status as string)) {
      return NextResponse.json({ error: "Invalid verification status." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("users")
      .update({ verification_status: status })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Support both HTML form (redirect) and fetch/XHR (JSON).
    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      const url = new URL(req.url);
      const redirectUrl = new URL(`/dashboard/admin/users/${id}`, url.origin);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
    return NextResponse.json({ success: true, status });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}
