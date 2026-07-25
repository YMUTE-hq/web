import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 font-display">
      <AdminSidebar />
      {/* Main Content Area */}
      {children}
    </div>
  );
}
