import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardTabWrapper from "@/components/DashboardTabWrapper";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 font-display">
      {/* Sidebar - Stays 100% interactive & out of loader blur */}
      <AdminSidebar />

      {/* Main Content Area - Content Side Loader Only */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col z-10">
        <DashboardTabWrapper>
          {children}
        </DashboardTabWrapper>
      </main>
    </div>
  );
}
