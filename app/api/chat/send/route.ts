import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { ChatService } from "@/backend/services/ChatService";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getErrorMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(req, {
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

    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!conversationId || !UUID.test(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }
    const cleanText = typeof text === "string" ? text.trim() : "";
    const cleanMedia = typeof mediaUrl === "string" ? mediaUrl.trim() : undefined;
    if ((!cleanText && !cleanMedia) || (cleanText && cleanText.length > 5000)) {
      return NextResponse.json({ error: "Invalid message body" }, { status: 400 });
    }
    if (cleanMedia && (cleanMedia.length > 2048 || !cleanMedia.startsWith("https://"))) {
      return NextResponse.json({ error: "Invalid attachment URL" }, { status: 400 });
    }

    const message = await ChatService.sendMessage(conversationId, user.id, cleanText, cleanMedia);

    const adminSupabase = createAdminClient();
    const { data: members } = await adminSupabase
      .from("conversation_members")
      .select("user_id, users(full_name)")
      .eq("conversation_id", conversationId)
      .neq("user_id", user.id);

    if (members && members.length > 0) {
      const senderName = user.user_metadata?.full_name || "Someone";
      const messagePreview = cleanText ? (cleanText.length > 40 ? cleanText.substring(0, 40) + "..." : cleanText) : "Sent an attachment";

      for (const recipient of members) {
        try {
          await adminSupabase.from("notifications").insert({
            user_id: recipient.user_id,
            message: `${senderName}: ${messagePreview}`,
            read: false,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error("[Chat send] notification insert failed:", err);
        }
      }
    }

    return NextResponse.json(message);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
