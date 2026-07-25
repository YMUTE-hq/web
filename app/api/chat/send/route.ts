import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { ChatService } from "@/backend/services/ChatService";
import { Novu } from "@novu/api";

const novuSecretKey = process.env.NOVU_SECRET_KEY || "";
const novu = novuSecretKey ? new Novu({ secretKey: novuSecretKey }) : null;

export async function POST(req: NextRequest) {
  try {
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

    if (novu) {
      const adminSupabase = createAdminClient();
      const { data: members } = await adminSupabase
        .from("conversation_members")
        .select("user_id, users(full_name, email)")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id);

      if (members && members.length > 0) {
        const recipient = members[0];
        const recipientUser = recipient.users as any;
        const senderName = user.user_metadata?.full_name || "Someone";

        try {
          await novu.trigger({
            workflowId: "new-message",
            to: {
              subscriberId: recipient.user_id,
              email: recipientUser?.email || undefined,
              firstName: recipientUser?.full_name || undefined,
              timezone: "Asia/Calcutta",
            },
            payload: {
              Pa: text || "Sent an attachment",
              senderName: senderName,
              messageText: text || "Sent an attachment",
            },
          });
        } catch {}
      }
    }

    return NextResponse.json(message);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
