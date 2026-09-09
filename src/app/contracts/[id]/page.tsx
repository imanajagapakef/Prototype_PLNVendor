"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { useContract } from "@/lib/store";
import { DEMO_CONTRACT, DOCUMENTS } from "@/lib/demo";
import {
  OWNER_LABEL,
  STAGES,
  TRANSITIONS,
  availableActions,
  progressFor,
  stageIndex,
  type ActionType,
  type DocState,
} from "@/lib/workflow";
import { ActivityList } from "@/components/activity";
import { Timeline } from "@/components/timeline";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const docTone: Record<DocState, BadgeTone> = {
  READY: "info",
  PENDING: "warn",
  APPROVED: "ok",
  REVISION_REQUIRED: "bad",
  MISSING: "muted",
};

type Tab = "overview" | "documents" | "workflow" | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "workflow", label: "Workflow" },
  { id: "activity", label: "Activity" },
];

export default function Workspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { stage, paid, activity, act, reset } = useContract();
  const [tab, setTab] = useState<Tab>("workflow");
  const [selected, setSelected] = useState<string>(stage);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<ActionType | null>(null);

  if (id !== DEMO_CONTRACT.id) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm">Unknown contract “{id}”. Demo only contains {DEMO_CONTRACT.id}.</p>
        <Link href="/" className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const idx = stageIndex(stage);
  const current = STAGES[idx];
  const progress = progressFor(stage);
  const sel = STAGES.find((s) => s.id === selected) ?? current;
  const selIdx = stageIndex(sel.id);
  const selState = selIdx < idx ? "done" : selIdx === idx ? "current" : "todo";
  const actions = availableActions(stage);
  const needsComment = (a: ActionType) =>
    a === "request-revision" || a === "request-correction";
  const readyDocs = DOCUMENTS.filter((d) => d.state === "READY" || d.state === "APPROVED").length;

  function run(a: ActionType) {
    if (needsComment(a) && !comment.trim()) return;
    setBusy(a);
    // Small delay so loading state is perceptible, then apply transition.
    setTimeout(() => {
      act(a, needsComment(a) ? comment.trim() : undefined);
      setComment("");
      setBusy(null);
      setSelected(TRANSITIONS[a].to);
    }, 350);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Dashboard
      </Link>

      {/* Header */}
      <section aria-labelledby="ws-title" className="rounded-lg border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="ws-title" className="text-2xl font-semibold tracking-tight">
              {DEMO_CONTRACT.id}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {DEMO_CONTRACT.project} · {DEMO_CONTRACT.vendor} · {DEMO_CONTRACT.location}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Contract Value</p>
            <p className="text-xl font-semibold tabular-nums">{DEMO_CONTRACT.value}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={paid ? "ok" : "info"}>
            {paid ? "PAID" : current.label}
          </Badge>
          <span className="text-sm tabular-nums text-muted">{progress}% complete</span>
        </div>
        {/* Tabs */}
        <div role="tablist" aria-label="Contract sections" className="mt-4 flex gap-1 border-t border-line pt-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100",
                tab === t.id ? "bg-zinc-100 text-ink" : "text-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {tab === "overview" && (
        <>
          <section aria-label="Overview" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-base font-semibold">Current Responsibility</h2>
            <p className="mt-2 text-xl font-semibold">{OWNER_LABEL[current.owner]}</p>
            <p className="text-sm text-muted">
              {current.label} · {readyDocs} / {DOCUMENTS.length} documents ready
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-base font-semibold">Recent Activity</h2>
            <div className="mt-3">
              <ActivityList entries={activity.slice(-4).reverse()} />
            </div>
          </div>
          </section>
          <section aria-label="Final package" className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-base font-semibold">
              Final Contract Package — {readyDocs} / {DOCUMENTS.length} ready
            </h2>
            <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {DOCUMENTS.map((d) => {
                const ok = d.state === "READY" || d.state === "APPROVED";
                return (
                  <li key={d.name} className="flex items-center gap-2 text-sm">
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                        ok ? "bg-ok text-white" : "bg-zinc-100 text-muted",
                      )}
                    >
                      {ok ? <Check className="size-3" /> : "○"}
                    </span>
                    <span className={cn("truncate", !ok && "text-muted")}>{d.name}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {tab === "documents" && (
        <section aria-label="Documents" className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-base font-semibold">
            Documents — {readyDocs} / {DOCUMENTS.length} ready
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {DOCUMENTS.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted">
                    {d.type} · {d.submittedBy} · {d.submittedAt}
                  </p>
                </div>
                <Badge tone={docTone[d.state]}>{d.state.replace("_", " ")}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "workflow" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-label="Stages" className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-base font-semibold">Stages</h2>
            <div className="mt-3">
              <Timeline current={stage} href={`/contracts/${id}`} />
            </div>
          </section>

          {/* Stage detail — inspection selects, actions mutate */}
          <section aria-label="Stage detail" className="h-fit rounded-lg border border-line bg-surface p-5">
            <label htmlFor="stage-select" className="text-xs font-medium text-muted">
              INSPECT STAGE
            </label>
            <select
              id="stage-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            >
              {STAGES.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {String(i + 1).padStart(2, "0")} · {s.label} — {OWNER_LABEL[s.owner]}
                </option>
              ))}
            </select>

            <h2 className="mt-4 text-lg font-semibold">{sel.label}</h2>
            <p className="text-sm text-muted">
              Assigned to {OWNER_LABEL[sel.owner]} ·{" "}
              {selState === "done" ? "Completed" : selState === "current" ? "In progress" : "Upcoming"}
            </p>

            {selected === stage ? (
              <div className="mt-4 space-y-3">
                {actions.some(needsComment) && (
                  <div>
                    <label htmlFor="action-comment" className="text-xs font-medium text-muted">
                      COMMENT (REQUIRED FOR REVISION / CORRECTION)
                    </label>
                    <input
                      id="action-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="e.g. RBA missing cable breakdown"
                      className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <Button
                      key={a}
                      variant={a === "request-revision" || a === "request-correction" ? "outline" : "default"}
                      disabled={busy !== null || (needsComment(a) && !comment.trim())}
                      onClick={() => run(a)}
                    >
                      {busy === a ? "Working…" : TRANSITIONS[a].label}
                    </Button>
                  ))}
                </div>
                {paid && <Badge tone="ok">Payment recorded (demo)</Badge>}
              </div>
            ) : (
              <p className="mt-4 rounded-md bg-zinc-100 px-3 py-2 text-sm text-muted">
                Read-only view. Actions appear only on the current stage ({current.label}).
              </p>
            )}
          </section>
        </div>
      )}

      {tab === "activity" && (
        <section aria-label="Full history" className="rounded-lg border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Full History ({activity.length})</h2>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw aria-hidden /> Reset demo
            </Button>
          </div>
          <div className="mt-3">
            <ActivityList entries={[...activity].reverse()} />
          </div>
        </section>
      )}
    </main>
  );
}
