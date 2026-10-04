"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  return <section className="admin-content"><Link className="text-link" href="/admin/products"><ArrowLeft size={15} /> Products</Link><div className="admin-page-heading"><div><p className="eyebrow">The collection</p><h1>Edit product</h1><p>Update details for this item.</p></div></div><ProductForm productId={id} /></section>;
}
