"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, PackageCheck } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

function ConfirmationContent() {
  const orderNumber = useSearchParams().get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber) {
      return;
    }
    let active = true;
    apiFetch<Order>(`/api/orders/track/${encodeURIComponent(orderNumber)}`)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [orderNumber]);

  if (!orderNumber) return <div className="page-shell"><div className="notice notice-error" role="alert">This confirmation link is missing its order number.</div><Link className="button button-light" href="/shop">Back to the shop</Link></div>;
  if (error) return <div className="page-shell"><div className="notice notice-error" role="alert">{error}</div><Link className="button button-light" href="/shop">Back to the shop</Link></div>;
  if (!order) return <div className="page-loading">Confirming your order…</div>;

  return (
    <div className="page-shell">
      <section className="confirmation-card">
        <div className="confirmation-icon"><Check size={26} /></div>
        <p className="eyebrow">That’s a good choice</p>
        <h1>Order confirmed.</h1>
        <p className="confirmation-copy">Thanks for shopping with Urbanova. We’ve got your order and will take good care of it.</p>
        <div className="confirmation-number"><span>Order number</span><strong>{order.order_number}</strong></div>
        <div className="confirmation-details">
          <div><span>Placed</span><strong>{formatDate(order.created_at)}</strong></div>
          <div><span>Payment</span><StatusBadge status={order.payment_status} /></div>
          <div><span>Total</span><strong>{formatCurrency(order.total_amount)}</strong></div>
        </div>
        {order.payment_method === "COD" && <p className="notice notice-success">Cash on delivery selected. Please pay when your order arrives.</p>}
        <Link className="button" href={`/orders?track=${encodeURIComponent(order.order_number)}`}><PackageCheck size={16} /> Track your order</Link>
        <Link className="confirmation-secondary" href="/shop">Keep exploring</Link>
      </section>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense fallback={<div className="page-loading">Confirming your order…</div>}><ConfirmationContent /></Suspense>;
}
