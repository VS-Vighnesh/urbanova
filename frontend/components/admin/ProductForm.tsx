"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import type { Category, Product } from "@/types";

interface ProductInput {
  name: string;
  slug: string;
  description: string;
  price: string;
  original_price: string;
  category_id: string;
  image_url: string;
  stock: string;
  status: string;
}

const emptyProduct: ProductInput = {
  name: "", slug: "", description: "", price: "", original_price: "",
  category_id: "", image_url: "", stock: "0", status: "ACTIVE",
};

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<ProductInput>(emptyProduct);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<Category[]>("/api/products/categories")
      .then(setCategories)
      .catch((err: Error) => setError(err.message));
    if (!productId) return;
    apiFetch<Product>(`/api/products/${encodeURIComponent(productId)}`)
      .then((product) => setValues({
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        price: String(product.price),
        original_price: product.original_price ? String(product.original_price) : "",
        category_id: product.category_id || "",
        image_url: product.image_url || "",
        stock: String(product.stock),
        status: product.status,
      }))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  function change(key: keyof ProductInput, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" && !productId ? { slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") } : {}),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const body = {
      ...values,
      price: Number(values.price),
      original_price: values.original_price ? Number(values.original_price) : null,
      category_id: values.category_id || null,
      image_url: values.image_url || null,
      stock: Number(values.stock),
    };
    try {
      await apiFetch(`/api/products${productId ? `/${productId}` : ""}`, {
        method: productId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save this product.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loading">Loading product…</div>;
  return (
    <form className="admin-form form-stack" onSubmit={submit}>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      <div className="form-grid">
        <label className="input-label">Product name<input className="input-control" value={values.name} onChange={(e) => change("name", e.target.value)} required /></label>
        <label className="input-label">Slug<input className="input-control" value={values.slug} onChange={(e) => change("slug", e.target.value)} required /></label>
        <label className="input-label">Price (₹)<input className="input-control" type="number" min="0" step="0.01" value={values.price} onChange={(e) => change("price", e.target.value)} required /></label>
        <label className="input-label">Original price (₹)<input className="input-control" type="number" min="0" step="0.01" value={values.original_price} onChange={(e) => change("original_price", e.target.value)} /></label>
        <label className="input-label">Category<select className="select-control" value={values.category_id} onChange={(e) => change("category_id", e.target.value)}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="input-label">Stock<input className="input-control" type="number" min="0" step="1" value={values.stock} onChange={(e) => change("stock", e.target.value)} required /></label>
        <label className="input-label">Status<select className="select-control" value={values.status} onChange={(e) => change("status", e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="OUT_OF_STOCK">Out of stock</option></select></label>
        <label className="input-label">Image URL<input className="input-control" type="url" value={values.image_url} onChange={(e) => change("image_url", e.target.value)} /></label>
      </div>
      <label className="input-label">Description<textarea className="textarea-control" value={values.description} onChange={(e) => change("description", e.target.value)} /></label>
      <button className="button" disabled={saving}>{saving ? "Saving…" : productId ? "Save changes" : "Create product"}</button>
    </form>
  );
}
