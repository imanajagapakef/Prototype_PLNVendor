-- 04_indonesian.sql — translate seed comments and doc types to Indonesian.
-- Action codes stay as-is; the UI maps them via TRANSITIONS labels.

update activities set comment = 'Kontrak dibuat'
  where comment = 'Contract created';
update activities set comment = 'RBA dikirim'
  where comment = 'RBA submitted';
update activities set comment = 'RBA kurang rincian kabel'
  where comment = 'RBA missing cable breakdown';
update activities set comment = 'RBA dikirim ulang'
  where comment = 'RBA resubmitted';
update activities set comment = 'Kabel 500m, Tiang 20'
  where comment = 'Cable 500m, Pole 20';
update activities set comment = 'Tiang dan fitting'
  where comment = 'Poles and fittings';
update activities set comment = 'Pekerjaan selesai'
  where comment = 'Work completed';

update documents set doc_type = 'Kontrak' where doc_type = 'Contract';
update documents set doc_type = 'RBA' where doc_type = 'Budget Plan';
update documents set doc_type = 'Teknis' where doc_type = 'Technical';
update documents set doc_type = 'Persetujuan' where doc_type = 'Approval';
update documents set doc_type = 'Material' where doc_type = 'Material';
update documents set doc_type = 'SPK' where doc_type = 'Work Order';
update documents set doc_type = 'Pelaksanaan' where doc_type = 'Execution';
update documents set doc_type = 'Inspeksi' where doc_type = 'Inspection';
update documents set doc_type = 'Serah Terima' where doc_type = 'Acceptance';
