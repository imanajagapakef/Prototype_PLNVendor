"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { ActionType } from "@/lib/workflow";

function friendly(m: string): string {
  if (/comment required/i.test(m))
    return "A comment is required for revision / correction.";
  if (/forbidden|not your contract|not authenticated|no profile/i.test(m))
    return "You are not allowed to do that on this contract.";
  if (/unknown/i.test(m)) return "Unknown contract or action.";
  return "Transition rejected.";
}

// The ONLY writer of workflow state. Validation lives in SQL apply_transition.
export async function transitionAction(
  contractId: string,
  action: ActionType,
  comment?: string,
) {
  const sb = await supabaseServer();
  const clean = comment?.trim() ? comment.trim() : null;
  const { error } = await sb.rpc("apply_transition", {
    p_contract: contractId,
    p_action: action,
    p_comment: clean,
  });
  revalidatePath("/");
  revalidatePath(`/contracts/${contractId}`);
  if (error) redirect(`/contracts/${contractId}?err=${encodeURIComponent(friendly(error.message))}`);
  redirect(`/contracts/${contractId}`);
}

const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadAction(contractId: string, formData: FormData) {
  const base = `/contracts/${contractId}`;
  const fail = (m: string): never =>
    redirect(`${base}?err=${encodeURIComponent(m)}`);
  const entry = formData.get("file");
  const docType = String(formData.get("docType") || "Supporting").slice(0, 40);
  if (!(entry instanceof File) || entry.size === 0) {
    redirect(`${base}?err=${encodeURIComponent("No file selected.")}`);
  }
  const file = entry;
  if (file.size > MAX_SIZE) fail("File too large (max 5MB).");
  const lower = file.name.toLowerCase();
  if (!ALLOWED_EXT.some((e) => lower.endsWith(e)))
    fail("Only PDF, JPG, PNG, WebP allowed.");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const path = `${contractId}/${Date.now()}-${safe}`;

  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) fail("Not signed in.");
  const { error: upErr } = await sb.storage
    .from("contract-docs")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (upErr) fail("Upload rejected.");
  const { error: dbErr } = await sb.from("documents").insert({
    contract_id: contractId,
    doc_type: docType,
    file_name: file.name.slice(0, 120),
    storage_path: path,
    uploaded_by: user!.id,
    status: "READY",
  });
  if (dbErr) fail("Metadata rejected.");
  revalidatePath(`/contracts/${contractId}`);
  redirect(`/contracts/${contractId}`);
}
