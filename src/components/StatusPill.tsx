import { statusTone, type Status } from "@/lib/mock-data";

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`status-pill ${statusTone[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
