import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardTabWrapper from "@/components/DashboardTabWrapper";
import { requireAdminPage } from "@/lib/viewer";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side admin gate (load-bearing: admin pages use the service-role
  // client). One cached getUser + profile query per request.
  await requireAdminPage();

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
