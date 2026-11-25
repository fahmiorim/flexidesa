-- Menu Kehadiran → Pengajuan Izin dan Persetujuan Izin mengikuti OpenSID.
-- Tenant lama dibuat lewat provisioning dari template sehingga belum memuat
-- kedua modul ini. Tambahkan baris modul (beserta izin per role) hanya untuk
-- tenant yang memiliki grup `kehadiran` dan belum punya modulnya.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT g.`village_id`, 'pengajuan-izin', 'Pengajuan Izin', '/kehadiran/pengajuan-izin', NULL, 0, 0, 1, 5, g.`id`
FROM `modules` g
WHERE g.`slug` = 'kehadiran'
  AND NOT EXISTS (
    SELECT 1 FROM `modules` x WHERE x.`village_id` = g.`village_id` AND x.`slug` = 'pengajuan-izin'
  );
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT g.`village_id`, 'persetujuan-izin', 'Persetujuan Izin', '/kehadiran/persetujuan-izin', NULL, 0, 0, 1, 6, g.`id`
FROM `modules` g
WHERE g.`slug` = 'kehadiran'
  AND NOT EXISTS (
    SELECT 1 FROM `modules` x WHERE x.`village_id` = g.`village_id` AND x.`slug` = 'persetujuan-izin'
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
WHERE m.`slug` IN ('pengajuan-izin', 'persetujuan-izin')
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
