import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/AdminService";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await AdminService.deleteCommunityPost(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, points } = await req.json();
    if (!id || points === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await AdminService.updateLeaderboardPoints(id, points);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
