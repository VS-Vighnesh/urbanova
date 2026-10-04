import type { ReactNode } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main">{children}</div>
      </div>
    </AdminGuard>
  );
}
