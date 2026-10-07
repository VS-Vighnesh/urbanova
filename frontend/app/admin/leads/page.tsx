import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function LeadsPage() {
  return <AdminResourcePage title="Leads" description="See captured browsing intent and follow up with qualified visitors." endpoint="/api/leads" columns={[{ key: "lead_name", label: "Lead" }, { key: "lead_email", label: "Email" }, { key: "source", label: "Source", format: "name" }, { key: "visit_count", label: "Product visits" }, { key: "order_click_count", label: "Order clicks" }, { key: "browsed_products", label: "Browsed products" }, { key: "user_intent_notes", label: "Intent notes" }, { key: "classification", label: "AI classification", format: "name" }, { key: "score", label: "Score" }, { key: "status", label: "Status", format: "status" }, { key: "created_at", label: "Created", format: "date" }]} actionType="lead" />;
}
