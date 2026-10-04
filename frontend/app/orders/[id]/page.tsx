"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/admin/StatusBadge";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

function OrderDetails() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Order>(`/api/orders/${encodeURIComponent(params.id)}`)
      .then(setOrder)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  if (!order) return <div className="page-loading">{error || "Loading your order…"}</div>;
  const stages = ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];
  const currentIndex = stages.indexOf(order.fulfillment_status);
  return (
    <div className="page-shell">
      <Link className="text-link" href="/orders"><ArrowLeft size={15} /> All orders</Link>
      <div className="page-heading order-detail-heading"><p className="eyebrow">Order {order.order_number}</p><h1>It’s in good hands.</h1><p>Placed {formatDate(order.created_at)}</p></div>
      <div className="order-detail-layout">
        <section className="tracking-card"><div className="tracking-header"><div><h2>Order progress</h2><p>We’ll keep you posted as things move along.</p></div><StatusBadge status={order.fulfillment_status} /></div>
          <div className="timeline">{stages.map((status, index) => <div className={`timeline-step ${index <= currentIndex ? "complete" : ""}`} key={status}><span className="timeline-dot">{index + 1}</span><div><strong>{status.charAt(0) + status.slice(1).toLowerCase()}</strong></div></div>)}</div>
          <h3 className="order-items-title">Order items</h3>{order.items.map((item, index) => <div className="order-row" key={`${item.product_name}-${index}`}><span>{item.product_name}<small>Quantity: {item.quantity}</small></span><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}
        </section>
        <aside className="summary-card"><h2>Order summary</h2>
          <div className="summary-row"><span>Payment</span><StatusBadge status={order.payment_status} /></div>
          {order.payment_method && <div className="summary-row"><span>Method</span><span>{order.payment_method === "COD" ? "Cash on delivery" : "Demo card"}</span></div>}
          {order.pricing && <>
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(order.pricing.subtotal)}</span></div>
            {order.pricing.discount > 0 && <div className="summary-row summary-discount"><span>Discount{order.pricing.coupon_code ? ` · ${order.pricing.coupon_code}` : ""}</span><span>−{formatCurrency(order.pricing.discount)}</span></div>}
            <div className="summary-row"><span>Shipping</span><span>{order.pricing.shipping ? formatCurrency(order.pricing.shipping) : "Free"}</span></div>
            <div className="summary-row"><span>GST</span><span>{formatCurrency(order.pricing.tax)}</span></div>
          </>}
          <div className="summary-row total"><span>Total</span><span>{formatCurrency(order.total_amount)}</span></div>
          {order.shipping_address && <div className="address-block"><strong>Delivering to</strong><p>{Object.values(order.shipping_address).filter(Boolean).join(", ")}</p></div>}
        </aside>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return <ProtectedRoute><OrderDetails /></ProtectedRoute>;
}
