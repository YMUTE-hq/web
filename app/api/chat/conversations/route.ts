import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ChatService } from "@/backend/services/ChatService";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await ChatService.getUserConversations(user.id);
    return NextResponse.json(conversations);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    const result = await ChatService.getOrCreateDirectConversation(user.id, targetUserId);
    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
