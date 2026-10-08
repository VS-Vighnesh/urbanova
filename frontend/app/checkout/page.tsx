"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { CartDTO, PriceQuote, ShippingAddress } from "@/types";

type PaymentMethod = "SIMULATED_CARD" | "SIMULATED_FAILURE" | "COD";

type CheckoutForm = ShippingAddress & {
  customer_name: string;
  customer_email: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("SIMULATED_CARD");
  const [form, setForm] = useState<CheckoutForm>({
    customer_name: "",
    customer_email: "",
    full_name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    let active = true;
    async function loadCheckout() {
      try {
        const data = await apiFetch<CartDTO>("/api/cart");
        if (!active) return;
        if (!data.items.length) {
          router.replace("/cart");
          return;
        }
        setCart(data);
        const savedCode = window.sessionStorage.getItem("appliedCoupon") || "";
        setCouponCode(savedCode);
        const query = savedCode ? `?coupon_code=${encodeURIComponent(savedCode)}` : "";
        const pricing = await apiFetch<PriceQuote>(`/api/orders/quote${query}`, { method: "POST" });
        if (active) setQuote(pricing);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load checkout.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadCheckout();
    return () => {
      active = false;
    };
  }, [router]);

  function updateField(event: ChangeEvent<HTMLInputElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponMessage("");
    try {
      const pricing = await apiFetch<PriceQuote>(
        `/api/orders/quote?coupon_code=${encodeURIComponent(code)}`,
        { method: "POST" },
      );
      setQuote(pricing);
      setCouponCode(code);
      window.sessionStorage.setItem("appliedCoupon", code);
      setCouponMessage(`Coupon ${code} applied.`);
      setError("");
    } catch (err) {
      setCouponMessage(err instanceof ApiError ? err.message : "Unable to apply this discount code.");
    }
  }

  async function removeCoupon() {
    window.sessionStorage.removeItem("appliedCoupon");
    setCouponCode("");
    setCouponMessage("Discount code removed.");
    try {
      setQuote(await apiFetch<PriceQuote>("/api/orders/quote", { method: "POST" }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh your order total.");
    }
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart?.items.length || !quote) {
      setError("Your cart or order total is not ready yet. Please return to your cart and try again.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await apiFetch<{ order_number: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          shipping_address: {
            full_name: form.full_name,
            phone: form.phone,
            line1: form.line1,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          customer_name: form.customer_name || user?.name,
          customer_email: form.customer_email || user?.email,
          payment_method: paymentMethod,
          coupon_code: quote.coupon_code || undefined,
        }),
      });
      window.sessionStorage.removeItem("appliedCoupon");
      router.push(`/checkout/success?order=${encodeURIComponent(result.order_number)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to place your order.";
      setError(message);
      if (err instanceof ApiError && err.status === 402) {
        setPaymentMethod("SIMULATED_FAILURE");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="page-shell"><p>Loading checkout…</p></main>;

  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/cart">Cart</Link><span>/</span><span>Checkout</span></div>
      <p className="eyebrow">Almost yours</p>
      <h1>Checkout</h1>
      <p className="muted-copy">This is a simulated checkout. No real payment details or charges are involved.</p>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {!cart?.items.length ? (
        <div className="empty-state"><h2>Your cart is empty.</h2><Link className="button" href="/shop">Back to shopping</Link></div>
      ) : (
        <div className="checkout-layout">
          <form className="form-stack" onSubmit={placeOrder}>
            <section className="admin-form form-stack">
              <h2>Contact and delivery</h2>
              <label className="input-label">Name<input className="input-control" name="customer_name" required value={form.customer_name || user?.name || ""} onChange={updateField} /></label>
              <label className="input-label">Email<input className="input-control" name="customer_email" type="email" required value={form.customer_email || user?.email || ""} onChange={updateField} /></label>
              <label className="input-label">Full name for delivery<input className="input-control" name="full_name" required value={form.full_name || user?.name || ""} onChange={updateField} /></label>
              <label className="input-label">Phone<input className="input-control" name="phone" type="tel" required value={form.phone} onChange={updateField} /></label>
              <label className="input-label">Address<input className="input-control" name="line1" required value={form.line1} onChange={updateField} /></label>
              <div className="form-grid">
                <label className="input-label">City<input className="input-control" name="city" required value={form.city} onChange={updateField} /></label>
                <label className="input-label">State<input className="input-control" name="state" required value={form.state} onChange={updateField} /></label>
              </div>
              <label className="input-label">Pincode<input className="input-control" name="pincode" required value={form.pincode} onChange={updateField} /></label>
            </section>
            <section className="admin-form form-stack">
              <h2>Demo payment</h2>
              <label className="flex gap-3 items-start"><input type="radio" name="payment" value="SIMULATED_CARD" checked={paymentMethod === "SIMULATED_CARD"} onChange={() => setPaymentMethod("SIMULATED_CARD")} /><span><strong>Simulated card payment</strong><small className="block">Completes the demo payment; no real charge is made.</small></span></label>
              <label className="flex gap-3 items-start"><input type="radio" name="payment" value="SIMULATED_FAILURE" checked={paymentMethod === "SIMULATED_FAILURE"} onChange={() => setPaymentMethod("SIMULATED_FAILURE")} /><span><strong>Simulate a declined payment</strong><small className="block">Demonstrates a failed payment; the cart stays unchanged.</small></span></label>
              <label className="flex gap-3 items-start"><input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} /><span><strong>Cash on delivery</strong><small className="block">Creates the order without an online payment.</small></span></label>
            </section>
            <button className="button" type="submit" disabled={submitting || !quote}>{submitting ? "Placing order…" : "Place demo order"}</button>
          </form>
          <aside className="summary-card">
            <h2>Order summary</h2>
            {cart.items.map((item) => <div className="order-row" key={item.id}><span>{item.product_name}<small>Qty {item.quantity}</small></span><strong>{formatCurrency(item.line_total)}</strong></div>)}
            <form className="form-stack mt-4" onSubmit={applyCoupon}>
              <label className="input-label" htmlFor="checkout-coupon">Discount code</label>
              <p className="text-sm">Demo code: URBANOVA10 for 10% off.</p>
              <div className="flex gap-2"><input id="checkout-coupon" className="input-control" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter code" /><button className="button button-light" type="submit">Apply</button></div>
              {couponMessage && <p className="text-sm" role="status">{couponMessage}</p>}
              {quote?.coupon_code && <button type="button" className="text-link" onClick={() => void removeCoupon()}>Remove applied discount</button>}
            </form>
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(quote?.subtotal ?? cart.subtotal)}</span></div>
            <div className="summary-row"><span>Discount</span><span>− {formatCurrency(quote?.discount ?? 0)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{formatCurrency(quote?.shipping ?? 0)}</span></div>
            <div className="summary-row"><span>Tax</span><span>{formatCurrency(quote?.tax ?? 0)}</span></div>
            <div className="summary-row total"><span>Total</span><span>{quote ? formatCurrency(quote.total) : "Calculating…"}</span></div>
            <Link className="text-link" href="/cart">Edit cart</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
