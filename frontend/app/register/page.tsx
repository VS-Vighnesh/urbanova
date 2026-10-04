"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
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
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-aside"><h2>Find your new everyday favourite.</h2><p>A considered collection of useful things, chosen for the way life really happens.</p></aside>
      <section className="auth-panel">
        <p className="eyebrow">A good place to start</p><h1>Create account</h1><p>Join us to keep your orders and details in one place.</p>
        <form className="form-stack" onSubmit={submit}>
          {error && <div className="notice notice-error" role="alert">{error}</div>}
          <label className="input-label">Your name<input className="input-control" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label className="input-label">Email address<input className="input-control" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="input-label">Password<input className="input-control" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="button button-full" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}</button>
        </form>
        <div className="auth-foot">Already have an account? <Link href="/login">Sign in</Link></div>
      </section>
    </div>
  );
}
