import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return <section className="admin-content"><Link className="text-link" href="/admin/products"><ArrowLeft size={15} /> Products</Link><div className="admin-page-heading"><div><p className="eyebrow">The collection</p><h1>Add a product</h1><p>Create a new item for the Urbanova shop.</p></div></div><ProductForm /></section>;
}
