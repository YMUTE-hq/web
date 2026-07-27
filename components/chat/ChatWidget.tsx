"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { X, MessageSquare, Send, Paperclip, Loader2 } from "lucide-react";

import { Conversation, ChatMessage } from "@/types";

export default function ChatWidget() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Fetch conversations on load
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/chat/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConversations();
  }, [user]);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Handle global realtime updates for conversations list, total unread badge, and background OS notifications
  useEffect(() => {
    if (!user) return;

    const globalChannel = supabase
      .channel("global-chat-widget-badge")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: { new: ChatMessage }) => {
          const newMessage = payload.new;
          if (newMessage.sender_id !== user.id) {
            setConversations((currentConvs) => {
              const belongsToMe = currentConvs.some((c) => c.id === newMessage.conversation_id);
              if (!belongsToMe) return currentConvs;

              const targetConv = currentConvs.find((c) => c.id === newMessage.conversation_id);
              const senderName = targetConv?.participant?.full_name || "New Message";

              // Trigger native browser notification if tab is hidden or lacks focus
              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted" &&
                (document.visibilityState !== "visible" || !document.hasFocus())
              ) {
                new Notification(senderName, {
                  body: newMessage.message_text || "Sent an attachment",
                  icon: "/logo-icon.svg",
                });
              }

              return currentConvs.map((c) => {
                if (c.id === newMessage.conversation_id) {
                  const isCurrentlyActive = activeConversationRef.current?.id === c.id;
                  return {
                    ...c,
                    lastMessage: newMessage,
                    unreadCount: isCurrentlyActive ? 0 : (c.unreadCount || 0) + 1,
                  };
                }
                return c;
              });
            });
          }
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === 'CHANNEL_ERROR') console.error('Realtime error:', err);
      });

    return () => {
      globalChannel.unsubscribe();
    };
  }, [user, supabase]);

  // Reset local unreadCount on active conversation open
  useEffect(() => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeConversation]);

  // Handle Supabase Realtime for Messages in the active conversation
  useEffect(() => {
    if (!activeConversation || !user) return;

    // Load initial messages
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${activeConversation.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          scrollToBottom();
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages for this conversation
    const subscription = supabase
      .channel(`conversation:${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload: { new: ChatMessage }) => {
          const newMessage = payload.new;
          // Only append if it's not our own message (we optimistically append our own)
          if (newMessage.sender_id !== user.id) {
            setMessages((prev) => [...prev, newMessage]);
            scrollToBottom();
            // Call API to mark as read in the database
            try {
              fetch(`/api/chat/messages?conversationId=${activeConversation.id}`);
            } catch (err) {
              console.error(err);
            }
          }
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === 'CHANNEL_ERROR') console.error('Realtime error:', err);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeConversation, user, supabase]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation || !user) return;

    const messageText = inputMessage;
    setInputMessage("");

    // Optimistically update UI
    const tempMessage = {
      id: "temp-" + Date.now(),
      conversation_id: activeConversation.id,
      sender_id: user.id,
      message_text: messageText,
      created_at: new Date().toISOString(),
      seen: false,
    };
    setMessages((prev) => [...prev, tempMessage as ChatMessage]);
    scrollToBottom();

    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          text: messageText,
        }),
      });
      // The real message is saved. If we wanted, we could replace the temp id here, 
      // but usually the next load or realtime sync resolves the exact data.
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (!user) return null; // Don't render for logged out users

  const totalUnread = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  return (
    <div className="fixed bottom-6 right-6 z-[99]">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-clay hover:scale-105 active:scale-95 transition-all relative"
        >
          <MessageSquare className="w-6 h-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-[2rem] shadow-clay w-80 md:w-96 h-[500px] max-h-[80vh] flex flex-col overflow-hidden border border-slate-100">
          
          {/* Main Header */}
          <header className="bg-primary px-5 py-4 flex items-center justify-between text-white shrink-0">
            <div className="flex flex-col">
              <h3 className="font-bold text-lg leading-tight">
                {activeConversation ? activeConversation.participant?.full_name : "Messages"}
              </h3>
              {activeConversation && (
                <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">
                  {activeConversation.participant?.role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeConversation && (
                <button onClick={() => setActiveConversation(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80">
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Conversations List View */}
          {!activeConversation && (
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {conversations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No messages yet</p>
                  <p className="text-xs mt-1">When you connect with a company or caster, your conversations will appear here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {conversations.map((conv) => (
                    <li
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className="p-4 bg-white hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
                    >
                      <div className="relative">
                        <img 
                          src={conv.participant?.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(conv.participant?.full_name || "User") + "&background=1e293b&color=fff"} 
                          alt="avatar" 
                          className="w-12 h-12 rounded-xl object-cover" 
                        />
                        {!!(conv.unreadCount && conv.unreadCount > 0) && (
                          <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {conv.participant?.full_name || "Unknown User"}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            {conv.lastMessage ? new Date(conv.lastMessage.created_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${(conv.unreadCount || 0) > 0 ? "text-slate-900 font-bold" : "text-slate-500"}`}>
                          {conv.lastMessage ? conv.lastMessage.message_text : "Started a conversation"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Active Conversation View */}
          {activeConversation && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            isMe 
                              ? "bg-primary text-white rounded-tr-none shadow-clay-primary" 
                              : "bg-white text-slate-700 rounded-tl-none shadow-sm border border-slate-100"
                          }`}
                        >
                          {msg.message_text}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 mx-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && <span className="ml-1 opacity-70">{msg.seen ? "• Read" : "• Sent"}</span>}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                <button type="button" className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-50 rounded-xl">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm text-slate-900 font-medium placeholder:font-semibold"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!inputMessage.trim()}
                  className="p-2.5 bg-primary text-white rounded-xl shadow-clay-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

        </div>
      )}
    </div>
  );
}
