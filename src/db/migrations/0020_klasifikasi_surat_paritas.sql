-- Parity `klasifikasi_surat` OpenSID: kode sampai 50 karakter dan status
-- aktif/nonaktif (`enabled`). Uraian sudah memakai kolom description.
ALTER TABLE `letter_classifications`
  ADD COLUMN `is_active` boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE `letter_classifications`
  MODIFY `code` varchar(50) NOT NULL;
--> statement-breakpoint
-- Menu Layanan Surat → Klasifikasi Surat kini menuju halaman nyata.
UPDATE `modules`
SET `url` = '/persuratan/klasifikasi-surat'
WHERE `slug` = 'klasifikasi-surat'
  AND (`url` IS NULL OR `url` <> '/persuratan/klasifikasi-surat');
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'klasifikasi-surat', 'Klasifikasi Surat', '/persuratan/klasifikasi-surat', NULL, 0, 0, 1, 9,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'layanan-surat' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'klasifikasi-surat'
);
--> statement-breakpoint
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`,
       CASE WHEN r.`slug` = 'administrator' THEN 'manage' ELSE 'read' END,
       1,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` = 'klasifikasi-surat'
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, 'klasifikasi-surat'
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` f
    WHERE f.`plan_version_id` = v.`id` AND f.`module_slug` = 'klasifikasi-surat'
  );
