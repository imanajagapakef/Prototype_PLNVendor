-- 01_schema.sql — 12 tables.
-- No workflow_stages: truth = contracts.current_stage, history = activities.

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  organization_id uuid references organizations(id)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null
    check (role in ('pln_pic', 'manager', 'warehouse', 'inspector', 'vendor')),
  vendor_id uuid references vendors(id),
  display_name text not null,
  constraint vendor_role_match check (
    (role = 'vendor' and vendor_id is not null)
    or (role <> 'vendor' and vendor_id is null)
  )
);

create table if not exists contracts (
  id text primary key,
  project text not null,
  vendor_id uuid not null references vendors(id),
  pic_name text not null default 'PLN PIC',
  value_label text not null,
  value_num numeric not null default 0,
  location text not null default '',
  start_date date,
  end_date date,
  current_stage text not null default 'contract-issued',
  paid boolean not null default false
);

create table if not exists contract_members (
  contract_id text references contracts(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (contract_id, profile_id)
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null references contracts(id) on delete cascade,
  doc_type text not null,
  file_name text not null,
  storage_path text,
  uploaded_by uuid references profiles(id),
  status text not null default 'PENDING'
    check (status in ('READY', 'PENDING', 'APPROVED', 'REVISION_REQUIRED', 'MISSING')),
  created_at timestamptz not null default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null references contracts(id) on delete cascade,
  stage text not null,
  actor uuid references profiles(id),
  actor_role text not null,
  decision text not null
    check (decision in ('APPROVED', 'REVISION_REQUESTED', 'ACCEPTED', 'PAID')),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists material_requests (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null references contracts(id) on delete cascade,
  items jsonb not null default '[]',
  requested_by uuid references profiles(id),
  status text not null default 'SUBMITTED',
  created_at timestamptz not null default now()
);

create table if not exists material_handovers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references material_requests(id),
  contract_id text not null references contracts(id) on delete cascade,
  handed_by uuid references profiles(id),
  received_by text,
  condition text,
  created_at timestamptz not null default now()
);

create table if not exists work_orders (
  id text primary key,
  contract_id text not null references contracts(id) on delete cascade,
  scope text,
  issued_by uuid references profiles(id),
  status text not null default 'ISSUED',
  created_at timestamptz not null default now()
);

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null references contracts(id) on delete cascade,
  result text not null check (result in ('PASS', 'CORRECTION_REQUESTED')),
  notes text,
  inspector uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null references contracts(id) on delete cascade,
  actor uuid references profiles(id),
  actor_role text not null,
  action text not null,
  prev_stage text,
  new_stage text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_contracts_vendor on contracts(vendor_id);
create index if not exists idx_activities_contract on activities(contract_id, created_at);
create index if not exists idx_documents_contract on documents(contract_id);
create index if not exists idx_approvals_contract on approvals(contract_id);
