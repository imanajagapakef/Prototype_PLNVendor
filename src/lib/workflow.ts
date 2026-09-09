// Single source of truth for the 12-stage demo workflow.
// ponytail: hardcoded transition map; swap for a backend state machine when a real API exists.

export type StageOwner =
  | "PLN_PIC"
  | "Vendor"
  | "Manager"
  | "Warehouse"
  | "Inspector";

export const STAGES = [
  { id: "contract-issued", label: "Kontrak Diterbitkan", owner: "PLN_PIC" },
  { id: "doc-prep", label: "Penyiapan Dokumen", owner: "Vendor" },
  { id: "pln-review", label: "Review PLN", owner: "PLN_PIC" },
  { id: "manager-approval", label: "Persetujuan Manajer", owner: "Manager" },
  { id: "material-request", label: "Permintaan Material", owner: "Vendor" },
  { id: "material-handover", label: "Serah Terima Material", owner: "Warehouse" },
  { id: "work-order", label: "Surat Perintah Kerja", owner: "PLN_PIC" },
  { id: "execution", label: "Pelaksanaan Pekerjaan", owner: "Vendor" },
  { id: "inspection", label: "Inspeksi Lapangan", owner: "Inspector" },
  { id: "acceptance", label: "Serah Terima Pekerjaan", owner: "Manager" },
  { id: "final-docs", label: "Dokumentasi Final", owner: "Vendor" },
  { id: "payment", label: "Pembayaran", owner: "PLN_PIC" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export const OWNER_LABEL: Record<StageOwner, string> = {
  PLN_PIC: "PIC PLN",
  Vendor: "Vendor",
  Manager: "Manajer",
  Warehouse: "Gudang PLN",
  Inspector: "Inspektur Lapangan",
};

export const ROLE_LABEL: Record<string, string> = {
  pln_pic: "PIC PLN",
  manager: "Manajer",
  warehouse: "Gudang",
  inspector: "Inspektur",
  vendor: "Vendor",
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

export type DocState =
  | "READY"
  | "PENDING"
  | "APPROVED"
  | "REVISION_REQUIRED"
  | "MISSING";

export const DOC_STATE_LABEL: Record<DocState, string> = {
  READY: "SIAP",
  PENDING: "MENUNGGU",
  APPROVED: "DISETUJUI",
  REVISION_REQUIRED: "PERLU REVISI",
  MISSING: "BELUM ADA",
};

export interface ActivityEntry {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  comment?: string;
}

export type ActionType =
  | "start-prep"
  | "submit-docs"
  | "approve-review"
  | "request-revision"
  | "manager-approve"
  | "request-material"
  | "confirm-handover"
  | "issue-wo"
  | "mark-completed"
  | "pass-inspection"
  | "request-correction"
  | "accept-work"
  | "submit-final"
  | "mark-paid";

interface Transition {
  label: string;
  from: readonly StageId[];
  to: StageId;
}

// Allowlist: state only moves through these. No arbitrary stage jumps.
export const TRANSITIONS: Record<ActionType, Transition> = {
  "start-prep": { label: "Mulai Persiapan", from: ["contract-issued"], to: "doc-prep" },
  "submit-docs": { label: "Kirim untuk Review", from: ["doc-prep"], to: "pln-review" },
  "approve-review": { label: "Setujui", from: ["pln-review"], to: "manager-approval" },
  "request-revision": {
    label: "Minta Revisi",
    from: ["pln-review", "manager-approval"],
    to: "doc-prep",
  },
  "manager-approve": { label: "Setujui", from: ["manager-approval"], to: "material-request" },
  "request-material": { label: "Kirim Permintaan", from: ["material-request"], to: "material-handover" },
  "confirm-handover": { label: "Konfirmasi Serah Terima", from: ["material-handover"], to: "work-order" },
  "issue-wo": { label: "Terbitkan SPK", from: ["work-order"], to: "execution" },
  "mark-completed": { label: "Tandai Selesai", from: ["execution"], to: "inspection" },
  "pass-inspection": { label: "Luluskan Inspeksi", from: ["inspection"], to: "acceptance" },
  "request-correction": { label: "Minta Perbaikan", from: ["inspection"], to: "execution" },
  "accept-work": { label: "Terima Pekerjaan", from: ["acceptance"], to: "final-docs" },
  "submit-final": { label: "Kirim Dokumen Final", from: ["final-docs"], to: "payment" },
  "mark-paid": { label: "Tandai Lunas — Demo", from: ["payment"], to: "payment" },
};

export function actionLabel(action: string): string {
  return (TRANSITIONS as Record<string, Transition>)[action]?.label ?? action;
}

export function stageIndex(id: StageId): number {
  return STAGES.findIndex((s) => s.id === id);
}

export function progressFor(id: StageId): number {
  return Math.round((stageIndex(id) / (STAGES.length - 1)) * 100);
}

export function availableActions(stage: StageId): ActionType[] {
  return (Object.keys(TRANSITIONS) as ActionType[]).filter((a) =>
    TRANSITIONS[a].from.includes(stage),
  );
}
