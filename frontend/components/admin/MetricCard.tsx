import type { LucideIcon } from "lucide-react";

export default function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon"><Icon size={18} strokeWidth={1.8} /></div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}
