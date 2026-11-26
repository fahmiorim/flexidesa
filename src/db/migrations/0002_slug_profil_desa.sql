-- Grup sidebar "Profil & Website Desa" memakai slug modul `info-desa`, padahal
-- label dan prefiks rutenya `profil-desa`. Beberapa tenant juga masih menyimpan
-- modul izin tersembunyi `profil-desa` (untuk halaman Potensi Desa) sehingga
-- slug tersebut harus digabung lebih dulu agar tidak melanggar indeks unik
-- (village_id, slug).
--
-- 1) Pindahkan grant dari modul tersembunyi `profil-desa` ke modul grup.
INSERT INTO `role_permissions` (
  `role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`
)
SELECT
  rp.`role_id`, tujuan.`id`, rp.`access`, rp.`can_read`, rp.`can_create`,
  rp.`can_update`, rp.`can_delete`
FROM `role_permissions` rp
JOIN `modules` lama ON lama.`id` = rp.`module_id` AND lama.`slug` = 'profil-desa'
JOIN `modules` tujuan
  ON tujuan.`village_id` <=> lama.`village_id` AND tujuan.`slug` = 'info-desa'
WHERE NOT EXISTS (
  SELECT 1 FROM `role_permissions` sudah
  WHERE sudah.`role_id` = rp.`role_id` AND sudah.`module_id` = tujuan.`id`
);
--> statement-breakpoint
-- 2) Anak dari modul tersembunyi dipindahkan ke modul grup sebelum modulnya dihapus.
UPDATE `modules` anak
JOIN `modules` lama ON lama.`id` = anak.`parent_id` AND lama.`slug` = 'profil-desa'
JOIN `modules` tujuan
  ON tujuan.`village_id` <=> lama.`village_id` AND tujuan.`slug` = 'info-desa'
SET anak.`parent_id` = tujuan.`id`;
--> statement-breakpoint
-- 3) Hapus modul tersembunyi `profil-desa` yang sudah tidak diperlukan.
DELETE lama FROM `modules` lama
JOIN `modules` tujuan
  ON tujuan.`village_id` <=> lama.`village_id` AND tujuan.`slug` = 'info-desa'
WHERE lama.`slug` = 'profil-desa';
--> statement-breakpoint
-- 4) Tenant yang hanya punya modul tersembunyi dipromosikan menjadi grup.
UPDATE `modules`
SET `is_group` = 1, `is_hidden` = 0, `name` = 'Profil & Website Desa',
    `url` = NULL, `icon` = '▤', `parent_id` = 0
WHERE `slug` = 'profil-desa' AND `is_group` = 0;
--> statement-breakpoint
-- 5) Ganti slug modul grup.
UPDATE `modules` SET `slug` = 'profil-desa' WHERE `slug` = 'info-desa';
--> statement-breakpoint
-- 6) Fitur paket mengikuti slug baru; buang duplikat lebih dulu.
DELETE fitur FROM `subscription_plan_features` fitur
JOIN `subscription_plan_features` sudah
  ON sudah.`plan_version_id` = fitur.`plan_version_id`
 AND sudah.`module_slug` = 'profil-desa'
WHERE fitur.`module_slug` = 'info-desa';
--> statement-breakpoint
UPDATE `subscription_plan_features`
SET `module_slug` = 'profil-desa'
WHERE `module_slug` = 'info-desa';
