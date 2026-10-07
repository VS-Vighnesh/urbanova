"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Heart, Minus, Plus, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";
import { productImageFor } from "@/lib/productImages";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { trackOrderClick, trackProductView } from "@/lib/lead_Tracking";

interface ProductDetails extends Product {
  related?: Product[];
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const { isSaved, toggle } = useWishlist();
  const { user } = useAuth();
  const trackedProductId = useRef("");
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loadedId, setLoadedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    apiFetch<ProductDetails>(`/api/products/${encodeURIComponent(params.id)}`)
      .then((data) => {
        setProduct(data);
        setError("");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadedId(params.id));
  }, [params.id]);

  useEffect(() => {
    if (!user?.name || !user.email || !product) return;
    if (trackedProductId.current === product.id) return;
    trackedProductId.current = product.id;
    void trackProductView(product.name);
  }, [user, product]);

  async function addToBag() {
    if (!product) return;
    if (user?.name && user.email) {
      void trackOrderClick();
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiFetch("/api/cart/items", { method: "POST", body: JSON.stringify({ product_id: product.id, quantity }) });
      setMessage("Added to your bag.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add this item.");
    } finally {
      setBusy(false);
    }
  }

  if (loadedId !== params.id) return <div className="page-loading">Loading this good thing…</div>;
  if (!product) return <div className="page-shell"><div className="notice notice-error" role="alert">{error || "Product not found."}</div><Link className="text-link" href="/shop"><ArrowLeft size={15} /> Back to the collection</Link></div>;

  const image = product.image_url || productImageFor(product.slug);
  return (
    <>
      <div className="page-shell">
        <Link className="text-link" href="/shop"><ArrowLeft size={15} /> Back to the collection</Link>
        <div className="product-detail">
          <div className={`product-detail-art product-art-${["sage", "sand", "clay", "sky"][product.name.length % 4]}`}>
            {image ? (
              // Product image URLs are supplied by the API and can be external.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={product.name} />
            ) : <span>{product.name.slice(0, 1)}</span>}
          </div>
          <section className="product-detail-info">
            <p className="eyebrow">A little more considered</p>
            <h1>{product.name}</h1>
            <div className="product-detail-rating"><Star size={15} fill="currentColor" /> {product.rating?.toFixed(1) || "New"} <span>({product.rating_count || 0} reviews)</span></div>
            <div className="product-detail-price">{formatCurrency(product.price)} {product.original_price && product.original_price > product.price && <del>{formatCurrency(product.original_price)}</del>}</div>
            {product.original_price && product.original_price > product.price && <span className="detail-sale-label">{Math.round((1 - product.price / product.original_price) * 100)}% off</span>}
            <p className="product-description">{product.description || "A thoughtfully chosen piece for the everyday. Made to be useful, easy to live with, and loved for a long time."}</p>
            <p className="stock-note">{product.stock > 0 ? `${product.stock} ready to ship` : "Currently unavailable"}</p>
            {error && <div className="notice notice-error" role="alert">{error}</div>}
            {message && <div className="notice notice-success" role="status">{message} <Link href="/cart">View bag</Link></div>}
            <div className="product-buy-row">
              <div className="quantity-control product-quantity">
                <button aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={14} /></button>
                <span>{quantity}</span>
                <button aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}><Plus size={14} /></button>
              </div>
              <button className="button" onClick={addToBag} disabled={busy || product.stock < 1}>{busy ? "Adding…" : product.stock > 0 ? "Add to bag" : "Out of stock"}</button>
              <button className={`button button-light detail-wishlist ${isSaved(product.slug) ? "is-saved" : ""}`} onClick={() => toggle(product.slug)} aria-label={isSaved(product.slug) ? "Remove from wishlist" : "Add to wishlist"}><Heart size={17} fill={isSaved(product.slug) ? "currentColor" : "none"} /></button>
            </div>
          </section>
        </div>
      </div>
      {product.related && product.related.length > 0 && <section className="section"><div className="section-heading"><div><p className="eyebrow">A good pairing</p><h2>You might also like</h2></div></div><div className="product-grid">{product.related.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}</div></section>}
    </>
  );
}
