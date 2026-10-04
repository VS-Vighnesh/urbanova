"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Suspense } from "react";

function FailureContent() {
  const reason = useSearchParams().get("reason");
  return (
    <div className="page-shell">
      <section className="confirmation-card payment-failure">
        <div className="failure-icon"><AlertTriangle size={25} /></div>
        <p className="eyebrow">No payment was taken</p>
        <h1>Payment didn’t go through.</h1>
        <p className="confirmation-copy">{reason || "The demo payment was declined. Your bag is still saved, so you can try again or choose cash on delivery."}</p>
        <div className="failure-actions">
          <Link className="button" href="/checkout"><RotateCcw size={15} /> Try again</Link>
          <Link className="button button-light" href="/cart">Return to your bag</Link>
        </div>
      </section>
    </div>
  );
}

export default function CheckoutFailurePage() {
  return <Suspense fallback={<div className="page-loading">Loading payment status…</div>}><FailureContent /></Suspense>;
}
