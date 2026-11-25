-- Resource `surat` belum pernah terdaftar sebagai modul tenant, sehingga seluruh
-- alur persuratan (/persuratan/surat) tertutup izinnya dan operator tidak bisa
-- membuat konsep surat. Tambahkan baris modul "Daftar Surat" di grup Layanan
-- Surat untuk tenant yang belum memilikinya.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT g.`village_id`, 'surat', 'Daftar Surat', '/persuratan/surat', NULL, 0, 0, 1, 2, g.`id`
FROM `modules` g
WHERE g.`slug` = 'layanan-surat'
  AND NOT EXISTS (
    SELECT 1 FROM `modules` x WHERE x.`village_id` = g.`village_id` AND x.`slug` = 'surat'
  );
--> statement-breakpoint
-- Administrator mengelola (termasuk hapus); operator membuat konsep, sekretaris
-- dan kepala desa memverifikasi/menandatangani — setara hak `u` di OpenSID.
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`,
       CASE WHEN r.`slug` = 'administrator' THEN 'manage' ELSE 'write' END,
       1,
       1,
       1,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` = 'surat'
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
-- Fitur `surat` juga harus aktif pada paket yang menyediakan layanan surat,
-- karena modul yang tidak ada di paket akan tersaring dari izin efektif.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, 'surat'
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` f
    WHERE f.`plan_version_id` = v.`id` AND f.`module_slug` = 'surat'
  );
