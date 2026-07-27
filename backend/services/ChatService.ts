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
}

export class ChatService {
  static async getUserConversations(userId: string) {
    const rawConversations = (await ChatRepository.getUserConversations(userId)) as unknown as RawConv[];

    return rawConversations.map((conv) => {
      const others = conv.conversation_members
        .filter((m) => m.user_id !== userId)
        .map((m) => m.users);

      const otherUser = others.length > 0 ? others[0] : null;

      const lastMessage = conv.messages && conv.messages.length > 0 
        ? conv.messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;

      const unreadCount = conv.messages
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
    if (!text && !mediaUrl) {
      throw new Error("Message cannot be empty");
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

    return await ChatRepository.createMessage(conversationId, senderId, text, mediaUrl);
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
    if (userIds.length < 2) {
      throw new Error("Cannot create a conversation with less than 2 users");
    }
    return await ChatRepository.createConversation(type, userIds, jobId);
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
