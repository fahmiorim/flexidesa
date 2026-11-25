-- Menu Layanan Surat → Daftar Persyaratan kini menuju halaman nyata
-- (`/persuratan/syarat-surat`) yang setara dengan `syarat_surat` OpenSID.
UPDATE `modules`
SET `url` = '/persuratan/syarat-surat'
WHERE `slug` = 'syarat-surat'
  AND (`url` IS NULL OR `url` <> '/persuratan/syarat-surat');
--> statement-breakpoint
-- Tenant lama yang belum memiliki modul ini mendapatkannya sekarang, di bawah
-- grup Layanan Surat bila grup itu ada.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'syarat-surat', 'Daftar Persyaratan', '/persuratan/syarat-surat', NULL, 0, 0, 1, 8,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'layanan-surat' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'syarat-surat'
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
WHERE m.`slug` = 'syarat-surat'
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
-- Fitur paket: semua paket yang menyediakan layanan surat.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, 'syarat-surat'
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` f
    WHERE f.`plan_version_id` = v.`id` AND f.`module_slug` = 'syarat-surat'
  );
