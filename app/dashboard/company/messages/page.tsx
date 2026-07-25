"use client";
import ChatManager from "@/components/chat/ChatManager";

export default function CompanyMessagesPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Messages</h2>
          <p className="text-slate-500">Manage your conversations with casters and support.</p>
        </div>
      </header>
      
      {/* Chat Component */}
      <div className="flex-1 overflow-hidden">
        <ChatManager />
      </div>
    </div>
  );
}
