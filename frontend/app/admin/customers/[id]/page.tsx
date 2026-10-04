"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  total_orders: number;
  total_spend: number;
  last_order_at?: string;
  status: string;
  created_at: string;
}

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Customer>(`/api/customers/${encodeURIComponent(id)}`)
      .then(setCustomer)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (!customer) return <div className="admin-content"><div className={error ? "notice notice-error" : "page-loading"}>{error || "Loading customer…"}</div></div>;
  return <section className="admin-content"><Link className="text-link" href="/admin/customers"><ArrowLeft size={15} /> Customers</Link><div className="admin-page-heading"><div><p className="eyebrow">Customer profile</p><h1>{customer.name}</h1><p>Customer since {formatDate(customer.created_at)}</p></div></div><div className="customer-profile-grid"><article className="metric-card"><span><ShoppingBagIcon /> Orders</span><strong>{customer.total_orders}</strong></article><article className="metric-card"><span>Lifetime spend</span><strong>{formatCurrency(customer.total_spend)}</strong></article></div><div className="customer-contact-card"><h2>Contact details</h2><p><Mail size={16} /> <a href={`mailto:${customer.email}`}>{customer.email}</a></p>{customer.phone && <p><Phone size={16} /> <a href={`tel:${customer.phone}`}>{customer.phone}</a></p>}{customer.address && <p><MapPin size={16} /> {customer.address}</p>}<p>Last order: {formatDate(customer.last_order_at)}</p></div></section>;
}

function ShoppingBagIcon() {
  return <span aria-hidden="true">✦</span>;
}
