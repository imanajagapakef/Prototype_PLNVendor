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

  const { data: contracts } = await sb
    .from("contracts")
    .select("id,project,value_label,value_num,location,current_stage,paid,vendors(name)")
    .order("id");
  const { data: acts } = await sb
    .from("activities")
    .select("id,contract_id,actor_role,action,comment,created_at,profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(6);

  const list = contracts ?? [];
  const total = list.reduce((s, c) => s + Number(c.value_num || 0), 0);
  const today = fmtDate(new Date().toISOString());
  const myOwner = ROLE_OWNER[viewer.role];
  const actionable = list.filter(
    (c) => STAGES[stageIndex(c.current_stage as StageId)]?.owner === myOwner,
  );
  const attention = list.filter((c) => {
    const st = c.current_stage as StageId;
    return ["pln-review", "manager-approval", "inspection"].includes(st);
  }).length;
  const recent = (acts ?? []).map((a: Record<string, unknown>) => ({
    id: String(a.id),
    at: fmt(String(a.created_at)),
    actor: String((a.profiles as { display_name?: string } | null)?.display_name ?? roleLabel(String(a.actor_role))),
    role: roleLabel(String(a.actor_role)),
    action:
      actionLabel(String(a.action)) +
      (a.comment ? ` — ${String(a.comment)}` : "") +
      ` (${String(a.contract_id)})`,
  }));

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
            [`${list.length}`, "Kontrak aktif"],
            [`Rp ${(total / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })}M`, "total nilai"],
            [`${attention}`, "butuh putusan"],
            [`${actionable.length}`, "aksi saya"],
          ].map(([v, l]) => (
            <div key={l} className="bg-surface px-4 py-3">
              <dd className="tnum text-lg font-semibold tracking-tight">{v}</dd>
              <dt className="mt-0.5 text-xs text-muted">{l}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Actions first for the responsible role */}
      {actionable.length > 0 && (
        <section aria-labelledby="actions-title" className="rounded-lg border border-line border-l-4 border-l-warn bg-surface p-5">
          <h2 id="actions-title" className="text-base font-semibold">
            Perlu Tindakan — {OWNER_LABEL[myOwner as keyof typeof OWNER_LABEL]}
          </h2>
          <ul className="mt-3 space-y-2">
            {actionable.map((c) => {
              const st = STAGES[stageIndex(c.current_stage as StageId)];
              const next = availableActions(c.current_stage as StageId)[0];
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
        </section>
      )}

      {/* Contract table = primary content */}
      <section aria-labelledby="contracts-title" className="overflow-hidden rounded-lg border border-line bg-surface">
        <h2 id="contracts-title" className="px-5 pt-4 text-base font-semibold">Kontrak</h2>
        <ul className="mt-2 divide-y divide-line">
          {list.map((c) => {
            const st = c.current_stage as StageId;
            const meta = STAGES[stageIndex(st)];
            return (
              <li key={c.id}>
                <Link
                  href={`/contracts/${c.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-zinc-50 focus-visible:outline-2 sm:grid-cols-[auto_1fr_auto_auto_auto]"
                >
                  <p className="mono text-sm font-semibold">{c.id}</p>
                  <p className="col-span-2 truncate text-sm text-muted sm:col-span-1">
                    {(c.vendors as { name?: string } | null)?.name} · {c.project}
                  </p>
                  <p className="tnum text-sm tabular-nums">{c.value_label}</p>
                  <span>
                    <Badge tone={c.paid ? "ok" : meta?.owner === myOwner ? "warn" : "info"}>
                      {c.paid ? "LUNAS" : meta?.label}
                    </Badge>
                  </span>
                  <span className="hidden items-center gap-1 text-sm text-muted sm:inline-flex">
                    {progressFor(st)}% <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="activity-title" className="rounded-lg border border-line bg-surface p-5">
        <h2 id="activity-title" className="text-base font-semibold">Aktivitas Terakhir</h2>
        <div className="mt-3">
          <ActivityList entries={recent} />
        </div>
      </section>
    </main>
  );
}
