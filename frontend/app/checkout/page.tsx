"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import type { Cart, PriceQuote } from "@/types";

interface CheckoutValues {
  full_name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  customer_email: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [values, setValues] = useState<CheckoutValues>({ full_name: "", phone: "", line1: "", city: "", state: "", pincode: "", customer_email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"SIMULATED_CARD" | "SIMULATED_FAILURE" | "COD">("SIMULATED_CARD");

  useEffect(() => {
    let active = true;
    apiFetch<Cart>("/api/cart")
      .then(async (data) => {
        if (active) setCart(data);
        if (!data.items.length) return null;
        return apiFetch<PriceQuote>("/api/orders/quote", { method: "POST" });
      })
      .then((price) => {
        if (active && price) setQuote(price);
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

  function update(field: keyof CheckoutValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!quote) {
      setError("We couldn't verify the order total. Refresh pricing before placing your order.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiFetch<{ order_number: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          shipping_address: {
            full_name: values.full_name,
            phone: values.phone,
            line1: values.line1,
            city: values.city,
            state: values.state,
            pincode: values.pincode,
          },
          ...(user ? {} : { customer_name: values.full_name, customer_email: values.customer_email }),
          payment_method: paymentMethod,
          coupon_code: quote.coupon_code,
        }),
      });
      router.push(`/checkout/success?order=${encodeURIComponent(result.order_number)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        router.push(`/checkout/failure?reason=${encodeURIComponent(err.message)}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to place your order.");
    } finally {
      setSubmitting(false);
    }
  }

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCouponError("");
    setPricingLoading(true);
    try {
      const params = new URLSearchParams({ coupon_code: couponInput.trim() });
      setQuote(await apiFetch<PriceQuote>(`/api/orders/quote?${params}`, { method: "POST" }));
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Unable to apply this code.");
    } finally {
      setPricingLoading(false);
    }
  }

  async function removeCoupon() {
    setCouponError("");
    setCouponInput("");
    setPricingLoading(true);
    try {
      setQuote(await apiFetch<PriceQuote>("/api/orders/quote", { method: "POST" }));
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Unable to refresh your total.");
    } finally {
      setPricingLoading(false);
    }
  }

  async function refreshPricing() {
    setError("");
    setPricingLoading(true);
    try {
      setQuote(await apiFetch<PriceQuote>("/api/orders/quote", { method: "POST" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh your order total.");
    } finally {
      setPricingLoading(false);
    }
  }

  if (loading) return <div className="page-loading">Preparing checkout…</div>;
  if (!cart?.items.length) return <div className="page-shell"><div className="empty-state"><h2>Your bag is empty.</h2><p>Add something lovely before checking out.</p><Link className="button" href="/shop">Browse the collection</Link></div></div>;

  return (
    <div className="page-shell">
      <div className="page-heading"><p className="eyebrow">Almost yours</p><h1>Checkout<span className="brand-period">.</span></h1><p>Just the details we need to get your order to you.</p></div>
      <div className="checkout-layout">
        <form className="form-stack" onSubmit={submit}>
          {error && <div className="notice notice-error" role="alert">{error}</div>}
          <h2 className="form-title">Contact & delivery</h2>
          {!user && <label className="input-label">Email address<input className="input-control" type="email" autoComplete="email" value={values.customer_email} onChange={(e) => update("customer_email", e.target.value)} required /></label>}
          <div className="form-grid">
            <label className="input-label">Full name<input className="input-control" autoComplete="name" value={values.full_name || user?.name || ""} onChange={(e) => update("full_name", e.target.value)} required /></label>
            <label className="input-label">Phone number<input className="input-control" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => update("phone", e.target.value)} required /></label>
          </div>
          <label className="input-label">Street address<input className="input-control" autoComplete="street-address" value={values.line1} onChange={(e) => update("line1", e.target.value)} required /></label>
          <div className="form-grid">
            <label className="input-label">City<input className="input-control" autoComplete="address-level2" value={values.city} onChange={(e) => update("city", e.target.value)} required /></label>
            <label className="input-label">State<input className="input-control" autoComplete="address-level1" value={values.state} onChange={(e) => update("state", e.target.value)} required /></label>
            <label className="input-label">PIN code<input className="input-control" inputMode="numeric" autoComplete="postal-code" value={values.pincode} onChange={(e) => update("pincode", e.target.value)} required /></label>
          </div>
          <fieldset className="payment-options">
            <legend>Payment method</legend>
            <label><input type="radio" name="payment" checked={paymentMethod === "SIMULATED_CARD"} onChange={() => setPaymentMethod("SIMULATED_CARD")} /><span><strong>Demo card · successful payment</strong><small>Test checkout only. No card details or real charge.</small></span></label>
            <label><input type="radio" name="payment" checked={paymentMethod === "SIMULATED_FAILURE"} onChange={() => setPaymentMethod("SIMULATED_FAILURE")} /><span><strong>Demo card · declined payment</strong><small>Tests the failure screen and keeps your bag.</small></span></label>
            <label><input type="radio" name="payment" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} /><span><strong>Cash on delivery</strong><small>Pay when your order arrives.</small></span></label>
          </fieldset>
          <p className="demo-payment-note">Demo checkout · No real payment will be taken or card details collected.</p>
          <button className="button" disabled={submitting || pricingLoading || !quote}>{submitting ? "Placing your order…" : pricingLoading ? "Updating total…" : `Place order · ${quote ? formatCurrency(quote.total) : "Pricing unavailable"}`}</button>
        </form>
        <aside className="summary-card"><h2>Your order</h2>
          {cart.items.map((item) => <div className="summary-row" key={item.id}><span>{item.product_name} × {item.quantity}</span><span>{formatCurrency(item.line_total)}</span></div>)}
          <form className="coupon-form" onSubmit={applyCoupon}><label className="input-label">Discount code<input className="input-control" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="URBANOVA10" disabled={pricingLoading || Boolean(quote?.coupon_code)} /></label>{quote?.coupon_code ? <button className="button button-small button-quiet" type="button" onClick={removeCoupon} disabled={pricingLoading}>Remove</button> : <button className="button button-small button-quiet" type="submit" disabled={pricingLoading || !quote}>{pricingLoading ? "…" : "Apply"}</button>}</form>
          {couponError && <p className="form-error" role="alert">{couponError}</p>}
          <div className="summary-row"><span>Subtotal</span><span>{quote ? formatCurrency(quote.subtotal) : "Unavailable"}</span></div>
          {quote?.coupon_code && <div className="summary-row summary-discount"><span>Discount · {quote.coupon_code}</span><span>−{formatCurrency(quote.discount)}</span></div>}
          <div className="summary-row"><span>Shipping</span><span>{quote ? quote.shipping === 0 ? "Free" : formatCurrency(quote.shipping) : "Unavailable"}</span></div>
          <div className="summary-row"><span>GST (5%)</span><span>{quote ? formatCurrency(quote.tax) : "Unavailable"}</span></div>
          <div className="summary-row total"><span>Total</span><span>{quote ? formatCurrency(quote.total) : "Unavailable"}</span></div>
          {!quote && <button className="button button-small button-quiet" type="button" onClick={refreshPricing} disabled={pricingLoading}>{pricingLoading ? "Refreshing…" : "Refresh pricing"}</button>}
          <p className="secure-note">Free shipping over ₹999 · Prices include applicable sale discounts.</p>
        </aside>
      </div>
    </div>
  );
}
