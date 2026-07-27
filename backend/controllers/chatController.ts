import { ChatService } from "../services/ChatService";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getErrorMessage } from "@/types";

export class ChatController {
  static async createConversation(req: Request) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      const { type, userIds, jobId } = body;

      if (!type || !userIds || !Array.isArray(userIds)) {
        return NextResponse.json({ error: "Missing required fields: type, userIds" }, { status: 400 });
      }

      // Ensure the current user is part of the userIds
      if (!userIds.includes(user.id)) {
        userIds.push(user.id);
      }

      const conversationId = await ChatService.createConversation(type, userIds, jobId);
      return NextResponse.json({ conversationId }, { status: 201 });
    } catch (e: unknown) {
      return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
    }
  }
}
