import { notFound, redirect } from "next/navigation";
import { getViewer, supabaseServer } from "@/lib/supabase/server";
import { actionLabel, roleLabel, type DocState, type StageId } from "@/lib/workflow";
import { WorkspaceClient, type WsActivity, type WsDoc } from "@/components/workspace-client";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Workspace({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { id } = await params;
  const { err } = await searchParams;
  const sb = await supabaseServer();

  // RLS decides visibility: another vendor's contract returns no row.
  const { data: c } = await sb
    .from("contracts")
    .select("id,project,value_label,location,current_stage,paid,vendors(name)")
    .eq("id", id)
    .single();
  if (!c) notFound();

  const [{ data: docs }, { data: acts }] = await Promise.all([
    sb.from("documents").select("id,doc_type,file_name,storage_path,status,created_at,profiles(display_name)").eq("contract_id", id).order("created_at"),
    sb.from("activities").select("id,actor_role,action,comment,created_at,profiles(display_name)").eq("contract_id", id).order("created_at"),
  ]);

  const documents: WsDoc[] = (docs ?? []).map((d: Record<string, unknown>) => ({
    id: String(d.id),
    name: String(d.file_name),
    type: String(d.doc_type),
    state: String(d.status) as DocState,
    submittedBy: String((d.profiles as { display_name?: string } | null)?.display_name ?? "—"),
    submittedAt: d.created_at ? fmt(String(d.created_at)) : "—",
  }));
  const activities: WsActivity[] = (acts ?? []).map((a: Record<string, unknown>) => ({
    id: String(a.id),
    at: fmt(String(a.created_at)),
    actor: String((a.profiles as { display_name?: string } | null)?.display_name ?? roleLabel(String(a.actor_role))),
    role: roleLabel(String(a.actor_role)),
    action: actionLabel(String(a.action)) + (a.comment ? ` — ${String(a.comment)}` : ""),
  }));

  return (
    <WorkspaceClient
      contract={{
        id: c.id,
        project: c.project,
        vendor: (c.vendors as { name?: string } | null)?.name ?? "",
        location: c.location,
        value: c.value_label,
        stage: c.current_stage as StageId,
        paid: c.paid,
      }}
      documents={documents}
      activities={activities}
      err={err}
    />
  );
}
