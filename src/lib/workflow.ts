// Single source of truth for the 12-stage demo workflow.
// ponytail: hardcoded transition map; swap for a backend state machine when a real API exists.

export type StageOwner =
  | "PLN_PIC"
  | "Vendor"
  | "Manager"
  | "Warehouse"
  | "Inspector";

export const STAGES = [
  { id: "contract-issued", label: "Contract Issued", owner: "PLN_PIC" },
  { id: "doc-prep", label: "Document Preparation", owner: "Vendor" },
  { id: "pln-review", label: "PLN Review", owner: "PLN_PIC" },
  { id: "manager-approval", label: "Manager Approval", owner: "Manager" },
  { id: "material-request", label: "Material Request", owner: "Vendor" },
  { id: "material-handover", label: "Material Handover", owner: "Warehouse" },
  { id: "work-order", label: "Work Order", owner: "PLN_PIC" },
  { id: "execution", label: "Work Execution", owner: "Vendor" },
  { id: "inspection", label: "Field Inspection", owner: "Inspector" },
  { id: "acceptance", label: "Work Acceptance", owner: "Manager" },
  { id: "final-docs", label: "Final Documentation", owner: "Vendor" },
  { id: "payment", label: "Payment", owner: "PLN_PIC" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export const OWNER_LABEL: Record<StageOwner, string> = {
  PLN_PIC: "PLN PIC",
  Vendor: "Vendor",
  Manager: "Manager",
  Warehouse: "PLN Warehouse",
  Inspector: "PLN Field Inspector",
};

export type DocState =
  | "READY"
  | "PENDING"
  | "APPROVED"
  | "REVISION_REQUIRED"
  | "MISSING";

export interface DemoDoc {
  name: string;
  type: string;
  state: DocState;
  submittedBy: string;
  submittedAt: string;
}

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
  "start-prep": { label: "Start Preparation", from: ["contract-issued"], to: "doc-prep" },
  "submit-docs": { label: "Submit for Review", from: ["doc-prep"], to: "pln-review" },
  "approve-review": { label: "Approve", from: ["pln-review"], to: "manager-approval" },
  "request-revision": {
    label: "Request Revision",
    from: ["pln-review", "manager-approval"],
    to: "doc-prep",
  },
  "manager-approve": { label: "Approve", from: ["manager-approval"], to: "material-request" },
  "request-material": { label: "Submit Request", from: ["material-request"], to: "material-handover" },
  "confirm-handover": { label: "Confirm Handover", from: ["material-handover"], to: "work-order" },
  "issue-wo": { label: "Issue Work Order", from: ["work-order"], to: "execution" },
  "mark-completed": { label: "Mark as Completed", from: ["execution"], to: "inspection" },
  "pass-inspection": { label: "Pass Inspection", from: ["inspection"], to: "acceptance" },
  "request-correction": { label: "Request Correction", from: ["inspection"], to: "execution" },
  "accept-work": { label: "Accept Work", from: ["acceptance"], to: "final-docs" },
  "submit-final": { label: "Submit Final Package", from: ["final-docs"], to: "payment" },
  "mark-paid": { label: "Mark as Paid — Demo", from: ["payment"], to: "payment" },
};

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
