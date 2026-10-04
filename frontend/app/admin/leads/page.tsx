import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function LeadsPage() {
  return <AdminResourcePage title="Leads" description="Follow up with people who are interested in what you offer." endpoint="/api/leads" columns={[{ key: "name", label: "Lead" }, { key: "email", label: "Email" }, { key: "source", label: "Source", format: "name" }, { key: "classification", label: "AI classification", format: "name" }, { key: "score", label: "Score" }, { key: "status", label: "Status", format: "status" }, { key: "created_at", label: "Created", format: "date" }]} actionType="lead" />;
}
