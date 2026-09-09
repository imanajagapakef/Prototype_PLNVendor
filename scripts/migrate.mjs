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
await client.query(
  `create table if not exists schema_migrations (name text primary key, applied_at timestamptz default now())`,
);
const done = new Set(
  (await client.query(`select name from schema_migrations`)).rows.map((r) => r.name),
);
for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(f)) {
    console.log("skipped", f);
    continue;
  }
  const sql = readFileSync(join(dir, f), "utf8");
  await client.query(sql);
  await client.query(`insert into schema_migrations (name) values ($1)`, [f]);
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
