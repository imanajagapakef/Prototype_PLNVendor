import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getViewer, supabaseServer } from "@/lib/supabase/server";
import { OWNER_LABEL, STAGES, TRANSITIONS, actionLabel, availableActions, progressFor, roleLabel, stageIndex, type StageId } from "@/lib/workflow";
import { ActivityList } from "@/components/activity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "./login/actions";

const ROLE_OWNER = {
  pln_pic: "PLN_PIC",
  manager: "Manager",
  warehouse: "Warehouse",
  inspector: "Inspector",
  vendor: "Vendor",
} as const;

// Stages where a contract is waiting on a review / decision (team-wide).
const DECISION_STAGES: StageId[] = [
  "pln-review",
  "manager-approval",
  "inspection",
  "acceptance",
];

const ROLE_FOCUS: Record<string, string> = {
  pln_pic: "Gambaran operasi dan tinjauan persetujuan",
  manager: "Menunggu persetujuan Anda",
  warehouse: "Material menunggu bergerak",
  inspector: "Pekerjaan menunggu inspeksi",
  vendor: "Aksi Anda selanjutnya",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

export default async function Dashboard() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const sb = await supabaseServer();

  const [{ data: contracts, error: contractsError }, { data: acts, error: actsError }] =
    await Promise.all([
      sb
        .from("contracts")
        .select("id,project,value_label,value_num,location,current_stage,paid,vendors(name)")
        .order("id"),
      sb
        .from("activities")
        .select("id,contract_id,actor_role,action,comment,created_at,profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const today = fmtDate(new Date().toISOString());

  if (contractsError) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mono text-xs tracking-wide text-muted">{today}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Ringkasan Operasional
            </h1>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">Keluar</Button>
          </form>
        </div>
        <p role="alert" className="rounded-md border border-bad/30 bg-bad-bg px-4 py-3 text-sm text-bad">
          Gagal memuat data kontrak. Coba muat ulang halaman.
        </p>
      </main>
    );
  }

  const list = contracts ?? [];
  const total = list.reduce((s, c) => s + Number(c.value_num || 0), 0);
  const myOwner = ROLE_OWNER[viewer.role];
  const actionable = list.filter(
    (c) => STAGES[stageIndex(c.current_stage as StageId)]?.owner === myOwner,
  );
  const waitingOthers = list.filter(
    (c) => STAGES[stageIndex(c.current_stage as StageId)]?.owner !== myOwner,
  );
  const needsDecision = list.filter((c) =>
    DECISION_STAGES.includes(c.current_stage as StageId),
  );
  const dist = STAGES.map((s) => ({
    ...s,
    n: list.filter((c) => c.current_stage === s.id).length,
  })).filter((d) => d.n > 0);
  const recent = (acts ?? []).map((a: Record<string, unknown>) => {
    const label = actionLabel(String(a.action));
    const comment =
      a.comment && String(a.comment) !== label ? ` — ${String(a.comment)}` : "";
    return {
      id: String(a.id),
      at: fmt(String(a.created_at)),
      actor: String((a.profiles as { display_name?: string } | null)?.display_name ?? roleLabel(String(a.actor_role))),
      role: roleLabel(String(a.actor_role)),
      action: label + comment + ` (${String(a.contract_id)})`,
    };
  });

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Identity + KPI strip */}
      <section aria-labelledby="ops-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mono text-xs tracking-wide text-muted">{today}</p>
            <h1 id="ops-title" className="mt-1 text-2xl font-semibold tracking-tight">
              Ringkasan Operasional
            </h1>
            <p className="mt-1 text-sm text-muted">
              {ROLE_FOCUS[viewer.role]} · masuk sebagai {viewer.display_name} ({roleLabel(viewer.role)})
            </p>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">Keluar</Button>
          </form>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
          {[
            [`${list.length}`, "Kontrak aktif", "kontrak terlihat"],
            [`Rp ${(total / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })}M`, "Total nilai", "dari kontrak terlihat"],
            [`${needsDecision.length}`, "Butuh keputusan", "kontrak pada tahap keputusan"],
            [`${actionable.length}`, "Aksi saya", "tindakan yang perlu saya lakukan"],
          ].map(([v, l, s]) => (
            <div key={l} className="bg-surface px-4 py-3">
              <dt className="text-xs font-medium">{l}</dt>
              <dd className="tnum text-lg font-semibold tracking-tight">{v}</dd>
              <dd className="text-xs text-muted">{s}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Waiting on me */}
      <section aria-labelledby="actions-title" className="rounded-lg border border-line border-l-4 border-l-warn bg-surface p-5">
        <h2 id="actions-title" className="text-base font-semibold">
          Menunggu Saya — {OWNER_LABEL[myOwner as keyof typeof OWNER_LABEL]}
        </h2>
        {actionable.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {actionable.map((c) => {
              const st = STAGES[stageIndex(c.current_stage as StageId)];
              const candidates = availableActions(c.current_stage as StageId);
              const next =
                candidates.find((a) => a !== "request-revision" && a !== "request-correction") ??
                candidates[0];
              const nextLabel = next ? STAGES[stageIndex(TRANSITIONS[next].to)]?.label : null;
              return (
                <li key={c.id}>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5 transition-colors hover:border-accent hover:bg-info-bg/40 focus-visible:outline-2"
                  >
                    <div className="min-w-0">
                      <p className="mono truncate text-sm font-semibold">{c.id}</p>
                      <p className="truncate text-xs text-muted">
                        {next ? actionLabel(next) : st?.label}
                        {nextLabel ? ` · menuju ${nextLabel}` : ` · ${c.project}`}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent">
                      Tinjau <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Tidak ada tindakan yang menunggu Anda saat ini.
          </p>
        )}
      </section>

      {/* Contract table = primary content */}
      <section aria-labelledby="contracts-title" className="overflow-hidden rounded-lg border border-line bg-surface">
        <h2 id="contracts-title" className="px-5 pt-4 text-base font-semibold">Kontrak</h2>
        {list.length > 0 ? (
          <ul className="mt-2 divide-y divide-line">
            {list.map((c) => {
              const st = c.current_stage as StageId;
              const meta = STAGES[stageIndex(st)];
              const mine = meta?.owner === myOwner && !c.paid;
              return (
                <li key={c.id}>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-hover focus-visible:outline-2 sm:grid-cols-[auto_1fr_auto_auto_auto]"
                  >
                    <p className="mono text-sm font-semibold">{c.id}</p>
                    <p className="col-span-2 truncate text-sm text-muted sm:col-span-1">
                      {(c.vendors as { name?: string } | null)?.name} · {c.project}
                    </p>
                    <p className="tnum text-sm tabular-nums">{c.value_label}</p>
                    <span>
                      <Badge tone={c.paid ? "ok" : mine ? "warn" : "info"}>
                        {c.paid ? "LUNAS" : meta?.label}
                      </Badge>
                      <span className="mt-0.5 block text-xs text-muted">
                        {mine ? "Perlu tindakan saya · " : ""}{meta ? OWNER_LABEL[meta.owner] : ""}
                      </span>
                    </span>
                    <span className="hidden items-center gap-1 text-sm text-muted sm:inline-flex">
                      {progressFor(st)}% <ArrowUpRight className="size-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 pb-5 text-sm text-muted">
            Tidak ada kontrak yang terlihat untuk Anda.
          </p>
        )}
      </section>

      {/* Waiting on others */}
      {waitingOthers.length > 0 && (
        <section aria-labelledby="others-title" className="rounded-lg border border-line bg-surface p-5">
          <h2 id="others-title" className="text-base font-semibold">Menunggu Pihak Lain</h2>
          <ul className="mt-3 divide-y divide-line">
            {waitingOthers.map((c) => {
              const meta = STAGES[stageIndex(c.current_stage as StageId)];
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="mono truncate text-sm font-semibold">{c.id}</p>
                    <p className="truncate text-xs text-muted">
                      {meta?.label} · {meta ? OWNER_LABEL[meta.owner] : ""}
                    </p>
                  </div>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="shrink-0 text-sm font-medium text-accent hover:underline focus-visible:outline-2"
                  >
                    Lihat
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Workflow distribution */}
      {dist.length > 0 && (
        <section aria-labelledby="dist-title" className="rounded-lg border border-line bg-surface p-5">
          <h2 id="dist-title" className="text-base font-semibold">Distribusi Tahap</h2>
          <div aria-hidden="true" className="mt-3 flex h-2.5 gap-px overflow-hidden rounded-full bg-subtle">
            {dist.map((d) => (
              <span
                key={d.id}
                style={{ width: `${(d.n / list.length) * 100}%` }}
                className={DECISION_STAGES.includes(d.id) ? "bg-warn" : "bg-accent/70"}
              />
            ))}
          </div>
          <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {dist.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{d.label}</span>
                <span className="tnum text-muted">{d.n}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="activity-title" className="rounded-lg border border-line bg-surface p-5">
        <h2 id="activity-title" className="text-base font-semibold">Aktivitas Terakhir</h2>
        <div className="mt-3">
          {actsError ? (
            <p role="alert" className="text-sm text-bad">
              Gagal memuat aktivitas terakhir.
            </p>
          ) : recent.length > 0 ? (
            <ActivityList entries={recent} />
          ) : (
            <p className="text-sm text-muted">Belum ada aktivitas tercatat.</p>
          )}
        </div>
      </section>
    </main>
  );
}
