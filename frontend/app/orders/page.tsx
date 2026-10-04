"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, PackageSearch } from "lucide-react";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/admin/StatusBadge";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const initialTrackNumber = searchParams.get("track");
  const [trackNumber, setTrackNumber] = useState(initialTrackNumber || "");
  const [tracking, setTracking] = useState(Boolean(initialTrackNumber));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const number = initialTrackNumber;
    if (!number) return;
    apiFetch<Order>(`/api/orders/track/${encodeURIComponent(number)}`)
      .then(setTrackingOrder)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [initialTrackNumber]);

  useEffect(() => {
    if (tracking) return;
    apiFetch<Order[]>("/api/orders")
      .then(setOrders)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tracking]);

  async function track(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    setTracking(true);
    try {
      setTrackingOrder(await apiFetch<Order>(`/api/orders/track/${encodeURIComponent(trackNumber.trim())}`));
    } catch (err) {
      setTrackingOrder(null);
      setError(err instanceof Error ? err.message : "Unable to find this order.");
    } finally {
      setLoading(false);
    }
  }

  function showMyOrders() {
    setTracking(false);
    setLoading(true);
    setTrackingOrder(null);
    setError("");
  }

  return (
    <div className="page-shell">
      <div className="page-heading"><p className="eyebrow">From us to you</p><h1>{tracking ? "Track your order." : "Your orders."}</h1><p>{tracking ? "Enter the order number from your confirmation to see its latest status." : "A little update on the good things coming your way."}</p></div>
      <form className="tracking-form" onSubmit={track}>
        <label className="input-label">Order number<input className="input-control" placeholder="e.g. UV-12345" value={trackNumber} onChange={(event) => setTrackNumber(event.target.value)} required /></label>
        <button className="button" disabled={loading}>Track order</button>
        {tracking && <button type="button" className="button button-quiet" onClick={showMyOrders}>My orders</button>}
      </form>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {loading ? <div className="page-loading">Looking up your order…</div> : tracking ? trackingOrder ? (
        <div className="tracking-card">
          <div className="tracking-header"><div><p className="eyebrow">Order {trackingOrder.order_number}</p><h2>On its way to a good home.</h2><p>Placed {formatDate(trackingOrder.created_at)}</p></div><StatusBadge status={trackingOrder.fulfillment_status} /></div>
          <div className="tracking-details"><div><span>Payment</span><StatusBadge status={trackingOrder.payment_status} /></div><div><span>Total</span><strong>{formatCurrency(trackingOrder.total_amount)}</strong></div></div>
          <div className="timeline">{["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].map((status, index) => {
            const stages = ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];
            const currentIndex = stages.indexOf(trackingOrder.fulfillment_status);
            return <div className={`timeline-step ${index <= currentIndex ? "complete" : ""}`} key={status}><span className="timeline-dot">{index + 1}</span><div><strong>{status.charAt(0) + status.slice(1).toLowerCase()}</strong><p>{index === 0 ? "We have your order." : index === 3 ? "Your parcel is on its way." : index === 4 ? "Enjoy your new favourite." : "We’re getting everything ready."}</p></div></div>;
          })}</div>
          <h3 className="order-items-title">In this order</h3>
          {trackingOrder.items.map((item, index) => <div className="order-row" key={`${item.product_name}-${index}`}><span>{item.product_name}<small>Quantity: {item.quantity}</small></span><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}
        </div>
      ) : !error ? <div className="empty-state"><PackageSearch size={28} /><h2>We haven’t found that order.</h2><p>Check the order number and try again.</p></div> : null : (
        <ProtectedRoute>
          {orders.length ? <div className="orders-list">{orders.map((order) => <Link className="order-list-card" key={order.id} href={`/orders/${order.id}`}><div><span className="order-number">{order.order_number}</span><small>{formatDate(order.created_at)} · {order.items.length} items</small></div><strong>{formatCurrency(order.total_amount)}</strong><StatusBadge status={order.fulfillment_status} /><ArrowRight size={16} /></Link>)}</div> :
            <div className="empty-state"><h2>No orders yet.</h2><p>When you find something you love, your order details will live here.</p><Link href="/shop" className="button">Explore the collection</Link></div>}
        </ProtectedRoute>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <Suspense fallback={<div className="page-loading">Loading orders…</div>}><OrdersContent /></Suspense>;
}
