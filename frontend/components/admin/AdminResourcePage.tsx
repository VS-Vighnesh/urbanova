"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Play, RotateCw, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate, humanize } from "@/lib/utils";
import StatusBadge from "@/components/admin/StatusBadge";

type Row = Record<string, unknown>;
type Column = { key: string; label: string; format?: "currency" | "date" | "status" | "name" };

async function fetchRows(endpoint: string, arrayKey?: string): Promise<Row[]> {
  const response = await apiFetch<unknown>(endpoint);
  const data = arrayKey && typeof response === "object" && response !== null
    ? (response as Record<string, unknown>)[arrayKey]
    : response;
  if (!Array.isArray(data)) throw new Error("The API returned an unexpected response.");
  return data as Row[];
}

export default function AdminResourcePage({
  title,
  description,
  endpoint,
  columns,
  arrayKey,
  actionType,
  headerAction,
}: {
  title: string;
  description: string;
  endpoint: string;
  columns: Column[];
  arrayKey?: string;
  actionType?: "approval" | "lead" | "support" | "product" | "customer" | "task" | "order";
  headerAction?: ReactNode;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const reload = useCallback(async () => {
    try {
      setRows(await fetchRows(endpoint, arrayKey));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load this information.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, arrayKey]);

  useEffect(() => {
    let active = true;
    fetchRows(endpoint, arrayKey)
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [endpoint, arrayKey]);

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(search.toLowerCase())),
  );

  function refresh() {
    setLoading(true);
    setError("");
    void reload();
  }

  function cellValue(row: Row, column: Column) {
    const value = row[column.key];
    if (column.format === "status") return <StatusBadge status={String(value ?? "")} />;
    if (column.format === "currency") return formatCurrency(Number(value || 0));
    if (column.format === "date") return formatDate(typeof value === "string" ? value : null);
    if (column.format === "name") return humanize(String(value ?? ""));
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  async function performAction(row: Row, action: string) {
    const id = String(row.id || "");
    if (!id) return;
    setActionError("");
    setActionMessage("");
    setBusyId(id);
    try {
      if (actionType === "approval") {
        await apiFetch(`/api/approvals/${id}/${action}`, { method: "POST" });
      } else if (actionType === "support") {
        await apiFetch(`/api/support/${id}/resolve`, { method: "POST" });
      } else if (actionType === "lead") {
        await apiFetch(`/api/leads/${id}/status?status=${encodeURIComponent(action)}`, { method: "PATCH" });
      } else if (actionType === "order") {
        await apiFetch(`/api/admin/orders/${id}`, {
          method: "PUT",
          body: JSON.stringify({ fulfillment_status: action }),
        });
      }
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to complete this action.");
    } finally {
      setBusyId("");
    }
  }

  async function runLeadWorkflow(row: Row) {
    const id = String(row.id || "");
    if (!id) return;
    setActionError("");
    setActionMessage("");
    setBusyId(id);
    try {
      await apiFetch(`/api/leads/${id}/run`, { method: "POST" });
      setActionMessage(`Sales workflow completed for ${String(row.lead_name || row.name || "this lead")}.`);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to run the Sales workflow.");
    } finally {
      setBusyId("");
    }
  }

  function renderAction(row: Row) {
    const id = String(row.id || "");
    if (actionType === "product") return <Link className="table-link" href={`/admin/products/${id}/edit`}>Edit <ArrowUpRight size={14} /></Link>;
    if (actionType === "customer") return <Link className="table-link" href={`/admin/customers/${id}`}>Details <ArrowUpRight size={14} /></Link>;
    if (actionType === "task") return <Link className="table-link" href={`/admin/tasks/${id}`}>Details <ArrowUpRight size={14} /></Link>;
    if (actionType === "approval") return <div className="table-actions"><button className="button button-small" disabled={busyId === id} onClick={() => void performAction(row, "approve")}>Approve</button><button className="button button-small button-quiet" disabled={busyId === id} onClick={() => void performAction(row, "reject")}>Reject</button></div>;
    if (actionType === "support") return <button className="button button-small button-quiet" disabled={busyId === id || String(row.status) === "RESOLVED"} onClick={() => void performAction(row, "resolve")}>{String(row.status) === "RESOLVED" ? "Resolved" : "Resolve"}</button>;
    if (actionType === "lead") return <div className="table-actions"><select className="table-select" aria-label="Update lead status" value={String(row.status || "NEW")} disabled={busyId === id} onChange={(event) => void performAction(row, event.target.value)}>{["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"].map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</select><button className="button button-small button-quiet" aria-label="Run Sales workflow for lead" title="Run Sales workflow" disabled={busyId === id} onClick={() => void runLeadWorkflow(row)}><Play size={13} /> Run</button></div>;
    if (actionType === "order") return <select className="table-select" aria-label="Update fulfillment status" value={String(row.fulfillment_status || "CONFIRMED")} disabled={busyId === id} onChange={(event) => void performAction(row, event.target.value)}>{["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</select>;
    return null;
  }

  return (
    <section className="admin-content">
      <div className="admin-page-heading">
        <div><p className="eyebrow">Urbanova operations</p><h1>{title}</h1><p>{description}</p></div>
        {headerAction}
      </div>
      <div className="admin-toolbar">
        <label className="admin-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}…`} /></label>
        <button className="button button-quiet button-small" onClick={refresh} disabled={loading}><RotateCw size={15} /> Refresh</button>
      </div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {actionError && <div className="notice notice-error" role="alert">{actionError}</div>}
      {actionMessage && <div className="notice notice-success" role="status">{actionMessage}</div>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}{actionType && <th>Actions</th>}</tr></thead>
          <tbody>
            {loading ? <tr><td className="table-message" colSpan={columns.length + (actionType ? 1 : 0)}>Loading…</td></tr> :
              filteredRows.length === 0 ? <tr><td className="table-message" colSpan={columns.length + (actionType ? 1 : 0)}>{error ? "Data could not be loaded." : "Nothing to show yet."}</td></tr> :
                filteredRows.map((row, index) => (
                  <tr key={String(row.id ?? row.order_number ?? index)}>
                    {columns.map((column) => <td key={column.key}>{cellValue(row, column)}</td>)}
                    {actionType && <td>{renderAction(row)}</td>}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
