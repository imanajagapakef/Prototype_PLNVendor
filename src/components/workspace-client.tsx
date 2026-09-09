"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { DOC_STATE_LABEL, OWNER_LABEL, STAGES, TRANSITIONS, availableActions, progressFor, stageIndex, type ActionType, type DocState, type StageId } from "@/lib/workflow";
import { ActivityList } from "@/components/activity";
import { Timeline } from "@/components/timeline";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { transitionAction, uploadAction } from "@/app/contracts/[id]/actions";
import { signOut } from "@/app/login/actions";
import { cn } from "@/lib/utils";

export interface WsDoc {
  id: string;
  name: string;
  type: string;
  state: DocState;
  submittedBy: string;
  submittedAt: string;
}
export interface WsActivity {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
}
export interface WsContract {
  id: string;
  project: string;
  vendor: string;
  location: string;
  value: string;
  stage: StageId;
  paid: boolean;
}

const docTone: Record<DocState, BadgeTone> = {
  READY: "info",
  PENDING: "warn",
  APPROVED: "ok",
  REVISION_REQUIRED: "bad",
  MISSING: "muted",
};

type Tab = "overview" | "documents" | "workflow" | "activity";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Ringkasan" },
  { id: "documents", label: "Dokumen" },
  { id: "workflow", label: "Alur Kerja" },
  { id: "activity", label: "Aktivitas" },
];

const DOC_TYPES = ["Kontrak", "RBA", "Teknis", "Persetujuan", "Material", "SPK", "Pelaksanaan", "Inspeksi", "Serah Terima", "Pendukung"];

export function WorkspaceClient({
  contract,
  documents,
  activities,
  err,
}: {
  contract: WsContract;
  documents: WsDoc[];
  activities: WsActivity[];
  err?: string;
}) {
  const [tab, setTab] = useState<Tab>("workflow");
  const [selected, setSelected] = useState<string>(contract.stage);
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();

  const idx = stageIndex(contract.stage);
  const current = STAGES[idx];
  const progress = progressFor(contract.stage);
  const sel = STAGES.find((s) => s.id === selected) ?? current;
  const selIdx = stageIndex(sel.id);
  const selState = selIdx < idx ? "done" : selIdx === idx ? "current" : "todo";
  const actions = availableActions(contract.stage);
  const needsComment = (a: ActionType) =>
    a === "request-revision" || a === "request-correction";
  const readyDocs = documents.filter(
    (d) => d.state === "READY" || d.state === "APPROVED",
  ).length;

  function run(a: ActionType) {
    if (needsComment(a) && !comment.trim()) return;
    start(async () => {
      await transitionAction(contract.id, a, comment.trim() || undefined);
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Dasbor
        </Link>
        <form action={signOut}>
          <Button variant="ghost" type="submit">Keluar</Button>
        </form>
      </div>
      {err && (
        <p role="alert" className="rounded-md border border-bad bg-bad-bg px-3 py-2 text-sm text-bad">
          {err}
        </p>
      )}

      <section aria-labelledby="ws-title" className="rounded-lg border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="ws-title" className="text-2xl font-semibold tracking-tight">
              {contract.id}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {contract.project} · {contract.vendor} · {contract.location}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Nilai Kontrak</p>
            <p className="text-xl font-semibold tabular-nums">{contract.value}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={contract.paid ? "ok" : "info"}>
            {contract.paid ? "LUNAS" : current.label}
          </Badge>
          <span className="text-sm tabular-nums text-muted">{progress}% selesai</span>
        </div>
        <div role="tablist" aria-label="Bagian kontrak" className="mt-4 flex gap-1 border-t border-line pt-3">
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
          <section aria-label="Ringkasan" className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-base font-semibold">Penanggung Jawab Saat Ini</h2>
              <p className="mt-2 text-xl font-semibold">{OWNER_LABEL[current.owner]}</p>
              <p className="text-sm text-muted">
                {current.label} · {readyDocs} / {documents.length} dokumen siap
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-base font-semibold">Aktivitas Terakhir</h2>
              <div className="mt-3">
                <ActivityList entries={activities.slice(-4).reverse()} />
              </div>
            </div>
          </section>
          <section aria-label="Paket final" className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-base font-semibold">
              Paket Dokumen Final — {readyDocs} / {documents.length} siap
            </h2>
            <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {documents.map((d) => {
                const ok = d.state === "READY" || d.state === "APPROVED";
                return (
                  <li key={d.id} className="flex items-center gap-2 text-sm">
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
        <section aria-label="Dokumen" className="space-y-6">
          <div className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-base font-semibold">
              Dokumen — {readyDocs} / {documents.length} siap
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted">
                      {d.type} · {d.submittedBy} · {d.submittedAt}
                    </p>
                  </div>
                  <Badge tone={docTone[d.state]}>{DOC_STATE_LABEL[d.state]}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <form
            action={uploadAction.bind(null, contract.id)}
            className="rounded-lg border border-line bg-surface p-5"
          >
            <h2 className="text-base font-semibold">Unggah dokumen demo</h2>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="docType" className="text-xs font-medium text-muted">JENIS</label>
                <select id="docType" name="docType" className="mt-1 block rounded-md border border-line bg-surface px-3 py-2 text-sm">
                  {DOC_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="file" className="text-xs font-medium text-muted">FILE (PDF/JPG/PNG, MAKS 5MB)</label>
                <input id="file" name="file" type="file" required className="mt-1 block text-sm" />
              </div>
              <Button type="submit">Unggah</Button>
            </div>
          </form>
        </section>
      )}

      {tab === "workflow" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-label="Tahapan" className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-base font-semibold">Tahapan</h2>
            <div className="mt-3">
              <Timeline current={contract.stage} href={`/contracts/${contract.id}`} />
            </div>
          </section>
          <section aria-label="Detail tahap" className="h-fit rounded-lg border border-line bg-surface p-5">
            <label htmlFor="stage-select" className="text-xs font-medium text-muted">PERIKSA TAHAP</label>
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
              Ditugaskan ke {OWNER_LABEL[sel.owner]} ·{" "}
              {selState === "done" ? "Selesai" : selState === "current" ? "Berjalan" : "Mendatang"}
            </p>
            {selected === contract.stage ? (
              <div className="mt-4 space-y-3">
                {actions.some(needsComment) && (
                  <div>
                    <label htmlFor="action-comment" className="text-xs font-medium text-muted">
                      KOMENTAR (WAJIB UNTUK REVISI / PERBAIKAN)
                    </label>
                    <input
                      id="action-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="cth. RBA kurang rincian kabel"
                      className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <Button
                      key={a}
                      variant={a === "request-revision" || a === "request-correction" ? "outline" : "default"}
                      disabled={pending || (needsComment(a) && !comment.trim())}
                      onClick={() => run(a)}
                    >
                      {pending ? "Memproses…" : TRANSITIONS[a].label}
                    </Button>
                  ))}
                </div>
                {contract.paid && <Badge tone="ok">Pembayaran tercatat (demo)</Badge>}
              </div>
            ) : (
              <p className="mt-4 rounded-md bg-zinc-100 px-3 py-2 text-sm text-muted">
                Tampilan baca saja. Aksi hanya muncul pada tahap berjalan ({current.label}).
              </p>
            )}
          </section>
        </div>
      )}

      {tab === "activity" && (
        <section aria-label="Riwayat lengkap" className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-base font-semibold">Riwayat Lengkap ({activities.length})</h2>
          <div className="mt-3">
            <ActivityList entries={[...activities].reverse()} />
          </div>
        </section>
      )}
    </main>
  );
}
