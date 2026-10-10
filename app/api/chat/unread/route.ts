import { NextResponse } from "next/server";
import { ChatService } from "@/backend/services/ChatService";
import { getSessionUser } from "@/lib/viewer";
import { getErrorMessage } from "@/types";

// Lightweight badge endpoint for ChatWidget: a single count query instead of
// the full conversation list (which is now fetched lazily on widget open).
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const total = await ChatService.getUnreadCount(user.id);
    return NextResponse.json({ total });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
