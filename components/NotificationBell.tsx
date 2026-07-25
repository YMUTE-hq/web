"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell as LucideBell, BellOff } from "lucide-react";
import { NovuProvider, Inbox } from "@novu/react";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const novuAppId = process.env.NEXT_PUBLIC_NOVU_APP_ID;

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (novuAppId) return; // Skip legacy DB polling if Novu is configured

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, novuAppId]);

  // Click outside to close (only used for legacy dropdown)
  useEffect(() => {
    if (novuAppId) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [novuAppId]);

  const markAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  if (!user) return null;

  // If Novu App ID is configured, render official Novu Inbox
  if (novuAppId) {
    return (
      <div className="relative">
        <NovuProvider subscriberId={user.id} applicationIdentifier={novuAppId}>
          <Inbox />
        </NovuProvider>
      </div>
    );
  }

  // Fallback to legacy polling-based custom notification bell
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition relative"
      >
        <LucideBell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 max-h-[400px] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-100 z-50 clay-card-solid p-2">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-semibold">{unreadCount} New</span>
            )}
          </div>
          
          <div className="flex flex-col">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <BellOff className="text-slate-300 w-10 h-10 mb-2" />
                <p className="text-sm font-medium text-slate-500">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => markAsRead(notif.id, notif.read)}
                  className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition ${!notif.read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.read ? "bg-primary" : "bg-transparent"}`} />
                    <div>
                      <p className={`text-sm ${!notif.read ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
