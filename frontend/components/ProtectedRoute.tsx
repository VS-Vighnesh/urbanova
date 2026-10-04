"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <div className="page-loading">Checking your account…</div>;
  if (!user) {
    return (
      <div className="page-loading">
        Sign in to continue. <Link href="/login">Go to login</Link>
      </div>
    );
  }
  return <>{children}</>;
}
