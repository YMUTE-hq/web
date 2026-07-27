"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Bell, BellOff, CheckCheck, Check, MessageSquare, Briefcase, UserCheck, Info } from "lucide-react";

type Notification = {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  type?: string;
  created_at: string;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and Supabase Realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to realtime notification updates for this user
    const channel = supabase
      .channel(`user-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
            );
          } else if (payload.eventType === "DELETE") {
            const oldId = payload.old.id;
            setNotifications((prev) => prev.filter((n) => n.id !== oldId));
          }
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === 'CHANNEL_ERROR') console.error('Realtime error:', err);
      });

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: false } : n))
        );
      }
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    const previousNotifications = [...notifications];

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) {
        setNotifications(previousNotifications);
      }
    } catch {
      setNotifications(previousNotifications);
    }
  };

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.read : true
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (message: string, type?: string) => {
    const msg = message.toLowerCase();
    if (type === "message" || msg.includes(":") || msg.includes("message")) {
      return <MessageSquare className="w-4 h-4 text-primary" />;
    }
    if (type === "job" || msg.includes("job") || msg.includes("application")) {
      return <Briefcase className="w-4 h-4 text-amber-500" />;
    }
    if (type === "hired" || msg.includes("accepted") || msg.includes("hired")) {
      return <UserCheck className="w-4 h-4 text-emerald-500" />;
    }
    return <Info className="w-4 h-4 text-sky-500" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Action Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        className="relative w-10 h-10 rounded-xl bg-slate-100/80 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center text-slate-700 active:scale-95 shadow-sm border border-slate-200/50"
      >
        <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-navy-deep text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-primary text-navy-deep text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-primary hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all ${
                filter === "all"
                  ? "bg-white text-navy-deep shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all ${
                filter === "unread"
                  ? "bg-white text-navy-deep shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/80">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <BellOff className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">No notifications</p>
                <p className="text-xs text-slate-400 mt-1">
                  {filter === "unread" ? "You have no unread notifications." : "You're all caught up!"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id, notif.read)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                    !notif.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(notif.message, notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${!notif.read ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                      {formatTime(notif.created_at)}
                    </span>
                  </div>

                  {!notif.read ? (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2 shadow-sm" title="Unread" />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-emerald-500 transition-opacity p-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
