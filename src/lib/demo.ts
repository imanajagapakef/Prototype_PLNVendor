import type { ActivityEntry, DemoDoc, StageId } from "./workflow";

// Clearly fictional demo data. No real PLN documents, PII, or signatures.
export const DEMO_CONTRACT = {
  id: "CTR-2026-001",
  project: "Pembangunan & Pemeliharaan Jaringan Distribusi",
  vendor: "PT Maju Bersama",
  location: "Tanjungpinang",
  value: "Rp 850.000.000",
  start: "01 Sep 2026",
  end: "30 Nov 2026",
  stage: "inspection" as StageId,
  waitingSince: "09 Sep 2026 · 14:32",
  waitingReason: "Site inspection required",
};

export const DOCUMENTS: DemoDoc[] = [
  { name: "Contract Agreement.pdf", type: "Contract", state: "APPROVED", submittedBy: "PLN PIC", submittedAt: "01 Sep 2026" },
  { name: "RBA.pdf", type: "Budget Plan", state: "APPROVED", submittedBy: "PT Maju Bersama", submittedAt: "03 Sep 2026" },
  { name: "Technical Plan.pdf", type: "Technical", state: "APPROVED", submittedBy: "PT Maju Bersama", submittedAt: "03 Sep 2026" },
  { name: "Manager Approval.pdf", type: "Approval", state: "APPROVED", submittedBy: "Manager", submittedAt: "05 Sep 2026" },
  { name: "Material Request.pdf", type: "Material", state: "APPROVED", submittedBy: "PT Maju Bersama", submittedAt: "06 Sep 2026" },
  { name: "Material Handover.pdf", type: "Material", state: "APPROVED", submittedBy: "PLN Warehouse", submittedAt: "07 Sep 2026" },
  { name: "Work Order.pdf", type: "Work Order", state: "APPROVED", submittedBy: "PLN PIC", submittedAt: "07 Sep 2026" },
  { name: "Progress Report.pdf", type: "Execution", state: "READY", submittedBy: "PT Maju Bersama", submittedAt: "09 Sep 2026" },
  { name: "Inspection Report.pdf", type: "Inspection", state: "PENDING", submittedBy: "—", submittedAt: "—" },
  { name: "Acceptance Report.pdf", type: "Acceptance", state: "MISSING", submittedBy: "—", submittedAt: "—" },
];

export const ACTIVITY_SEED: ActivityEntry[] = [
  { id: "a1", at: "01 Sep 2026 · 09:00", actor: "PLN PIC", role: "PLN PIC", action: "Contract created" },
  { id: "a2", at: "03 Sep 2026 · 14:21", actor: "PT Maju Bersama", role: "Vendor", action: "Submitted RBA" },
  { id: "a3", at: "03 Sep 2026 · 14:42", actor: "PLN PIC", role: "PLN PIC", action: "Requested revision", comment: "RBA missing cable breakdown" },
  { id: "a4", at: "04 Sep 2026 · 15:08", actor: "PT Maju Bersama", role: "Vendor", action: "Resubmitted RBA" },
  { id: "a5", at: "04 Sep 2026 · 15:26", actor: "PLN PIC", role: "PLN PIC", action: "Approved documents" },
  { id: "a6", at: "05 Sep 2026 · 10:12", actor: "Manager", role: "Manager", action: "Approved package" },
  { id: "a7", at: "06 Sep 2026 · 11:03", actor: "PT Maju Bersama", role: "Vendor", action: "Requested material", comment: "Cable 500 m, Pole 20, Connector 40" },
  { id: "a8", at: "07 Sep 2026 · 09:44", actor: "PLN Warehouse", role: "Warehouse", action: "Confirmed handover" },
  { id: "a9", at: "07 Sep 2026 · 13:20", actor: "PLN PIC", role: "PLN PIC", action: "Issued work order WO-2026-001" },
  { id: "a10", at: "08 Sep 2026 · 16:05", actor: "PT Maju Bersama", role: "Vendor", action: "Updated progress to 80%" },
  { id: "a11", at: "09 Sep 2026 · 14:32", actor: "PT Maju Bersama", role: "Vendor", action: "Marked work completed, inspection requested" },
];

export const ACTION_REQUIRED = [
  { title: "Manager Approval", desc: "Document package awaiting approval", stage: "manager-approval" },
  { title: "Warehouse", desc: "Material handover confirmation required", stage: "material-handover" },
  { title: "Field Inspector", desc: "Inspection visit required", stage: "inspection" },
] as const;
