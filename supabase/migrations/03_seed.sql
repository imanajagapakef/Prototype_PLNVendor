-- 03_seed.sql — fictional demo data only. No real PLN data.
insert into organizations (name) values ('PLN UID Demo') on conflict do nothing;

insert into vendors (name, organization_id)
select v.name, o.id from (values
  ('PT Maju Bersama'),
  ('PT Karya Infrastruktur'),
  ('CV Bintang Teknik')
) as v(name)
join organizations o on o.name = 'PLN UID Demo'
on conflict (name) do nothing;

insert into contracts
  (id, project, vendor_id, pic_name, value_label, value_num, location, start_date, end_date, current_stage)
values
  ('CTR-2026-001', 'Pembangunan & Pemeliharaan Jaringan Distribusi',
    (select id from vendors where name = 'PT Maju Bersama'),
    'PLN PIC', 'Rp 850.000.000', 850000000, 'Tanjungpinang', '2026-09-01', '2026-11-30', 'execution'),
  ('CTR-2026-002', 'Rehabilitasi Jaringan Tegangan Menengah',
    (select id from vendors where name = 'PT Karya Infrastruktur'),
    'PLN PIC', 'Rp 1.200.000.000', 1200000000, 'Tanjungpinang', '2026-09-05', '2026-12-15', 'manager-approval'),
  ('CTR-2026-003', 'Pengadaan & Instalasi Material Distribusi',
    (select id from vendors where name = 'CV Bintang Teknik'),
    'PLN PIC', 'Rp 475.000.000', 475000000, 'Tanjungpinang', '2026-09-10', '2026-11-20', 'material-handover'),
  ('CTR-2026-004', 'Pemeliharaan Gardu Distribusi',
    (select id from vendors where name = 'PT Maju Bersama'),
    'PLN PIC', 'Rp 625.000.000', 625000000, 'Tanjungpinang', '2026-08-20', '2026-10-30', 'inspection')
on conflict (id) do update set
  project = excluded.project, vendor_id = excluded.vendor_id,
  value_label = excluded.value_label, value_num = excluded.value_num,
  location = excluded.location, start_date = excluded.start_date,
  end_date = excluded.end_date, current_stage = excluded.current_stage;

-- Document metadata for CTR-2026-001 (storage files uploaded by seed script).
insert into documents (contract_id, doc_type, file_name, storage_path, status) values
  ('CTR-2026-001', 'Contract', 'Contract Agreement.pdf', 'CTR-2026-001/contract.pdf', 'APPROVED'),
  ('CTR-2026-001', 'Budget Plan', 'RBA.pdf', 'CTR-2026-001/rba.pdf', 'APPROVED'),
  ('CTR-2026-001', 'Technical', 'Technical Plan.pdf', 'CTR-2026-001/technical-plan.pdf', 'APPROVED'),
  ('CTR-2026-001', 'Approval', 'Manager Approval.pdf', 'CTR-2026-001/manager-approval.pdf', 'APPROVED'),
  ('CTR-2026-001', 'Material', 'Material Request.pdf', 'CTR-2026-001/material-request.pdf', 'APPROVED'),
  ('CTR-2026-001', 'Material', 'Material Handover.pdf', 'CTR-2026-001/material-handover.pdf', 'APPROVED'),
  ('CTR-2026-001', 'Work Order', 'Work Order.pdf', 'CTR-2026-001/work-order.pdf', 'APPROVED'),
  ('CTR-2026-001', 'Execution', 'Progress Report.pdf', 'CTR-2026-001/progress-report.pdf', 'READY'),
  ('CTR-2026-001', 'Inspection', 'Inspection Report.pdf', null, 'PENDING'),
  ('CTR-2026-001', 'Acceptance', 'Acceptance Report.pdf', null, 'MISSING'),
  ('CTR-2026-002', 'Contract', 'Contract Agreement.pdf', 'CTR-2026-002/contract.pdf', 'APPROVED'),
  ('CTR-2026-002', 'Budget Plan', 'RBA.pdf', 'CTR-2026-002/rba.pdf', 'READY'),
  ('CTR-2026-003', 'Contract', 'Contract Agreement.pdf', 'CTR-2026-003/contract.pdf', 'APPROVED'),
  ('CTR-2026-003', 'Material', 'Material Request.pdf', 'CTR-2026-003/material-request.pdf', 'READY'),
  ('CTR-2026-004', 'Contract', 'Contract Agreement.pdf', 'CTR-2026-004/contract.pdf', 'APPROVED'),
  ('CTR-2026-004', 'Execution', 'Progress Report.pdf', 'CTR-2026-004/progress-report.pdf', 'READY')
on conflict do nothing;

-- Plausible history per contract (actor ids filled by seed script for users).
insert into activities (contract_id, actor_role, action, prev_stage, new_stage, comment, created_at) values
  ('CTR-2026-001', 'pln_pic', 'contract-issued', null, 'contract-issued', 'Contract created', '2026-09-01 09:00'),
  ('CTR-2026-001', 'vendor', 'submit-docs', 'doc-prep', 'pln-review', 'RBA submitted', '2026-09-03 14:21'),
  ('CTR-2026-001', 'pln_pic', 'request-revision', 'pln-review', 'doc-prep', 'RBA missing cable breakdown', '2026-09-03 14:42'),
  ('CTR-2026-001', 'vendor', 'submit-docs', 'doc-prep', 'pln-review', 'RBA resubmitted', '2026-09-04 15:08'),
  ('CTR-2026-001', 'pln_pic', 'approve-review', 'pln-review', 'manager-approval', null, '2026-09-04 15:26'),
  ('CTR-2026-001', 'manager', 'manager-approve', 'manager-approval', 'material-request', null, '2026-09-05 10:12'),
  ('CTR-2026-001', 'vendor', 'request-material', 'material-request', 'material-handover', 'Cable 500m, Pole 20', '2026-09-06 11:03'),
  ('CTR-2026-001', 'warehouse', 'confirm-handover', 'material-handover', 'work-order', null, '2026-09-07 09:44'),
  ('CTR-2026-001', 'pln_pic', 'issue-wo', 'work-order', 'execution', 'WO-2026-001', '2026-09-07 13:20'),
  ('CTR-2026-002', 'pln_pic', 'contract-issued', null, 'contract-issued', 'Contract created', '2026-09-05 09:00'),
  ('CTR-2026-002', 'vendor', 'submit-docs', 'doc-prep', 'pln-review', 'RBA submitted', '2026-09-06 10:00'),
  ('CTR-2026-002', 'pln_pic', 'approve-review', 'pln-review', 'manager-approval', null, '2026-09-07 11:00'),
  ('CTR-2026-003', 'pln_pic', 'contract-issued', null, 'contract-issued', 'Contract created', '2026-09-10 09:00'),
  ('CTR-2026-003', 'manager', 'manager-approve', 'manager-approval', 'material-request', null, '2026-09-11 10:00'),
  ('CTR-2026-003', 'vendor', 'request-material', 'material-request', 'material-handover', 'Poles and fittings', '2026-09-11 15:00'),
  ('CTR-2026-004', 'pln_pic', 'contract-issued', null, 'contract-issued', 'Contract created', '2026-08-20 09:00'),
  ('CTR-2026-004', 'vendor', 'mark-completed', 'execution', 'inspection', 'Work completed', '2026-09-09 14:32')
on conflict do nothing;
