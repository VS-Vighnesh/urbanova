"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading) return <div className="page-loading">Checking your account…</div>;
  if (!user) {
    return (
      <div className="page-loading">
        Sign in to continue. <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Go to login</Link>
      </div>
    );
  }
  return <>{children}</>;
}
