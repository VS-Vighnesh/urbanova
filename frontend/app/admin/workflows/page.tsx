"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";

type WorkflowKey = "orchestrator" | "customer_support" | "sales" | "hr" | "invoice";
type WorkflowInfo = {
  slug: WorkflowKey;
  name: string;
  description: string;
  webhook_configured: boolean;
  available: boolean;
};
type WorkflowStatus = { demo_mode: boolean; workflows: WorkflowInfo[] };

const emptyForm: Record<string, string> = {
  title: "",
  description: "",
  priority: "MEDIUM",
  name: "",
  email: "",
  subject: "",
  message: "",
  source: "website",
  notes: "",
  position: "",
  skills: "",
  experience_years: "0",
  resume_text: "",
  invoice_number: "",
  vendor_name: "",
  vendor_email: "",
  amount: "",
  due_date: "",
  invoice_description: "",
};

export default function WorkflowsPage() {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowKey>("orchestrator");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    apiFetch<WorkflowStatus>("/api/workflows")
      .then(setStatus)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load workflow status."))
      .finally(() => setLoading(false));
  }, []);

  const selectedWorkflow = useMemo(
    () => status?.workflows.find((item) => item.slug === workflow),
    [status, workflow],
  );

  function updateField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseWorkflow(key: WorkflowKey) {
    setWorkflow(key);
    setError("");
    setResult(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      let endpoint: string;
      let body: Record<string, unknown>;
      switch (workflow) {
        case "orchestrator":
          endpoint = "/api/tasks";
          body = { title: form.title, description: form.description, priority: form.priority };
          break;
        case "customer_support":
          endpoint = "/api/support/submit";
          body = {
            customer_email: form.email || undefined,
            subject: form.subject || undefined,
            message: form.message,
          };
          break;
        case "sales":
          endpoint = "/api/leads";
          body = { name: form.name, email: form.email, source: form.source, notes: form.notes };
          break;
        case "hr":
          endpoint = "/api/hr/screen";
          body = {
            name: form.name,
            email: form.email,
            position: form.position,
            skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
            experience_years: Number(form.experience_years),
            resume_text: form.resume_text || undefined,
          };
          break;
        case "invoice":
          endpoint = "/api/invoices/process";
          body = {
            invoice_number: form.invoice_number,
            vendor_name: form.vendor_name,
            vendor_email: form.vendor_email || undefined,
            amount: Number(form.amount),
            due_date: form.due_date || undefined,
            description: form.invoice_description || undefined,
          };
          break;
      }
      const response = await apiFetch<unknown>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(response);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run this workflow.");
    } finally {
      setSubmitting(false);
    }
  }

  function field(
    key: string,
    label: string,
    options: { type?: string; required?: boolean; placeholder?: string } = {},
  ) {
    return (
      <label className="input-label" key={key}>
        {label}
        <input
          className="input-control"
          type={options.type || "text"}
          value={form[key]}
          onChange={(event) => updateField(key, event.target.value)}
          placeholder={options.placeholder}
          required={options.required}
          min={options.type === "number" ? 0 : undefined}
          step={options.type === "number" ? "any" : undefined}
        />
      </label>
    );
  }

  function textArea(key: string, label: string, required = false) {
    return (
      <label className="input-label" key={key}>
        {label}
        <textarea
          className="textarea-control"
          value={form[key]}
          onChange={(event) => updateField(key, event.target.value)}
          required={required}
        />
      </label>
    );
  }

  function renderFields() {
    switch (workflow) {
      case "orchestrator":
        return <>
          {field("title", "Task title", { required: true })}
          {textArea("description", "What should the agents do?", true)}
          <label className="input-label">Priority<select className="select-control" value={form.priority} onChange={(event) => updateField("priority", event.target.value)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
        </>;
      case "customer_support":
        return <>
          {field("email", "Customer email", { type: "email" })}
          {field("subject", "Subject")}
          {textArea("message", "Customer message", true)}
        </>;
      case "sales":
        return <>
          {field("name", "Lead name", { required: true })}
          {field("email", "Lead email", { type: "email", required: true })}
          {field("source", "Source")}
          {textArea("notes", "Lead context")}
        </>;
      case "hr":
        return <>
          {field("name", "Candidate name", { required: true })}
          {field("email", "Candidate email", { type: "email", required: true })}
          {field("position", "Position", { required: true })}
          {field("skills", "Skills (comma separated)", { required: true })}
          {field("experience_years", "Years of experience", { type: "number", required: true })}
          {textArea("resume_text", "Resume notes")}
        </>;
      case "invoice":
        return <>
          {field("invoice_number", "Invoice number", { required: true })}
          {field("vendor_name", "Vendor name", { required: true })}
          {field("vendor_email", "Vendor email", { type: "email" })}
          {field("amount", "Amount", { type: "number", required: true })}
          {field("due_date", "Due date", { type: "datetime-local" })}
          {textArea("invoice_description", "Invoice description")}
        </>;
    }
  }

  return (
    <section className="admin-content">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Automation workspace</p>
          <h1>Run a workflow</h1>
          <p>Send a realistic request through the same entry points used by the business agents.</p>
        </div>
      </div>
      {status && (
        <div className={`notice ${status.demo_mode ? "notice-success" : "notice-info"}`} role="status">
          {status.demo_mode
            ? "Demo mode is on: workflow results are simulated and clearly marked in this workspace."
            : "Live mode is on: requests are sent to configured n8n webhooks."}
        </div>
      )}
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      <div className="workflow-status-grid">
        {status?.workflows.map((item) => (
          <button
            type="button"
            className={`workflow-status-card ${workflow === item.slug ? "workflow-status-card-active" : ""}`}
            key={item.slug}
            onClick={() => chooseWorkflow(item.slug)}
          >
            <strong>{item.name}</strong>
            <span>{item.description}</span>
            <small>{status.demo_mode ? "Demo simulator" : item.webhook_configured ? "n8n webhook configured" : "Webhook not configured"}</small>
          </button>
        ))}
        <div className="workflow-status-card workflow-status-card-external">
          <strong>Email intake (Gmail)</strong>
          <span>Starts automatically when the configured Gmail Trigger receives a matching message in n8n.</span>
          <small>External event — activate the trigger in n8n</small>
        </div>
      </div>
      <div className="workflow-runner">
        <div className="workflow-runner-copy">
          <p className="eyebrow">{selectedWorkflow?.name || "Workflow"}</p>
          <h2>Try it with sample data</h2>
          <p>{selectedWorkflow?.description}</p>
        </div>
        <form className="admin-form form-stack" onSubmit={submit}>
          {renderFields()}
          <button className="button" disabled={submitting || loading || !selectedWorkflow?.available}>
            {submitting ? "Running workflow…" : `Run ${selectedWorkflow?.name || "workflow"}`}
          </button>
          {!loading && selectedWorkflow && !selectedWorkflow.available && (
            <p className="notice notice-error">Configure this workflow’s webhook in the backend environment before using live mode.</p>
          )}
        </form>
        {result !== null && (
          <section className="workflow-result" aria-live="polite">
            <h3>Workflow response</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </section>
        )}
      </div>
    </section>
  );
}
