-- Resource `jenis-surat`, `surat-masuk`, `surat-keluar`, dan `surat-dinas`
-- dipakai use case persuratan tetapi belum pernah terdaftar sebagai modul,
-- sehingga halaman /persuratan/jenis-surat (dan buku agenda/surat dinas)
-- melempar 403 untuk semua role tenant. Daftarkan sebagai modul izin
-- tersembunyi tanpa menu, sama seperti modul `surat`.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'jenis-surat', 'Jenis Surat', NULL, NULL, 0, 1, 1, 28, 0
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'jenis-surat'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'surat-masuk', 'Surat Masuk', NULL, NULL, 0, 1, 1, 29, 0
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'surat-masuk'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'surat-keluar', 'Surat Keluar', NULL, NULL, 0, 1, 1, 30, 0
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'surat-keluar'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'surat-dinas', 'Surat Dinas', NULL, NULL, 0, 1, 1, 31, 0
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'surat-dinas'
);
--> statement-breakpoint
-- Administrator mengelola; role lain hanya membaca (aturan template tenant).
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`,
       CASE WHEN r.`slug` = 'administrator' THEN 'manage' ELSE 'read' END,
       1,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` IN ('jenis-surat', 'surat-masuk', 'surat-keluar', 'surat-dinas')
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
-- Fitur paket juga harus aktif, karena modul di luar paket tersaring dari
-- izin efektif walau grant-nya ada.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, f.`slug`
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
JOIN (
  SELECT 'jenis-surat' AS slug UNION ALL
  SELECT 'surat-masuk' UNION ALL
  SELECT 'surat-keluar' UNION ALL
  SELECT 'surat-dinas'
) f
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` x
    WHERE x.`plan_version_id` = v.`id` AND x.`module_slug` = f.`slug`
  );
