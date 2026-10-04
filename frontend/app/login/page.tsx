"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace(searchParams.get("next") || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-aside"><h2>Come on in.<br />Your good things are waiting.</h2><p>Sign in to see your orders, save your favourites and make checkout a little quicker next time.</p></aside>
      <section className="auth-panel">
        <p className="eyebrow">Welcome back</p><h1>Sign in</h1><p>Use your Urbanova account details to continue.</p>
        <form className="form-stack" onSubmit={submit}>
          {error && <div className="notice notice-error" role="alert">{error}</div>}
          <label className="input-label">Email address<input className="input-control" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="input-label">Password<input className="input-control" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="button button-full" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
        </form>
        <div className="auth-foot">New to Urbanova? <Link href="/register">Create an account</Link></div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="page-loading">Loading sign in…</div>}><LoginForm /></Suspense>;
}
