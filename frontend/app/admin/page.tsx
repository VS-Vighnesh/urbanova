"use client";

import { Activity, BadgeCheck, CircleHelp, ClipboardCheck, DollarSign, ShoppingBag, Users } from "lucide-react";
import { useEffect, useState } from "react";
import MetricCard from "@/components/admin/MetricCard";
import AdminResourcePage from "@/components/admin/AdminResourcePage";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DashboardMetrics>("/api/dashboard")
      .then(setMetrics)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section className="admin-content">
      <div className="admin-page-heading"><div><p className="eyebrow">Store pulse</p><h1>Good morning.</h1><p>A clear view of what’s happening across your store today.</p></div></div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {metrics ? <div className="metric-grid">
        <MetricCard label="Revenue" value={formatCurrency(metrics.revenue)} note="Paid orders to date" icon={DollarSign} />
        <MetricCard label="Orders" value={metrics.orders} note="All-time orders" icon={ShoppingBag} />
        <MetricCard label="Customers" value={metrics.customers} note="In your customer list" icon={Users} />
        <MetricCard label="Open support" value={metrics.open_support} note="Waiting for a reply" icon={CircleHelp} />
        <MetricCard label="AI tasks today" value={metrics.ai_tasks_today} note={`${metrics.completed_today} completed`} icon={Activity} />
        <MetricCard label="Automation rate" value={`${metrics.automation_rate}%`} note="Tasks completed today" icon={ClipboardCheck} />
        <MetricCard label="Awaiting approval" value={metrics.awaiting_approval} note="Needs your attention" icon={BadgeCheck} />
        <MetricCard label="Failed today" value={metrics.failed_today} note="Tasks needing a look" icon={CircleHelp} />
      </div> : !error ? <div className="page-loading">Gathering your store pulse…</div> : null}
      <h2 className="admin-section-title">Recent tasks</h2>
      <AdminResourcePage title="Recent tasks" description="The latest work from your operations agents." endpoint="/api/tasks" arrayKey="tasks" columns={[{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "agent_slug", label: "Agent", format: "name" }, { key: "status", label: "Status", format: "status" }, { key: "created_at", label: "Created", format: "date" }]} actionType="task" />
    </section>
  );
}
