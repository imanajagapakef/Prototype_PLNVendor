import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getViewer, supabaseServer } from "@/lib/supabase/server";
import { OWNER_LABEL, STAGES, actionLabel, progressFor, roleLabel, stageIndex, type StageId } from "@/lib/workflow";
import { ActivityList } from "@/components/activity";
import { Button } from "@/components/ui/button";
import { signOut } from "./login/actions";

const ROLE_OWNER = {
  pln_pic: "PLN_PIC",
  manager: "Manager",
  warehouse: "Warehouse",
  inspector: "Inspector",
  vendor: "Vendor",
} as const;

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Dashboard() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const sb = await supabaseServer();

  const { data: contracts } = await sb
    .from("contracts")
    .select("id,project,value_label,value_num,location,current_stage,paid,vendors(name)")
    .order("id");
  const { data: vendors } = await sb.from("vendors").select("id");
  const { data: acts } = await sb
    .from("activities")
    .select("id,contract_id,actor_role,action,comment,created_at,profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(6);

  const list = contracts ?? [];
  const total = list.reduce((s, c) => s + Number(c.value_num || 0), 0);
  const myOwner = ROLE_OWNER[viewer.role];
  const actionable = list.filter(
    (c) => STAGES[stageIndex(c.current_stage as StageId)]?.owner === myOwner,
  );
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
      <section aria-labelledby="ops-title" className="rounded-lg border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted">RINGKASAN OPERASIONAL</p>
            <h1 id="ops-title" className="mt-1 text-2xl font-semibold tracking-tight">
              {list.length} Kontrak Aktif · {vendors?.length ?? 0} Vendor
            </h1>
            <p className="mt-1 text-sm text-muted">
              Total nilai Rp {(total / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })}M · masuk sebagai {viewer.display_name} ({roleLabel(viewer.role)})
            </p>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">Keluar</Button>
          </form>
        </div>
      </section>

      {actionable.length > 0 && (
        <section aria-labelledby="actions-title" className="rounded-lg border border-line border-l-4 border-l-accent bg-surface p-5">
          <h2 id="actions-title" className="text-base font-semibold">
            {actionable.length} Perlu Tindakan — {OWNER_LABEL[myOwner as keyof typeof OWNER_LABEL]}
          </h2>
          <ul className="mt-3 space-y-3">
            {actionable.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.id} — {STAGES[stageIndex(c.current_stage as StageId)]?.label}</p>
                  <p className="truncate text-xs text-muted">{c.project}</p>
                </div>
                <Link href={`/contracts/${c.id}`}>
                  <Button>Tinjau <ArrowRight aria-hidden /></Button>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="contracts-title" className="rounded-lg border border-line bg-surface p-5">
        <h2 id="contracts-title" className="text-base font-semibold">Kontrak</h2>
        <ul className="mt-3 divide-y divide-line">
          {list.map((c) => {
            const st = c.current_stage as StageId;
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <Link href={`/contracts/${c.id}`} className="hover:underline">{c.id}</Link>
                    {" · "}{(c.vendors as { name?: string } | null)?.name} · {c.value_label}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {STAGES[stageIndex(st)]?.label} — {OWNER_LABEL[STAGES[stageIndex(st)]?.owner ?? "PLN_PIC"]} · {progressFor(st)}%
                    {c.paid ? " · LUNAS" : ""}
                  </p>
                </div>
                <Link href={`/contracts/${c.id}`}>
                  <Button variant="outline">Buka</Button>
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
