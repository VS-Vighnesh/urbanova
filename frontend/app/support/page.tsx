"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";

interface TicketResponse {
  ticket_number: string;
  classification: string;
  response: string;
}

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      const result = await apiFetch<TicketResponse>("/api/support/submit", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim() || undefined,
          message: `${name.trim() ? `Name: ${name.trim()}\n` : ""}${message.trim()}`,
          customer_email: email.trim() || undefined,
        }),
      });
      setTicket(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page-shell support-shell">
      <div className="page-heading"><p className="eyebrow">Here to help</p><h1>Let’s sort it out.</h1><p>Send our team a note. We’ll get back to you as soon as we can.</p></div>
      {ticket ? (
        <div className="support-confirmation" role="status">
          <p className="eyebrow">Message received</p><h2>Thanks for reaching out.</h2>
          <p>Your reference number is <strong>{ticket.ticket_number}</strong>.</p>
          {ticket.response && <p>{ticket.response}</p>}
          <Link className="button button-light" href="/">Back to the shop</Link>
          <button className="text-link support-another" onClick={() => setTicket(null)}>Send another message</button>
        </div>
      ) : (
        <form className="support-form form-stack" onSubmit={submit}>
          {error && <div className="notice notice-error" role="alert">{error}</div>}
          <div className="form-grid">
            <label className="input-label">Your name<input className="input-control" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="input-label">Email address<input className="input-control" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          </div>
          <label className="input-label">Subject (optional)<input className="input-control" value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
          <label className="input-label">How can we help?<textarea className="textarea-control" value={message} onChange={(event) => setMessage(event.target.value)} required minLength={8} /></label>
          <button className="button" disabled={sending}>{sending ? "Sending your message…" : "Send to support"}</button>
        </form>
      )}
    </div>
  );
}
