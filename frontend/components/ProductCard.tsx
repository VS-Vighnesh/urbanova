"use client";

import Link from "next/link";
import { ArrowUpRight, Heart, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { useWishlist } from "@/context/WishlistContext";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { productImageFor } from "@/lib/productImages";

const swatches = ["sage", "sand", "clay", "sky"];

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const image = product.image_url || productImageFor(product.slug);
  const { isSaved, toggle } = useWishlist();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function addToBag() {
    setBusy(true);
    setNotice("");
    try {
      await apiFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      setNotice("Added to bag");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not add to bag");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link className={`product-art product-art-${swatches[index % swatches.length]}`} href={`/product/${product.slug || product.id}`}>
          {image ? (
            // Product image URLs are supplied by the API and can be external.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} />
          ) : (
            <span className="product-art-letter" aria-hidden="true">{product.name.slice(0, 1)}</span>
          )}
          {product.original_price && product.original_price > product.price && (
            <span className="product-tag sale-tag">
              {Math.round((1 - product.price / product.original_price) * 100)}% OFF
            </span>
          )}
          <span className="product-quick"><ArrowUpRight size={17} /></span>
        </Link>
        <button className={`wishlist-toggle ${isSaved(product.slug) ? "is-saved" : ""}`} onClick={() => toggle(product.slug)} aria-label={isSaved(product.slug) ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}>
          <Heart size={17} fill={isSaved(product.slug) ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-meta">
        <div>
          <Link href={`/product/${product.slug || product.id}`} className="product-name">{product.name}</Link>
          <p>{product.stock > 0 ? "Ready to ship" : "Currently unavailable"}</p>
        </div>
        <div className="product-price"><strong>{formatCurrency(product.price)}</strong>{product.original_price && product.original_price > product.price ? <del>{formatCurrency(product.original_price)}</del> : null}</div>
      </div>
      {product.rating ? <div className="product-rating"><Star size={13} fill="currentColor" /> {product.rating.toFixed(1)} <span>({product.rating_count || 0})</span></div> : null}
      <button className="product-add-button" onClick={() => void addToBag()} disabled={busy || product.stock < 1}>
        <ShoppingCart size={14} /> {busy ? "Adding…" : product.stock < 1 ? "Out of stock" : "Add to cart"}
      </button>
      {notice && <p className={notice.startsWith("Added") ? "product-feedback success" : "product-feedback error"} role="status">{notice}</p>}
    </article>
  );
}
