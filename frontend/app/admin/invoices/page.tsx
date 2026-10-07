import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function InvoicesPage() {
  return (
    <AdminResourcePage
      title="Invoices"
      description="Track invoices validated by the finance workflow."
      endpoint="/api/invoices"
      columns={[
        { key: "invoice_number", label: "Invoice" },
        { key: "vendor_name", label: "Vendor" },
        { key: "amount", label: "Amount", format: "currency" },
        { key: "status", label: "Status", format: "status" },
        { key: "ai_processed", label: "AI processed" },
        { key: "created_at", label: "Submitted", format: "date" },
      ]}
    />
  );
}
