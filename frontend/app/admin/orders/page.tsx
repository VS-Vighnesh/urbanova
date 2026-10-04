import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function AdminOrdersPage() {
  return <AdminResourcePage title="Orders" description="See every order and keep fulfilment moving." endpoint="/api/admin/orders" arrayKey="orders" columns={[{ key: "order_number", label: "Order" }, { key: "created_at", label: "Placed", format: "date" }, { key: "total_amount", label: "Total", format: "currency" }, { key: "payment_status", label: "Payment", format: "status" }, { key: "fulfillment_status", label: "Fulfilment", format: "status" }]} actionType="order" />;
}
