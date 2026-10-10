import { ChatService } from "../services/ChatService";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { getErrorMessage } from "@/types";

const ALLOWED_TYPES = ["direct", "job", "support"] as const;
type ConversationType = (typeof ALLOWED_TYPES)[number];

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class ChatController {
  static async createConversation(req: Request) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      const { type, userIds, jobId } = body;

      // 1. Validate conversation type
      if (!type || !ALLOWED_TYPES.includes(type as ConversationType)) {
        return NextResponse.json(
          { error: "Invalid conversation type. Allowed: direct, job, support" },
          { status: 400 }
        );
      }

      // 2. Validate userIds array
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json(
          { error: "userIds must be a non-empty array of user IDs" },
          { status: 400 }
        );
      }

      // Sanitize and deduplicate UUIDs
      const cleanUserIds = Array.from(
        new Set(userIds.filter((id): id is string => typeof id === "string" && UUID_REGEX.test(id)))
      );

      if (cleanUserIds.length === 0) {
        return NextResponse.json(
          { error: "No valid user UUIDs provided in userIds" },
          { status: 400 }
        );
      }

      const adminClient = createAdminClient();

      // 3. Handle "direct" conversations
      if (type === "direct") {
        // Direct conversation is strictly 1-on-1 between current user and target user
        const otherUserIds = cleanUserIds.filter((id) => id !== user.id);
        if (otherUserIds.length !== 1) {
          return NextResponse.json(
            { error: "A direct conversation requires exactly one recipient user." },
            { status: 400 }
          );
        }

        const targetUserId = otherUserIds[0];
        if (targetUserId === user.id) {
          return NextResponse.json(
            { error: "Cannot start a conversation with yourself" },
            { status: 400 }
          );
        }

        // Verify target user exists and is active (not banned / suspended)
        const { data: targetUser, error: targetErr } = await adminClient
          .from("users")
          .select("id, is_banned, is_suspended")
          .eq("id", targetUserId)
          .single();

        if (targetErr || !targetUser) {
          return NextResponse.json(
            { error: "Recipient user does not exist." },
            { status: 404 }
          );
        }

        if (targetUser.is_banned || targetUser.is_suspended) {
          return NextResponse.json(
            { error: "Cannot start a conversation with an inactive or suspended user." },
            { status: 403 }
          );
        }

        // Use idempotent helper to reuse existing direct conversation or create a new one
        const result = await ChatService.getOrCreateDirectConversation(user.id, targetUserId);
        return NextResponse.json({ conversationId: result.conversationId, isNew: result.isNew }, { status: 200 });
      }

      // 4. Handle "job" conversations
      if (type === "job") {
        if (!jobId || typeof jobId !== "string" || !UUID_REGEX.test(jobId)) {
          return NextResponse.json(
            { error: "A valid jobId UUID is required for job-related conversations." },
            { status: 400 }
          );
        }

        // Verify job exists
        const { data: job, error: jobErr } = await adminClient
          .from("jobs")
          .select("id, company_id, status")
          .eq("id", jobId)
          .single();

        if (jobErr || !job) {
          return NextResponse.json({ error: "Referenced job not found." }, { status: 404 });
        }

        // Cap user count for job conversations
        if (cleanUserIds.length > 10) {
          return NextResponse.json(
            { error: "Maximum 10 participants allowed in a job conversation." },
            { status: 400 }
          );
        }

        // Ensure current user is in participants
        const participants = Array.from(new Set([user.id, ...cleanUserIds]));
        const conversationId = await ChatService.createConversation("job", participants, jobId);
        return NextResponse.json({ conversationId }, { status: 201 });
      }

      // 5. Handle "support" conversations
      const participants = Array.from(new Set([user.id, ...cleanUserIds]));
      const conversationId = await ChatService.createConversation("support", participants);
      return NextResponse.json({ conversationId }, { status: 201 });
    } catch (e: unknown) {
      return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
    }
  }
}
