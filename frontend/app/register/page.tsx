// frontend/app/register/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { safeReturnPath } from "@/lib/utils";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const next = searchParams.get("next");
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({ name, email, password });
      const destination = safeReturnPath(searchParams.get("next"));
      const separator = destination.includes("?") ? "&" : "?";
      router.replace(`${destination}${separator}registered=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <h2>Join Urbanova.<br />Good things, every day.</h2>
        <p>Create an account to track your orders, save your favourites and check out faster next time.</p>
      </aside>
      <section className="auth-panel">
        <p className="eyebrow">New here</p>
        <h1>Create an account</h1>
        <p>It only takes a minute to get started.</p>
        <form className="form-stack" onSubmit={submit}>
          {error && <div className="notice notice-error" role="alert">{error}</div>}
          <label className="input-label">
            Full name
            <input
              className="input-control"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="input-label">
            Email address
            <input
              className="input-control"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="input-label">
            Password
            <input
              className="input-control"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="button button-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <div className="auth-foot">
          Already have an account? <Link href={loginHref}>Sign in</Link>
        </div>
      </section>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="page-loading">Loading registration…</div>}>
      <RegisterForm />
    </Suspense>
  );
}