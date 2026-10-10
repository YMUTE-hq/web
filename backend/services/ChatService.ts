import { ChatRepository } from "../repositories/ChatRepository";
import { createAdminClient } from "@/lib/supabase-server";

import { ChatMessage, UserProfile } from "@/types";

interface RawMember {
  user_id: string;
  users: UserProfile;
}

interface RawConv {
  id: string;
  type: "direct" | "job" | "support";
  created_at: string;
  conversation_members: RawMember[];
  messages?: ChatMessage[];
  // Precomputed by ChatRepository (bounded unread query). Falls back to
  // computing from messages when absent (e.g. older shapes).
  __unreadCount?: number;
}

export class ChatService {
  static async getUserConversations(userId: string) {
    const rawConversations = (await ChatRepository.getUserConversations(userId)) as unknown as RawConv[];

    return rawConversations.map((conv) => {
      const others = conv.conversation_members
        .filter((m) => m.user_id !== userId)
        .map((m) => m.users);

      const otherUser = others.length > 0 ? others[0] : null;

      // Repository returns at most the latest message (bounded query) —
      // no in-place sort needed.
      const lastMessage = conv.messages && conv.messages.length > 0
        ? conv.messages[0]
        : null;

      const unreadCount = typeof conv.__unreadCount === "number"
        ? conv.__unreadCount
        : conv.messages
          ? conv.messages.filter((m) => !m.seen && m.sender_id !== userId).length
          : 0;

      return {
        id: conv.id,
        type: conv.type,
        created_at: conv.created_at,
        participant: otherUser,
        lastMessage,
        unreadCount
      };
    });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const supabase = createAdminClient();
    const { data: members } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);
    if (!members || members.length === 0) return 0;
    const ids = members.map((m) => m.conversation_id);
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", ids)
      .eq("seen", false)
      .neq("sender_id", userId);
    return count || 0;
  }

  static async getOrCreateDirectConversation(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new Error("Cannot start a conversation with yourself");
    }

    const existingId = await ChatRepository.findDirectConversation(currentUserId, targetUserId);
    
    if (existingId) {
      return { conversationId: existingId, isNew: false };
    }

    const newId = await ChatRepository.createConversation("direct", [currentUserId, targetUserId]);
    return { conversationId: newId, isNew: true };
  }

  static async sendMessage(conversationId: string, senderId: string, text: string, mediaUrl?: string) {
    const cleanText = typeof text === "string" ? text.trim() : "";
    const cleanMedia = typeof mediaUrl === "string" ? mediaUrl.trim() : undefined;
    if (!cleanText && !cleanMedia) {
      throw new Error("Message cannot be empty");
    }
    if (cleanText && cleanText.length > 5000) {
      throw new Error("Message too long (max 5000 characters)");
    }
    if (cleanMedia) {
      if (cleanMedia.length > 2048 || (!cleanMedia.startsWith("https://"))) {
        throw new Error("Invalid attachment URL");
      }
    }

    const supabase = createAdminClient();
    const { data: isMember } = await supabase
      .from("conversation_members")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", senderId)
      .single();

    if (!isMember) {
      throw new Error("Not authorized to send message to this conversation");
    }

    return await ChatRepository.createMessage(conversationId, senderId, cleanText, cleanMedia);
  }

  static async getMessages(conversationId: string, userId: string) {
    const supabase = createAdminClient();
    const { data: isMember } = await supabase
      .from("conversation_members")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (!isMember) {
      throw new Error("Not authorized to view this conversation");
    }

    return await ChatRepository.getMessages(conversationId);
  }

  static async createConversation(type: string, userIds: string[], jobId?: string) {
    const ALLOWED_TYPES = ["direct", "job", "support"];
    if (!ALLOWED_TYPES.includes(type)) {
      throw new Error("Invalid conversation type");
    }
    if (!Array.isArray(userIds) || userIds.length < 2 || userIds.length > 10) {
      throw new Error("Conversation must have 2–10 users");
    }
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of userIds) {
      if (!UUID.test(id)) throw new Error("Invalid user id");
    }
    if (new Set(userIds).size !== userIds.length) throw new Error("Duplicate users");
    const cleanJobId = jobId ?? undefined;
    if (cleanJobId !== undefined && !UUID.test(cleanJobId)) throw new Error("Invalid job id");
    return await ChatRepository.createConversation(type, userIds, cleanJobId);
  }

  static async markAsRead(conversationId: string, userId: string) {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from("messages")
      .update({ seen: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("seen", false);

    return !error;
  }
}
