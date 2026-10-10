import { NextRequest, NextResponse } from "next/server";
import { ChatService } from "@/backend/services/ChatService";
import { getSessionUser } from "@/lib/viewer";
import { getErrorMessage } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    // Authz first: getMessages verifies membership. Only then mark as read.
    let messages;
    try {
      messages = await ChatService.getMessages(conversationId, user.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Forbidden";
      const status = msg.includes("Not authorized") ? 403 : 500;
      return NextResponse.json({ error: msg }, { status });
    }
    await ChatService.markAsRead(conversationId, user.id);

    return NextResponse.json(messages);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
