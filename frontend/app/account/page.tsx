"use client";

import Link from "next/link";
import { ArrowRight, LogOut, Package, UserRound } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

function AccountDetails() {
  const { user, logout } = useAuth();

  function signOut() {
    logout();
    window.location.replace("/");
  }

  if (!user) return null;

  return (
    <div className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Your Urbanova account</p>
        <h1>Hello, {user.name.split(" ")[0]}.</h1>
        <p>Your details and orders, together in one place.</p>
      </div>
      <div className="account-page-grid">
        <section className="account-profile-card">
          <span className="account-profile-icon"><UserRound size={22} /></span>
          <p className="eyebrow">Profile details</p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="account-role">{user.role.toLowerCase()}</span>
        </section>
        <section className="account-shortcut-card">
          <Package size={22} />
          <div>
            <h2>Your orders</h2>
            <p>See your order history or track a delivery.</p>
          </div>
          <Link href="/orders" aria-label="View your orders"><ArrowRight size={18} /></Link>
        </section>
      </div>
      <button className="button button-light account-logout" onClick={signOut}>
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}

export default function AccountPage() {
  return <ProtectedRoute><AccountDetails /></ProtectedRoute>;
}
