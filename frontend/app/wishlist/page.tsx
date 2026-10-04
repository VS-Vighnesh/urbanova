"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { apiFetch } from "@/lib/api";
import { useWishlist } from "@/context/WishlistContext";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { slugs } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<Product[]>("/api/products")
      .then((allProducts) => {
        if (active) setProducts(allProducts.filter((product) => slugs.includes(product.slug)));
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slugs]);

  return (
    <div className="page-shell">
      <div className="page-heading"><p className="eyebrow">Saved for later</p><h1>Your wishlist<span className="brand-period">.</span></h1><p>Your shortlist of good things.</p></div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {loading ? <div className="page-loading">Gathering your saved pieces…</div> : products.length ? (
        <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
      ) : (
        <div className="empty-state"><h2>{slugs.length ? "Those saved items aren’t available right now." : "Nothing saved just yet."}</h2><p>Tap the heart on anything you love, and we’ll keep it here for you.</p><Link className="button" href="/shop">Explore the collection</Link></div>
      )}
    </div>
  );
}
