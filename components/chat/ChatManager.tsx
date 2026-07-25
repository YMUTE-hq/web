"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name: string;
  company_name?: string;
  avatar_url?: string;
  role: string;
};

type ConversationMember = {
  user_id: string;
  role: string;
  users: UserProfile;
};

type Conversation = {
  id: string;
  type: string;
  created_at: string;
  participant: UserProfile | null;
  lastMessage?: Message | null;
  unreadCount?: number;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  media_url?: string;
  seen: boolean;
  created_at: string;
};

export default function ChatManager() {
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  // Handle auto-selecting or auto-creating conversation via URL query params (?convId=... or ?userId=...)
  useEffect(() => {
    if (!loadingConversations) {
      const params = new URLSearchParams(window.location.search);
      const convId = params.get("convId");
      const targetUserId = params.get("userId");

      if (convId) {
        const found = conversations.find((c) => c.id === convId);
        if (found) {
          selectChat(found);
          window.history.replaceState({}, "", window.location.pathname);
        }
      } else if (targetUserId) {
        // Find existing conversation with this target user
        const found = conversations.find((c) => c.participant?.id === targetUserId);
        if (found) {
          selectChat(found);
          window.history.replaceState({}, "", window.location.pathname);
        } else {
          // Create a new direct conversation with this target user
          const startNewChat = async () => {
            try {
              const res = await fetch("/api/chat/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "direct", userIds: [targetUserId] }),
              });
              if (res.ok) {
                const { conversationId } = await res.json();
                // Refresh list and select new chat
                const refreshRes = await fetch("/api/chat/conversations");
                if (refreshRes.ok) {
                  const data = await refreshRes.json();
                  setConversations(data);
                  const newChat = data.find((c: any) => c.id === conversationId);
                  if (newChat) {
                    setActiveChat(newChat);
                    fetchMessages(conversationId);
                  }
                  window.history.replaceState({}, "", window.location.pathname);
                }
              }
            } catch (err) {
              console.error("Failed to auto-start chat:", err);
            }
          };
          startNewChat();
        }
      }
    }
  }, [conversations, loadingConversations]);

  // Subscribe to real-time updates for the active stream or conversation
  useEffect(() => {
    if (!activeChat) return;

    const channel = supabase
      .channel(`chat_${activeChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeChat.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id !== user?.id) {
            setMessages((current) => {
              if (current.some((m) => m.id === newMessage.id)) return current;
              return [...current, newMessage];
            });
            fetch(`/api/chat/messages?conversationId=${activeChat.id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectChat = (chat: Conversation) => {
    setActiveChat(chat);
    setConversations((prev) =>
      prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
    );
    fetchMessages(chat.id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat || !user) return;

    const payload = {
      conversationId: activeChat.id,
      text: messageInput.trim(),
    };

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: activeChat.id,
      sender_id: user.id,
      message_text: messageInput.trim(),
      seen: false,
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setMessageInput("");

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Rollback optimistic update on error
        setMessages((current) => current.filter((m) => m.id !== tempId));
        console.error("Failed to send message");
      }
    } catch (err) {
      setMessages((current) => current.filter((m) => m.id !== tempId));
      console.error("Error sending message:", err);
    }
  };

  // getChatPartner is legacy; participant is already resolved in the API response

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-full bg-slate-50/50 rounded-3xl overflow-hidden clay-card-solid border border-slate-100/10">
      {/* Sidebar - Conversation List */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-white">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loadingConversations ? (
            <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
              <span className="material-symbols-outlined text-4xl mb-2">chat_bubble</span>
              <p className="text-sm font-medium">No conversations yet</p>
            </div>
          ) : (
            conversations.map((chat) => {
              const partner = chat.participant;
              const isActive = activeChat?.id === chat.id;
              
              return (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-colors hover:bg-primary/5 ${
                    isActive ? "bg-primary/10 border-r-4 border-primary" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0 relative">
                    {partner?.avatar_url ? (
                      <img src={partner.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {partner?.full_name?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-slate-800 truncate">
                        {partner?.company_name || partner?.full_name || "Support"}
                      </p>
                      {chat.lastMessage && (
                        <span className="text-[10px] text-slate-400">
                          {formatTime(chat.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {chat.lastMessage?.message_text || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200">
                {activeChat.participant?.avatar_url ? (
                  <img src={activeChat.participant.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {activeChat.participant?.full_name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">
                  {activeChat.participant?.company_name || activeChat.participant?.full_name || "Support"}
                </h3>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingMessages ? (
                <div className="text-center text-slate-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 py-10">Start the conversation!</div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div key={index} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] p-3 px-4 rounded-2xl shadow-sm text-sm ${
                          isOwn
                            ? "bg-primary text-white rounded-br-none shadow-clay-primary"
                            : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                        }`}
                      >
                        <p className="break-words">{msg.message_text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isOwn ? "text-white/70" : "text-slate-400"}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-700"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-clay-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-3 text-slate-300">forum</span>
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
