import Link from "next/link";
import { Check } from "lucide-react";
import { OWNER_LABEL, STAGES, stageIndex, type StageId } from "@/lib/workflow";
import { cn } from "@/lib/utils";

// Navigation only: clicking a stage opens the workspace, never changes state.
export function Timeline({
  current,
  href,
  dates,
}: {
  current: StageId;
  href: string;
  dates?: Partial<Record<StageId, string>>;
}) {
  const idx = stageIndex(current);
  return (
    <ol className="relative space-y-0.5">
      {STAGES.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "current" : "todo";
        const when = dates?.[s.id];
        return (
          <li key={s.id}>
            <Link
              href={href}
              className="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-100 focus-visible:outline-2"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  state === "done" && "border-ok bg-ok text-white",
                  state === "current" && "border-accent bg-accent text-white ring-4 ring-accent/15",
                  state === "todo" && "border-line bg-surface text-muted",
                )}
              >
                {state === "done" ? (
                  <Check className="size-3.5" />
                ) : (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      state === "current" ? "animate-pulse bg-white" : "bg-zinc-300",
                    )}
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm",
                    state === "current" ? "font-semibold" : "font-normal",
                    state === "todo" && "text-muted",
                  )}
                >
                  {String(i + 1).padStart(2, "0")} · {s.label}
                </span>
                <span className="mono block text-xs text-muted">
                  {OWNER_LABEL[s.owner]}
                  {when ? ` · ${when}` : state === "current" ? " · BERJALAN" : ""}
                </span>
              </span>
              {state === "current" && (
                <span className="shrink-0 rounded-full bg-info-bg px-2 py-0.5 text-xs font-medium text-info">
                  Saat Ini
                </span>
              )}
            </Link>
            {i < STAGES.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "ml-[19px] block h-3 w-px",
                  i < idx ? "bg-ok" : i === idx ? "bg-accent/50" : "bg-line",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
