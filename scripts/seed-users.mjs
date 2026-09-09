// scripts/seed-users.mjs — creates 7 demo users (confirmed) + profiles +
// contract members + private Storage bucket with dummy PDFs.
// Prints the one-time demo passwords ONCE to console. Never commit output.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const USERS = [
  { email: "direksi@demo.pln", role: "pln_pic", name: "PLN Direksi/PIC" },
  { email: "manager@demo.pln", role: "manager", name: "PLN Manager" },
  { email: "warehouse@demo.pln", role: "warehouse", name: "PLN Warehouse" },
  { email: "inspector@demo.pln", role: "inspector", name: "PLN Inspector" },
  { email: "vendor.maju@demo.com", role: "vendor", name: "PT Maju Bersama", vendor: "PT Maju Bersama" },
  { email: "vendor.karya@demo.com", role: "vendor", name: "PT Karya Infrastruktur", vendor: "PT Karya Infrastruktur" },
  { email: "vendor.bintang@demo.com", role: "vendor", name: "CV Bintang Teknik", vendor: "CV Bintang Teknik" },
];

const { data: vendors } = await admin.from("vendors").select("id,name");
const byName = Object.fromEntries(vendors.map((v) => [v.name, v.id]));

console.log("DEMO CREDENTIALS (one-time, do not commit):");
for (const u of USERS) {
  const password = "Demo-" + randomBytes(4).toString("hex") + "!";
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password,
    email_confirm: true,
    user_metadata: { display_name: u.name, role: u.role },
  });
  if (error && !error.message.includes("already")) throw error;
  const id =
    data?.user?.id ??
    (await admin.auth.admin.listUsers()).data.users.find((x) => x.email === u.email)?.id;
  await admin.from("profiles").upsert({
    id,
    role: u.role,
    vendor_id: u.vendor ? byName[u.vendor] : null,
    display_name: u.name,
  });
  console.log(`  ${u.email}  ${password}  [${u.role}]`);
}

// Members: vendors on own contracts, PLN staff on all.
const { data: contracts } = await admin.from("contracts").select("id,vendor_id");
const { data: profiles } = await admin.from("profiles").select("id,role,vendor_id");
const rows = [];
for (const p of profiles) {
  for (const c of contracts) {
    if (p.role !== "vendor" || p.vendor_id === c.vendor_id) {
      rows.push({ contract_id: c.id, profile_id: p.id });
    }
  }
}
await admin.from("contract_members").upsert(rows, { onConflict: "contract_id,profile_id" });
console.log("members upserted:", rows.length);

// Private bucket + dummy PDFs (placeholder bytes, not real documents).
await admin.storage.createBucket("contract-docs", { public: false });
const pdf = (t) =>
  Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 20 100 Td (${t}) Tj ET\nendstream\nendobj\ntrailer<</Root 1 0 R>>`,
  );
const files = [
  ["CTR-2026-001", ["contract.pdf", "rba.pdf", "technical-plan.pdf", "manager-approval.pdf", "material-request.pdf", "material-handover.pdf", "work-order.pdf", "progress-report.pdf"]],
  ["CTR-2026-002", ["contract.pdf", "rba.pdf"]],
  ["CTR-2026-003", ["contract.pdf", "material-request.pdf"]],
  ["CTR-2026-004", ["contract.pdf", "progress-report.pdf"]],
];
for (const [c, names] of files) {
  for (const n of names) {
    await admin.storage.from("contract-docs").upload(`${c}/${n}`, pdf(`DEMO ${c} ${n}`), {
      contentType: "application/pdf",
      upsert: true,
    });
  }
}
console.log("storage seeded: contract-docs (private)");
