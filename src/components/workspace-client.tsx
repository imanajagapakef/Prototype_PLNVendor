"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DOC_STATE_LABEL, OWNER_LABEL, STAGES, TRANSITIONS, availableActions, canPerform, progressFor, roleLabel, stageIndex, type ActionType, type DocState, type StageId, type ViewerRole } from "@/lib/workflow";
import { ActivityList } from "@/components/activity";
import { Timeline } from "@/components/timeline";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { transitionAction, uploadAction } from "@/app/contracts/[id]/actions";
import { signOut } from "@/app/login/actions";

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
  detail?: string;
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

const DOC_TYPES = ["Kontrak", "RBA", "Teknis", "Persetujuan", "Material", "SPK", "Pelaksanaan", "Inspeksi", "Serah Terima", "Pendukung"];

function UploadSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Mengunggah…" : "Unggah"}
    </Button>
  );
}

export function WorkspaceClient({
  contract,
  documents,
  activities,
  reached,
  err,
  dataError,
  viewerRole,
}: {
  contract: WsContract;
  documents: WsDoc[];
  activities: WsActivity[];
  reached?: Partial<Record<StageId, string>>;
  err?: string;
  dataError?: string | null;
  viewerRole: ViewerRole;
}) {
  const [selected, setSelected] = useState<string>(contract.stage);
  const [comment, setComment] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const idx = stageIndex(contract.stage);
  const current = STAGES[idx];
  const progress = progressFor(contract.stage);
  const sel = STAGES.find((s) => s.id === selected) ?? current;
  const selIdx = stageIndex(sel.id);
  const selState = selIdx < idx ? "done" : selIdx === idx ? "current" : "todo";
  const myActions = availableActions(contract.stage).filter((a) =>
    canPerform(a, contract.stage, viewerRole),
  );
  const forward =
    myActions.find((a) => a !== "request-revision" && a !== "request-correction") ??
    myActions[0];
  const forwardTarget = forward ? STAGES[stageIndex(TRANSITIONS[forward].to)] : undefined;
  const needsComment = (a: ActionType) =>
    a === "request-revision" || a === "request-correction";
  const readyDocs = documents.filter(
    (d) => d.state === "READY" || d.state === "APPROVED",
  ).length;
  const history = activities.filter((a) => a.detail);

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
          <Button variant="outline" type="submit">Keluar</Button>
        </form>
      </div>
      {err && (
        <p role="alert" className="rounded-md border border-bad bg-bad-bg px-3 py-2 text-sm text-bad">
          {err}
        </p>
      )}
      {dataError && (
        <p role="alert" className="rounded-md border border-bad/30 bg-bad-bg px-3 py-2 text-sm text-bad">
          {dataError}
        </p>
      )}

      {/* 1. Contract identity */}
      <section aria-labelledby="ws-title" className="rounded-lg border border-line bg-surface p-5">
        <p className="mono text-sm font-semibold tracking-wide text-muted">{contract.id}</p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="ws-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {contract.project}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {contract.vendor} · {contract.location}
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
      </section>

      {/* 2. Current stage + responsibility + required action */}
      <section aria-labelledby="action-title" className="rounded-lg border border-line border-l-4 border-l-accent bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Tahap berjalan</p>
        <h2 id="action-title" className="mt-1 text-xl font-semibold tracking-tight">
          {current.label}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Penanggung jawab: {OWNER_LABEL[current.owner]}
          {forward && forwardTarget
            ? ` · Yang perlu terjadi: ${TRANSITIONS[forward].label} — menuju ${forwardTarget.label}.`
            : " · Menunggu penanggung jawab tahap ini."}
        </p>
        {myActions.length > 0 ? (
          <div className="mt-4 space-y-3">
            {myActions.some(needsComment) && (
              <div>
                <label htmlFor="action-comment" className="text-xs font-medium text-muted">
                  KOMENTAR (WAJIB UNTUK REVISI / PERBAIKAN)
                </label>
                <input
                  id="action-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="cth. RBA kurang rincian kabel"
                  aria-required={myActions.some(needsComment)}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {myActions.map((a) => (
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
            Tampilan baca saja untuk peran Anda ({roleLabel(viewerRole)}). Penanggung jawab tahap ini: {OWNER_LABEL[current.owner]}.
          </p>
        )}
      </section>

      {/* 3. Workflow */}
      <section aria-labelledby="workflow-title" className="rounded-lg border border-line bg-surface p-5">
        <h2 id="workflow-title" className="text-base font-semibold">Alur Workflow</h2>
        <div className="mt-3">
          <Timeline current={contract.stage} dates={reached} />
        </div>
        <div className="mt-4 border-t border-line pt-4">
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
          <h3 className="mt-4 text-lg font-semibold">{sel.label}</h3>
          <p className="text-sm text-muted">
            Ditugaskan ke {OWNER_LABEL[sel.owner]} ·{" "}
            {selState === "done" ? "Selesai" : selState === "current" ? "Berjalan" : "Mendatang"}
          </p>
          {selected !== contract.stage && (
            <p className="mt-2 text-sm text-muted">
              Tampilan baca saja. Aksi hanya muncul pada tahap berjalan ({current.label}).
            </p>
          )}
        </div>
      </section>

      {/* 4. Documents */}
      <section aria-label="Dokumen" className="space-y-6">
        <div className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-base font-semibold">
            Dokumen — {readyDocs} / {documents.length} siap
          </h2>
          {documents.length > 0 ? (
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
          ) : (
            <p className="mt-3 text-sm text-muted">Belum ada dokumen pada kontrak ini.</p>
          )}
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
                <input
                  id="file"
                  name="file"
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  className="mt-1 block text-sm"
                />
              <p className="mt-1 text-xs text-muted" aria-live="polite">
                {fileName ? `File dipilih: ${fileName}` : "Belum ada file dipilih."}
              </p>
            </div>
            <UploadSubmitButton />
          </div>
        </form>
      </section>

      {/* 5. Workflow history */}
      <section aria-labelledby="history-title" className="rounded-lg border border-line bg-surface p-5">
        <h2 id="history-title" className="text-base font-semibold">Riwayat Tahap</h2>
        {history.length > 0 ? (
          <ol className="mt-3 space-y-4">
            {[...history].reverse().map((a) => (
              <li key={a.id} className="flex gap-3">
                <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-ok/70" />
                <div className="min-w-0">
                  <p className="text-xs tabular-nums text-muted">{a.at}</p>
                  <p className="text-sm font-medium">{a.detail}</p>
                  <p className="text-xs text-muted">
                    {a.actor}{a.role && a.role !== a.actor ? ` · ${a.role}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted">Belum ada transisi tahap tercatat.</p>
        )}
      </section>

      {/* 6. Activity / audit */}
      <section aria-label="Riwayat lengkap" className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-base font-semibold">Aktivitas ({activities.length})</h2>
        <div className="mt-3">
          {activities.length > 0 ? (
            <ActivityList entries={[...activities].reverse()} />
          ) : (
            <p className="text-sm text-muted">Belum ada aktivitas tercatat.</p>
          )}
        </div>
      </section>
    </main>
  );
}
