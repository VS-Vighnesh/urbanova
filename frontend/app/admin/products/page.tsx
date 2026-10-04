import Link from "next/link";
import { Plus } from "lucide-react";
import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function ProductsPage() {
  return <AdminResourcePage title="Products" description="Keep the collection up to date and ready for customers." endpoint="/api/products" columns={[{ key: "name", label: "Product" }, { key: "slug", label: "Slug" }, { key: "price", label: "Price", format: "currency" }, { key: "stock", label: "Stock" }, { key: "status", label: "Status", format: "status" }]} actionType="product" headerAction={<Link className="button button-small" href="/admin/products/new"><Plus size={15} /> Add product</Link>} />;
}
