import { Check } from "lucide-react";
import { OWNER_LABEL, STAGES, stageIndex, type StageId } from "@/lib/workflow";
import { cn } from "@/lib/utils";

// Read-only operational rail. Items are status, never navigation:
// clicking a stage must not pretend to navigate or change state.
export function Timeline({
  current,
  dates,
}: {
  current: StageId;
  dates?: Partial<Record<StageId, string>>;
}) {
  const idx = stageIndex(current);
  return (
    <ol className="relative space-y-0.5">
      {STAGES.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "current" : "todo";
        const when = dates?.[s.id];
        return (
          <li key={s.id} aria-current={state === "current" ? "step" : undefined}>
            <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  state === "done" && "border-ok bg-ok text-surface",
                  state === "current" && "border-accent bg-accent text-surface ring-4 ring-accent/15",
                  state === "todo" && "border-line bg-surface text-muted",
                )}
              >
                {state === "done" ? (
                  <Check className="size-3.5" />
                ) : (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      state === "current" ? "animate-pulse bg-surface" : "bg-disabled",
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
            </div>
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
