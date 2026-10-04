import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function ApprovalsPage() {
  return <AdminResourcePage title="Approvals" description="Review decisions that need a human eye before they go live." endpoint="/api/approvals" columns={[{ key: "title", label: "Request" }, { key: "type", label: "Type", format: "name" }, { key: "description", label: "Details" }, { key: "requested_by_agent", label: "Requested by" }, { key: "status", label: "Status", format: "status" }, { key: "created_at", label: "Created", format: "date" }]} actionType="approval" />;
}
