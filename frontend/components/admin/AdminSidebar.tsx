"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, BadgeCheck, Boxes, ChartNoAxesCombined, ClipboardList, Headset,
  LayoutDashboard, Package, ShoppingCart, Users, UserRoundSearch, Workflow,
  UserRoundCheck, ReceiptText,
} from "lucide-react";

const sections = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "AI agents", href: "/admin/agents", icon: Activity },
  { label: "Workflows", href: "/admin/workflows", icon: Workflow },
  { label: "Tasks", href: "/admin/tasks", icon: ClipboardList },
  { label: "Approvals", href: "/admin/approvals", icon: BadgeCheck },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Leads", href: "/admin/leads", icon: UserRoundSearch },
  { label: "Candidates", href: "/admin/candidates", icon: UserRoundCheck },
  { label: "Invoices", href: "/admin/invoices", icon: ReceiptText },
  { label: "Support", href: "/admin/support", icon: Headset },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-title"><span className="sidebar-symbol"><ChartNoAxesCombined size={18} /></span><div><strong>Store admin</strong><small>Urbanova workspace</small></div></div>
      <p className="sidebar-label">WORKSPACE</p>
      <nav>
        {sections.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return <Link key={href} href={href} className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></Link>;
        })}
      </nav>
      <div className="sidebar-bottom"><Boxes size={17} /><span>Operations console</span></div>
    </aside>
  );
}
