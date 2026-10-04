import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function CustomersPage() {
  return <AdminResourcePage title="Customers" description="Get to know the people who make Urbanova what it is." endpoint="/api/customers" columns={[{ key: "name", label: "Customer" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "total_orders", label: "Orders" }, { key: "total_spend", label: "Lifetime spend", format: "currency" }, { key: "created_at", label: "Joined", format: "date" }]} actionType="customer" />;
}
