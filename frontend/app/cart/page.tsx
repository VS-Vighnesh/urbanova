"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { productImageFor } from "@/lib/productImages";
import type { Cart, PriceQuote } from "@/types";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<Cart>("/api/cart")
      .then(async (data) => {
        if (active) setCart(data);
        if (!data.items.length) return null;
        return apiFetch<PriceQuote>("/api/orders/quote", { method: "POST" });
      })
      .then((pricing) => {
        if (active && pricing) setQuote(pricing);
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
  }, []);

  async function updateCart(path: string, init: RequestInit) {
    setError("");
    try {
      const updated = await apiFetch<Cart>(path, init);
      setCart(updated);
      setQuote(null);
      setQuote(updated.items.length ? await apiFetch<PriceQuote>("/api/orders/quote", { method: "POST" }) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your bag.");
    }
  }

  async function setQuantity(itemId: string, quantity: number) {
    await updateCart(`/api/cart/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
  }

  async function removeItem(itemId: string) {
    await updateCart(`/api/cart/items/${itemId}`, { method: "DELETE" });
  }

  if (loading) return <div className="page-loading">Opening your bag…</div>;
  return (
    <div className="page-shell">
      <div className="page-heading"><p className="eyebrow">Your selections</p><h1>Your bag<span className="brand-period">.</span></h1><p>{cart?.item_count || 0} items, all chosen with care.</p></div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {!cart?.items.length ? <div className="empty-state"><h2>Your bag is taking a little breather.</h2><p>Find something useful, beautiful, and made for your everyday.</p><Link className="button" href="/shop">Explore the collection <ArrowRight size={15} /></Link></div> :
        <div className="cart-layout">
          <div>{cart.items.map((item) => <article className="cart-item" key={item.id}>
            <div className="cart-item-art">{(item.product_image || productImageFor(item.product_name)) ? (
              // Product image URLs are supplied by the API and can be external.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.product_image || productImageFor(item.product_name) || ""} alt="" />
            ) : item.product_name.slice(0, 1)}</div>
            <div><h3>{item.product_name}</h3><p>{formatCurrency(item.price)} each</p><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => void setQuantity(item.id, Math.max(0, item.quantity - 1))}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => void setQuantity(item.id, item.quantity + 1)}><Plus size={13} /></button></div></div>
            <div className="cart-item-total">{formatCurrency(item.line_total)}<br /><button className="remove-button" onClick={() => void removeItem(item.id)}><Trash2 size={12} /> Remove</button></div>
          </article>)}</div>
          <aside className="summary-card"><h2>A little summary</h2>
            <div className="summary-row"><span>Subtotal</span><span>{quote ? formatCurrency(quote.subtotal) : "Unavailable"}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{quote ? quote.shipping === 0 ? "Free" : formatCurrency(quote.shipping) : "Unavailable"}</span></div>
            <div className="summary-row"><span>GST (5%)</span><span>{quote ? formatCurrency(quote.tax) : "Unavailable"}</span></div>
            <div className="summary-row total"><span>Total</span><span>{quote ? formatCurrency(quote.total) : "Unavailable"}</span></div>
            <p className="coupon-hint">Apply code URBANOVA10 at checkout for 10% off.</p>
            {quote ? <Link className="button button-full" href="/checkout">Continue to checkout <ArrowRight size={15} /></Link> : <button className="button button-full" disabled>Continue to checkout <ArrowRight size={15} /></button>}<p className="secure-note"><ShieldCheck size={14} /> Your details are kept safe with us.</p></aside>
        </div>}
    </div>
  );
}
