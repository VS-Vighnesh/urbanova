import AdminResourcePage from "@/components/admin/AdminResourcePage";
import { INVOICE_VERIFICATION_FORM_URL } from "@/lib/workflowForms";

export default function InvoicesPage() {
  return (
    <AdminResourcePage
      title="Invoices"
      description="Review invoice records stored in Urbanova. Submit a new invoice to the n8n form to check whether it appears genuine or fake."
      endpoint="/api/invoices"
      columns={[
        { key: "invoice_number", label: "Invoice" },
        { key: "vendor_name", label: "Vendor" },
        { key: "amount", label: "Amount", format: "currency" },
        { key: "status", label: "Status", format: "status" },
        { key: "ai_processed", label: "AI processed" },
        { key: "created_at", label: "Submitted", format: "date" },
      ]}
      headerAction={<a className="button" href={INVOICE_VERIFICATION_FORM_URL}>Verify an invoice</a>}
    />
  );
}
