-- Pindah kelompok bertipe `lembaga` ke modul Lembaga Desa.
-- Lembaga Desa kini satu-satunya sumber data lembaga (BPD/LPM/PKK dll);
-- kelompok hanya untuk kelompok masyarakat. Data yang sudah ada di
-- lembaga_desa dengan nama yang sama tidak ditimpa.
INSERT INTO `lembaga_master` (`village_id`, `nama`, `deskripsi`, `urut`)
SELECT `village_id`, `name`, `description`, 0 FROM `kelompok_master`
WHERE `type` = 'lembaga'
  AND NOT EXISTS (
    SELECT 1 FROM `lembaga_master` lm
    WHERE lm.`village_id` = `kelompok_master`.`village_id` AND lm.`nama` = `kelompok_master`.`name`
  );--> statement-breakpoint
INSERT INTO `lembaga_desa` (`village_id`, `nama`, `kode`, `jenis`, `master_id`, `deskripsi`, `no_sk_pendirian`, `ketua_resident_id`, `status`)
SELECT k.`village_id`, k.`name`,
  CASE WHEN k.`code` IS NULL OR k.`code` = '' OR EXISTS (
    SELECT 1 FROM `lembaga_desa` ld WHERE ld.`village_id` = k.`village_id` AND ld.`kode` = LEFT(k.`code`, 16)
  ) THEN NULL ELSE LEFT(k.`code`, 16) END,
  'lainnya',
  (SELECT lm.`id` FROM `lembaga_master` lm WHERE lm.`village_id` = k.`village_id` AND lm.`nama` = km.`name`),
  k.`description`, k.`decree_number`,
  (SELECT ka.`resident_id` FROM `kelompok_anggota` ka WHERE ka.`kelompok_id` = k.`id` AND ka.`village_id` = k.`village_id` AND ka.`position` = 1 LIMIT 1),
  'aktif'
FROM `kelompok` k
LEFT JOIN `kelompok_master` km ON km.`id` = k.`category_id` AND km.`type` = 'lembaga'
WHERE k.`type` = 'lembaga'
  AND NOT EXISTS (
    SELECT 1 FROM `lembaga_desa` ld2 WHERE ld2.`village_id` = k.`village_id` AND ld2.`nama` = k.`name`
  );--> statement-breakpoint
INSERT INTO `lembaga_anggota` (`village_id`, `lembaga_id`, `resident_id`, `nama`, `nomor_anggota`, `jabatan`, `nomor_sk_jabatan`, `keterangan`, `tampil_publik`, `aktif`)
SELECT ka.`village_id`, ld.`id`, ka.`resident_id`, r.`name`, ka.`member_number`,
  CASE ka.`position` WHEN 1 THEN 'Ketua' WHEN 2 THEN 'Wakil Ketua' WHEN 3 THEN 'Sekretaris' WHEN 4 THEN 'Bendahara' ELSE 'Anggota' END,
  ka.`decree_number`, ka.`keterangan`, ka.`tampil_publik`, 1
FROM `kelompok_anggota` ka
JOIN `kelompok` k ON k.`id` = ka.`kelompok_id` AND k.`village_id` = ka.`village_id` AND k.`type` = 'lembaga'
JOIN `lembaga_desa` ld ON ld.`village_id` = k.`village_id` AND ld.`nama` = k.`name`
JOIN `residents` r ON r.`id` = ka.`resident_id` AND r.`village_id` = ka.`village_id`
WHERE NOT EXISTS (
  SELECT 1 FROM `lembaga_anggota` la WHERE la.`village_id` = ka.`village_id` AND la.`lembaga_id` = ld.`id` AND la.`resident_id` = ka.`resident_id`
);--> statement-breakpoint
DELETE FROM `kelompok_anggota` WHERE `kelompok_id` IN (SELECT `id` FROM `kelompok` WHERE `type` = 'lembaga');--> statement-breakpoint
DELETE FROM `kelompok` WHERE `type` = 'lembaga';--> statement-breakpoint
DELETE FROM `kelompok_master` WHERE `type` = 'lembaga';
