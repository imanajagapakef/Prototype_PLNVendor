import type { ActivityEntry } from "@/lib/workflow";

export function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  return (
    <ol className="space-y-4">
      {entries.map((e) => (
        <li key={e.id} className="flex gap-3">
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-accent/60" />
          <div className="min-w-0">
            <p className="text-xs tabular-nums text-muted">{e.at}</p>
            <p className="text-sm font-medium">{e.action}</p>
            <p className="text-xs text-muted">
              {e.actor} · {e.role}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
