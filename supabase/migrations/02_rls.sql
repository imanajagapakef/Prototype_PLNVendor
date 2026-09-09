-- 02_rls.sql — server validates transitions; clients never write stage directly.

-- Visibility helper (owner bypasses RLS, no recursion: reads base tables only).
create or replace function public.can_see_contract(p_contract text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('pln_pic', 'manager', 'warehouse', 'inspector')
    )
    or exists (
      select 1 from profiles p
      join contracts c on c.vendor_id = p.vendor_id
      where p.id = auth.uid() and c.id = p_contract
    );
$$;

create or replace function public.my_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

alter table organizations enable row level security;
alter table vendors enable row level security;
alter table profiles enable row level security;
alter table contracts enable row level security;
alter table contract_members enable row level security;
alter table documents enable row level security;
alter table approvals enable row level security;
alter table material_requests enable row level security;
alter table material_handovers enable row level security;
alter table work_orders enable row level security;
alter table inspections enable row level security;
alter table activities enable row level security;

-- Reference data: readable by any authenticated user (demo-safe, no PII).
create policy org_read on organizations for select using (auth.role() = 'authenticated');
create policy vendor_read on vendors for select using (auth.role() = 'authenticated');
create policy profile_read on profiles for select using (auth.role() = 'authenticated');

-- Contracts: read-only for clients. No insert/update/delete policies = denied.
create policy contract_read on contracts for select using (
  public.my_role() in ('pln_pic', 'manager', 'warehouse', 'inspector')
  or exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.vendor_id = contracts.vendor_id
  )
);

create policy member_read on contract_members for select using (
  public.my_role() in ('pln_pic', 'manager')
  or profile_id = auth.uid()
);

-- Documents: read visible contracts; upload own (vendor) or PLN; status by PLN.
create policy doc_read on documents for select
  using (public.can_see_contract(contract_id));
create policy doc_insert on documents for insert with check (
  public.can_see_contract(contract_id) and uploaded_by = auth.uid()
);
create policy doc_update on documents for update using (
  public.my_role() in ('pln_pic', 'manager', 'warehouse', 'inspector')
);

-- Audit tables: read visible; writes only via apply_transition (owner).
create policy approval_read on approvals for select
  using (public.can_see_contract(contract_id));
create policy activity_read on activities for select
  using (public.can_see_contract(contract_id));
create policy inspection_read on inspections for select
  using (public.can_see_contract(contract_id));
create policy wo_read on work_orders for select
  using (public.can_see_contract(contract_id));
create policy handover_read on material_handovers for select
  using (public.can_see_contract(contract_id));
create policy matreq_read on material_requests for select
  using (public.can_see_contract(contract_id));
create policy matreq_update on material_requests for update using (
  public.my_role() in ('pln_pic', 'warehouse')
);

-- Storage: private bucket contract-docs, path = <CONTRACT_ID>/<file>.
create policy storage_read on storage.objects for select using (
  bucket_id = 'contract-docs'
  and public.can_see_contract((storage.foldername(name))[1])
);
create policy storage_insert on storage.objects for insert with check (
  bucket_id = 'contract-docs'
  and public.can_see_contract((storage.foldername(name))[1])
);

