"use client";

import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { useContract } from "@/lib/store";
import { ACTION_REQUIRED, DEMO_CONTRACT } from "@/lib/demo";
import {
  OWNER_LABEL,
  STAGES,
  progressFor,
  stageIndex,
} from "@/lib/workflow";
import { ActivityList } from "@/components/activity";
import { Timeline } from "@/components/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const wsHref = `/contracts/${DEMO_CONTRACT.id}`;

export default function Dashboard() {
  const { stage, activity } = useContract();
  const idx = stageIndex(stage);
  const current = STAGES[idx];
  const progress = progressFor(stage);
  const last = activity[activity.length - 1];
  const hasLoop = activity.some((a) => /revision|correction/i.test(a.action));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* 1. Contract identity */}
      <section aria-labelledby="contract-title" className="rounded-lg border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted">
              ACTIVE CONTRACT
            </p>
            <h1 id="contract-title" className="mt-1 text-2xl font-semibold tracking-tight">
              {DEMO_CONTRACT.id} — {DEMO_CONTRACT.project}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {DEMO_CONTRACT.vendor} · {DEMO_CONTRACT.location} ·{" "}
              {DEMO_CONTRACT.start} → {DEMO_CONTRACT.end}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Contract Value</p>
            <p className="text-xl font-semibold tabular-nums">{DEMO_CONTRACT.value}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="info">{current.label}</Badge>
          <span className="text-sm tabular-nums text-muted">{progress}% complete</span>
          {hasLoop && (
            <Badge tone="warn">
              <History className="size-3" aria-hidden />
              Has revision history
            </Badge>
          )}
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Contract progress"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {/* 2. Current responsibility — focal point */}
      <section
        aria-labelledby="responsibility-title"
        className="rounded-lg border border-line border-l-4 border-l-accent bg-surface p-5"
      >
        <p className="text-xs font-medium tracking-wide text-muted">
          CURRENT RESPONSIBILITY
        </p>
        <h2 id="responsibility-title" className="mt-1 text-xl font-semibold">
          {OWNER_LABEL[current.owner]}
        </h2>
        <p className="mt-1 text-sm">
          {current.label} for {DEMO_CONTRACT.id}
        </p>
        <p className="mt-1 text-xs text-muted">
          Last update: {last.at} — {last.action}
        </p>
        <Link href={wsHref} className="mt-3 inline-block">
          <Button>
            Review <ArrowRight aria-hidden />
          </Button>
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* 3. Workflow */}
        <section aria-labelledby="workflow-title" className="rounded-lg border border-line bg-surface p-5">
          <h2 id="workflow-title" className="text-base font-semibold">
            Workflow
          </h2>
          <p className="mb-3 text-xs text-muted">
            Select a stage to inspect it. Selection never changes state.
          </p>
          <Timeline current={stage} href={wsHref} />
        </section>

        <div className="space-y-6">
          {/* 4. Action required */}
          <section aria-labelledby="actions-title" className="rounded-lg border border-line bg-surface p-5">
            <h2 id="actions-title" className="text-base font-semibold">
              {ACTION_REQUIRED.length} Actions Required
            </h2>
            <ul className="mt-3 space-y-3">
              {ACTION_REQUIRED.map((a) => (
                <li
                  key={a.title}
                  className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted">{a.desc}</p>
                  </div>
                  <Link href={wsHref}>
                    <Button variant="outline">Review</Button>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Recent activity */}
          <section aria-labelledby="activity-title" className="rounded-lg border border-line bg-surface p-5">
            <h2 id="activity-title" className="text-base font-semibold">
              Recent Activity
            </h2>
            <div className="mt-3">
              <ActivityList entries={activity.slice(-5).reverse()} />
            </div>
            <Link
              href={wsHref}
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              Open full history
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
