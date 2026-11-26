CREATE TABLE `sarana_prasarana` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`kategori` varchar(40) NOT NULL DEFAULT 'lainnya',
	`lokasi` varchar(200),
	`keterangan` text,
	`aktif` boolean NOT NULL DEFAULT false,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sarana_prasarana_id` PRIMARY KEY(`id`),
	CONSTRAINT `sarana_prasarana_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
ALTER TABLE `profil_desa` ADD `tahun_berdiri` int;--> statement-breakpoint
ALTER TABLE `sarana_prasarana` ADD CONSTRAINT `sarana_prasarana_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sarana_prasarana_village_active_idx` ON `sarana_prasarana` (`village_id`,`aktif`,`urut`);
--> statement-breakpoint
-- Modul admin Sarana & Prasarana untuk tenant yang sudah ada (tenant baru
-- mendapatkannya dari template). Url mengikuti halaman yang baru dibuat.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'sarana-prasarana', 'Data Sarana & Prasarana', '/satu-data/sarana-prasarana', NULL, 0, 0, 1, 5,
       COALESCE((SELECT p.`id` FROM `modules` p WHERE p.`village_id` = v.`id` AND p.`slug` = 'satu-data' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'sarana-prasarana'
);
--> statement-breakpoint
-- Grant role mengikuti pola submenu operasional lain: administrator manage,
-- sekretaris/operator/kepala-desa membaca.
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`,
       CASE WHEN r.`slug` = 'administrator' THEN 'manage' ELSE 'read' END,
       1,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` = 'sarana-prasarana'
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
-- Fitur paket: modul baru harus aktif agar tidak tersaring dari izin efektif.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, 'sarana-prasarana'
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` x
    WHERE x.`plan_version_id` = v.`id` AND x.`module_slug` = 'sarana-prasarana'
  );