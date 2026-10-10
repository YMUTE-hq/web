import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/backend/services/AdminService";
import { requireAdmin } from "@/backend/middleware/auth";
import { getErrorMessage } from "@/types";

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await AdminService.deleteCommunityPost(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id, points } = await req.json();
    if (!id || points === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const n = Number(points);
    if (!Number.isInteger(n) || n < 0 || n > 1000000) {
      return NextResponse.json({ error: "Points must be an integer 0–1000000" }, { status: 400 });
    }

    await AdminService.updateLeaderboardPoints(id, n);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
