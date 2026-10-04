"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface TaskDetails {
  id: string;
  task_number: string;
  title: string;
  description: string;
  status: string;
  agent_slug?: string;
  confidence?: number;
  execution_time?: number;
  result?: unknown;
  created_at?: string;
  executions: { id: string; workflow_name: string; status: string; execution_time?: number; error?: string; started_at?: string; completed_at?: string }[];
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<TaskDetails>(`/api/tasks/${encodeURIComponent(id)}`)
      .then(setTask)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (!task) return <div className="admin-content"><div className={error ? "notice notice-error" : "page-loading"}>{error || "Loading task details…"}</div></div>;
  return (
    <section className="admin-content">
      <Link className="text-link" href="/admin/tasks"><ArrowLeft size={15} /> All tasks</Link>
      <div className="admin-page-heading task-heading"><div><p className="eyebrow">{task.task_number}</p><h1>{task.title}</h1><p>{task.description}</p></div><StatusBadge status={task.status} /></div>
      <div className="task-info-grid"><div><span>Routed to</span><strong>{task.agent_slug || "Not assigned"}</strong></div><div><span>Confidence</span><strong>{task.confidence === undefined ? "—" : `${Math.round(task.confidence * 100)}%`}</strong></div><div><span>Execution time</span><strong>{task.execution_time ? `${task.execution_time.toFixed(2)}s` : "—"}</strong></div><div><span>Created</span><strong>{formatDate(task.created_at)}</strong></div></div>
      <h2 className="admin-section-title">Execution timeline</h2>
      {task.executions.length ? <div className="execution-list">{task.executions.map((execution) => <article className="execution-item" key={execution.id}><div><strong>{execution.workflow_name || "Agent workflow"}</strong><p>{formatDate(execution.started_at)}</p>{execution.error && <p className="form-error">{execution.error}</p>}</div><StatusBadge status={execution.status} /></article>)}</div> : <div className="empty-state"><p>No agent executions have been recorded yet.</p></div>}
      {task.result !== undefined && task.result !== null && <><h2 className="admin-section-title">Result</h2><pre className="result-block">{JSON.stringify(task.result, null, 2)}</pre></>}
    </section>
  );
}
