import { humanize } from "@/lib/utils";

export default function StatusBadge({ status }: { status?: string | null }) {
  const tone = (status || "unknown").toLowerCase().replaceAll("_", "-");
  return <span className={`status-badge status-${tone}`}>{humanize(status)}</span>;
}
