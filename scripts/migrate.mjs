// scripts/migrate.mjs — applies supabase/migrations/*.sql via direct Postgres.
// Reads .env.local manually. Prints counts only, never secrets.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

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

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const dir = join(root, "supabase", "migrations");
for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  const sql = readFileSync(join(dir, f), "utf8");
  await client.query(sql);
  console.log("applied", f);
}

const tables = await client.query(
  `select count(*)::int as n from information_schema.tables
   where table_schema = 'public' and table_name in
   ('profiles','organizations','vendors','contracts','contract_members',
    'documents','approvals','material_requests','material_handovers',
    'work_orders','inspections','activities')`,
);
console.log("tracked tables present:", tables.rows[0].n, "/ 12");
await client.end();
