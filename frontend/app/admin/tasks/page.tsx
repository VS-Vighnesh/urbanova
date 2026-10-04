"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function TasksPage() {
  const [version, setVersion] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch("/api/tasks", { method: "POST", body: JSON.stringify({ title, description, priority }) });
      setTitle("");
      setDescription("");
      setVersion((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create this task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-page-heading"><div><p className="eyebrow">Operations</p><h1>Tasks</h1><p>Ask the orchestrator to route a piece of work to the right agent.</p></div></div>
      <form className="admin-form form-stack" onSubmit={submit}>
        <h2 className="form-title">Create a task</h2>
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        <label className="input-label">Task title<input className="input-control" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label className="input-label">What needs to be done?<textarea className="textarea-control" value={description} onChange={(e) => setDescription(e.target.value)} required /></label>
        <label className="input-label">Priority<select className="select-control" value={priority} onChange={(e) => setPriority(e.target.value)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
        <button className="button" disabled={submitting}>{submitting ? "Sending to orchestrator…" : "Create task"}</button>
      </form>
      <h2 className="admin-section-title">Task history</h2>
      <AdminResourcePage key={version} title="Task history" description="Recent tasks and their current status." endpoint="/api/tasks" arrayKey="tasks" columns={[{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "agent_slug", label: "Agent", format: "name" }, { key: "status", label: "Status", format: "status" }, { key: "created_at", label: "Created", format: "date" }]} actionType="task" />
    </div>
  );
}
