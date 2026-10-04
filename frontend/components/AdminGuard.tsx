"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Verifying admin access…</div>;
  if (!user) {
    return (
      <div className="page-loading">
        Please <Link href="/login">sign in</Link> with an admin account.
      </div>
    );
  }
  if (!["ADMIN", "MANAGER"].includes(user.role.toUpperCase())) {
    return <div className="page-loading">This area is available to store administrators only.</div>;
  }
  return <>{children}</>;
}
