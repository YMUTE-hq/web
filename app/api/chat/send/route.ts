import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { ChatService } from "@/backend/services/ChatService";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getErrorMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, {
      prefix: "chat_send",
      limit: 20,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, text, mediaUrl } = body;

    if (!conversationId || (!text && !mediaUrl)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const message = await ChatService.sendMessage(conversationId, user.id, text, mediaUrl);

    const adminSupabase = createAdminClient();
    const { data: members } = await adminSupabase
      .from("conversation_members")
      .select("user_id, users(full_name)")
      .eq("conversation_id", conversationId)
      .neq("user_id", user.id);

    if (members && members.length > 0) {
      const recipient = members[0];
      const senderName = user.user_metadata?.full_name || "Someone";
      const messagePreview = text ? (text.length > 40 ? text.substring(0, 40) + "..." : text) : "Sent an attachment";

      try {
        await adminSupabase.from("notifications").insert({
          user_id: recipient.user_id,
          message: `${senderName}: ${messagePreview}`,
          read: false,
          created_at: new Date().toISOString(),
        });
      } catch {}
    }

    return NextResponse.json(message);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
