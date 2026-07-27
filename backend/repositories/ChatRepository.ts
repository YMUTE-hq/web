import { createAdminClient } from "@/lib/supabase-server";

export class ChatRepository {
  static async getUserConversations(userId: string) {
    const supabase = createAdminClient();
    
    const { data: members, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (memberError || !members.length) return [];

    const conversationIds = members.map((m) => m.conversation_id);

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        type,
        created_at,
        conversation_members (
          user_id,
          users (
            id,
            full_name,
            avatar_url,
            role
          )
        ),
        messages (
          id,
          message_text,
          created_at,
          seen,
          sender_id
        )
      `)
      .in("id", conversationIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
    return data;
  }

  static async getMessages(conversationId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        message_text,
        media_url,
        seen,
        created_at,
        users!messages_sender_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
    return data;
  }

  static async findDirectConversation(user1Id: string, user2Id: string) {
    const supabase = createAdminClient();
    
    const { data: u1Convos } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user1Id);
      
    if (!u1Convos || u1Convos.length === 0) return null;
    
    const convoIds = u1Convos.map(c => c.conversation_id);
    
    const { data: commonConvos } = await supabase
      .from("conversation_members")
      .select("conversation_id, conversations!inner(type)")
      .eq("user_id", user2Id)
      .in("conversation_id", convoIds)
      .eq("conversations.type", "direct")
      .limit(1);
      
    if (commonConvos && commonConvos.length > 0) {
      return commonConvos[0].conversation_id;
    }
    return null;
  }

  static async createConversation(type: string, userIds: string[], jobId?: string) {
    const supabase = createAdminClient();
    
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert([{ type, job_id: jobId }])
      .select()
      .single();

    if (convError || !conv) throw new Error("Failed to create conversation");

    const membersTableData = userIds.map(id => ({
      conversation_id: conv.id,
      user_id: id
    }));

    const { error: memError } = await supabase
      .from("conversation_members")
      .insert(membersTableData);

    if (memError) throw new Error("Failed to add members");

    return conv.id;
  }

  static async createMessage(conversationId: string, senderId: string, text: string, mediaUrl?: string) {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from("messages")
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        message_text: text,
        media_url: mediaUrl
      }])
      .select(`
        id,
        conversation_id,
        sender_id,
        message_text,
        media_url,
        seen,
        created_at,
        users!messages_sender_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error("Error creating message:", error);
      throw error;
    }
    return data;
  }
}
