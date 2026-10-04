import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function AgentsPage() {
  return <AdminResourcePage title="AI agents" description="Monitor the agents keeping day-to-day work moving." endpoint="/api/agents" columns={[{ key: "name", label: "Agent" }, { key: "description", label: "What it does" }, { key: "status", label: "Status", format: "status" }, { key: "tasks_today", label: "Tasks today" }, { key: "success_rate", label: "Success rate" }]} />;
}