-- The single writer of workflow state. Atomic: stage + activity + records.
create or replace function public.apply_transition(
  p_contract text, p_action text, p_comment text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_vendor uuid;
  v_stage text;
  v_cvendor uuid;
  v_to text;
  v_clean text := nullif(trim(coalesce(p_comment, '')), '');
  v_req_id uuid;
  v_wo text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select role, vendor_id into v_role, v_vendor from profiles where id = v_uid;
  if v_role is null then raise exception 'no profile'; end if;
  select current_stage, vendor_id into v_stage, v_cvendor
    from contracts where id = p_contract;
  if v_stage is null then raise exception 'unknown contract'; end if;
  if v_role = 'vendor' and v_cvendor is distinct from v_vendor then
    raise exception 'not your contract';
  end if;

  case p_action
    when 'start-prep' then
      if not (v_stage = 'contract-issued' and v_role = 'vendor') then raise exception 'forbidden'; end if;
      v_to := 'doc-prep';
    when 'submit-docs' then
      if not (v_stage = 'doc-prep' and v_role = 'vendor') then raise exception 'forbidden'; end if;
      v_to := 'pln-review';
    when 'approve-review' then
      if not (v_stage = 'pln-review' and v_role = 'pln_pic') then raise exception 'forbidden'; end if;
      v_to := 'manager-approval';
    when 'request-revision' then
      if not ((v_stage = 'pln-review' and v_role = 'pln_pic')
        or (v_stage = 'manager-approval' and v_role = 'manager')) then raise exception 'forbidden'; end if;
      v_to := 'doc-prep';
    when 'manager-approve' then
      if not (v_stage = 'manager-approval' and v_role = 'manager') then raise exception 'forbidden'; end if;
      v_to := 'material-request';
    when 'request-material' then
      if not (v_stage = 'material-request' and v_role = 'vendor') then raise exception 'forbidden'; end if;
      v_to := 'material-handover';
      insert into material_requests (contract_id, requested_by, items)
        values (p_contract, v_uid, coalesce(v_clean, 'requested')::jsonb)
        returning id into v_req_id;
    when 'confirm-handover' then
      if not (v_stage = 'material-handover' and v_role = 'warehouse') then raise exception 'forbidden'; end if;
      v_to := 'work-order';
      select id into v_req_id from material_requests
        where contract_id = p_contract order by created_at desc limit 1;
      update material_requests set status = 'HANDED_OVER' where id = v_req_id;
      insert into material_handovers (request_id, contract_id, handed_by, received_by)
        values (v_req_id, p_contract, v_uid, 'vendor receiver');
    when 'issue-wo' then
      if not (v_stage = 'work-order' and v_role = 'pln_pic') then raise exception 'forbidden'; end if;
      v_to := 'execution';
      v_wo := 'WO-' || replace(p_contract, 'CTR-', '');
      insert into work_orders (id, contract_id, issued_by)
        values (v_wo, p_contract, v_uid) on conflict (id) do nothing;
    when 'mark-completed' then
      if not (v_stage = 'execution' and v_role = 'vendor') then raise exception 'forbidden'; end if;
      v_to := 'inspection';
    when 'pass-inspection' then
      if not (v_stage = 'inspection' and v_role = 'inspector') then raise exception 'forbidden'; end if;
      v_to := 'acceptance';
      insert into inspections (contract_id, result, notes, inspector)
        values (p_contract, 'PASS', v_clean, v_uid);
    when 'request-correction' then
      if not (v_stage = 'inspection' and v_role = 'inspector') then raise exception 'forbidden'; end if;
      v_to := 'execution';
      insert into inspections (contract_id, result, notes, inspector)
        values (p_contract, 'CORRECTION_REQUESTED', v_clean, v_uid);
    when 'accept-work' then
      if not (v_stage = 'acceptance' and v_role in ('manager', 'pln_pic')) then raise exception 'forbidden'; end if;
      v_to := 'final-docs';
    when 'submit-final' then
      if not (v_stage = 'final-docs' and v_role = 'vendor') then raise exception 'forbidden'; end if;
      v_to := 'payment';
    when 'mark-paid' then
      if not (v_stage = 'payment' and v_role = 'pln_pic') then raise exception 'forbidden'; end if;
      v_to := 'payment';
      update contracts set paid = true where id = p_contract;
    else raise exception 'unknown action';
  end case;

  if p_action in ('request-revision', 'request-correction') and v_clean is null then
    raise exception 'comment required';
  end if;

  update contracts set current_stage = v_to where id = p_contract;
  insert into activities (contract_id, actor, actor_role, action, prev_stage, new_stage, comment)
    values (p_contract, v_uid, v_role, p_action, v_stage, v_to, v_clean);

  if p_action in ('approve-review', 'manager-approve', 'accept-work') then
    insert into approvals (contract_id, stage, actor, actor_role, decision, comment)
      values (p_contract, v_stage, v_uid, v_role, 'APPROVED', v_clean);
  elsif p_action = 'request-revision' then
    insert into approvals (contract_id, stage, actor, actor_role, decision, comment)
      values (p_contract, v_stage, v_uid, v_role, 'REVISION_REQUESTED', v_clean);
  elsif p_action = 'mark-paid' then
    insert into approvals (contract_id, stage, actor, actor_role, decision, comment)
      values (p_contract, v_stage, v_uid, v_role, 'PAID', v_clean);
  end if;

  return v_to;
end;
$$;

grant execute on function public.apply_transition(text, text, text) to authenticated;
grant execute on function public.can_see_contract(text) to authenticated;
