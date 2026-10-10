import { NextRequest, NextResponse } from "next/server";
import { ChatService } from "@/backend/services/ChatService";
import { getSessionUser } from "@/lib/viewer";
import { getErrorMessage } from "@/types";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await ChatService.getUserConversations(user.id);
    return NextResponse.json(conversations);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId } = body;

    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!targetUserId || !UUID.test(targetUserId)) {
      return NextResponse.json({ error: "Valid target user ID is required" }, { status: 400 });
    }
    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Cannot start a conversation with yourself" }, { status: 400 });
    }

    let result;
    try {
      result = await ChatService.getOrCreateDirectConversation(user.id, targetUserId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      const status = msg.includes("yourself") ? 400 : 500;
      return NextResponse.json({ error: msg }, { status });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
