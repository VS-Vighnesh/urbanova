"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { CartDTO, PriceQuote } from "@/types";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState("");
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCart() {
      try {
        const data = await apiFetch<CartDTO>("/api/cart");
        if (!active) return;
        setCart(data);
        if (data.items.length) {
          const savedCode = window.sessionStorage.getItem("appliedCoupon") || "";
          let pricing: PriceQuote;
          try {
            const query = savedCode ? `?coupon_code=${encodeURIComponent(savedCode)}` : "";
            pricing = await apiFetch<PriceQuote>(`/api/orders/quote${query}`, { method: "POST" });
          } catch (err) {
            if (!savedCode) throw err;
            window.sessionStorage.removeItem("appliedCoupon");
            setCouponMessage(err instanceof Error ? err.message : "Your saved coupon is no longer valid.");
            pricing = await apiFetch<PriceQuote>("/api/orders/quote", { method: "POST" });
          }
          if (!active) return;
          setQuote(pricing);
          if (savedCode && pricing.coupon_code) setAppliedCoupon(savedCode);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load your cart.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadCart();
    return () => {
      active = false;
    };
  }, []);

  async function refreshAfterChange(data: CartDTO) {
    setCart(data);
    setError("");
    if (!data.items.length) {
      setQuote(null);
      setAppliedCoupon("");
      window.sessionStorage.removeItem("appliedCoupon");
      return;
    }
    try {
      const query = appliedCoupon ? `?coupon_code=${encodeURIComponent(appliedCoupon)}` : "";
      setQuote(await apiFetch<PriceQuote>(`/api/orders/quote${query}`, { method: "POST" }));
    } catch (err) {
      setQuote(null);
      setError(err instanceof Error ? err.message : "Unable to update your order total.");
    }
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setBusyItem(itemId);
    try {
      const data = await apiFetch<CartDTO>(`/api/cart/items/${encodeURIComponent(itemId)}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
      await refreshAfterChange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this item.");
    } finally {
      setBusyItem("");
    }
  }

  async function removeItem(itemId: string) {
    setBusyItem(itemId);
    try {
      const data = await apiFetch<CartDTO>(`/api/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
      await refreshAfterChange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove this item.");
    } finally {
      setBusyItem("");
    }
  }

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponMessage("");
    try {
      const result = await apiFetch<PriceQuote>(
        `/api/orders/quote?coupon_code=${encodeURIComponent(code)}`,
        { method: "POST" },
      );
      setQuote(result);
      setAppliedCoupon(code);
      window.sessionStorage.setItem("appliedCoupon", code);
      setCouponCode("");
      setCouponMessage(`Coupon ${code} applied.`);
    } catch (err) {
      setCouponMessage(err instanceof ApiError ? err.message : "Unable to apply this discount code.");
    }
  }

  async function removeCoupon() {
    setAppliedCoupon("");
    window.sessionStorage.removeItem("appliedCoupon");
    setCouponMessage("Discount code removed.");
    try {
      setQuote(await apiFetch<PriceQuote>("/api/orders/quote", { method: "POST" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh your order total.");
    }
  }

  if (loading) return <main className="page-shell"><p>Loading your cart…</p></main>;

  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Cart</span></div>
      <div className="section-heading">
        <div><p className="eyebrow">Your picks</p><h1>Your cart ({cart?.item_count || 0})</h1></div>
        <Link className="text-link" href="/shop">Continue shopping</Link>
      </div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {!cart?.items.length ? (
        <div className="empty-state">
          <h2>Your cart is waiting for something good.</h2>
          <p>Add a product to see your items and checkout total here.</p>
          <Link className="button" href="/shop">Explore the collection</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section aria-label="Cart items">
            {cart.items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-art">
                  {item.product_image ? (
                    // Product image URLs are supplied by the API and can be external.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product_image} alt={item.product_name} />
                  ) : <span>{item.product_name.slice(0, 1)}</span>}
                </div>
                <div>
                  <h3>{item.product_name}</h3>
                  <p>{formatCurrency(item.price)} each · {item.in_stock ? "In stock" : "Currently unavailable"}</p>
                  <div className="quantity-control" aria-label={`Quantity for ${item.product_name}`}>
                    <button type="button" disabled={busyItem === item.id || item.quantity <= 1} onClick={() => void updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span>{item.quantity}</span>
                    <button type="button" disabled={busyItem === item.id} onClick={() => void updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity">+</button>
                  </div>
                </div>
                <div className="cart-item-total">
                  {formatCurrency(item.line_total)}
                  <button className="remove-button" type="button" disabled={busyItem === item.id} onClick={() => void removeItem(item.id)}>Remove</button>
                </div>
              </article>
            ))}
          </section>
          <aside className="summary-card">
            <h2>Order summary</h2>
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(quote?.subtotal ?? cart.subtotal)}</span></div>
            <div className="summary-row"><span>Discount</span><span>− {formatCurrency(quote?.discount ?? 0)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{formatCurrency(quote?.shipping ?? 0)}</span></div>
            <div className="summary-row"><span>Tax</span><span>{formatCurrency(quote?.tax ?? 0)}</span></div>
            <div className="summary-row total"><span>Total</span><span>{quote ? formatCurrency(quote.total) : "Calculating…"}</span></div>
            <form className="form-stack" onSubmit={applyCoupon}>
              <label className="input-label" htmlFor="cart-coupon">Discount code</label>
              <p className="text-sm">Demo code: URBANOVA10 for 10% off.</p>
              <div className="flex gap-2">
                <input id="cart-coupon" className="input-control" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter code" />
                <button className="button button-light" type="submit" disabled={!cart.items.length}>Apply</button>
              </div>
              {appliedCoupon && <p className="text-sm">Applied: <strong>{appliedCoupon}</strong> <button className="text-link" type="button" onClick={() => void removeCoupon()}>Remove</button></p>}
              {couponMessage && <p role="status" className="text-sm">{couponMessage}</p>}
            </form>
            <button className="button w-full mt-5" disabled={!quote} onClick={() => router.push("/checkout")}>Proceed to checkout</button>
            <p className="text-sm mt-4">Demo checkout only; no real payment is taken.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
