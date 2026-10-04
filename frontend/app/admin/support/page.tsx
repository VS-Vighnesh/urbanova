import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function SupportPage() {
  return <AdminResourcePage title="Support" description="Customer conversations that could use a hand." endpoint="/api/support" columns={[{ key: "ticket_number", label: "Ticket" }, { key: "subject", label: "Subject" }, { key: "customer_email", label: "Customer" }, { key: "category", label: "Category", format: "name" }, { key: "priority", label: "Priority", format: "name" }, { key: "status", label: "Status", format: "status" }, { key: "created_at", label: "Opened", format: "date" }]} actionType="support" />;
}
