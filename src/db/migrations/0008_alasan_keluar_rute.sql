-- Halaman Alasan Keluar sudah tersedia di /kehadiran/alasan-keluar.
-- 1) Baris modul tenant lama masih menunjuk URL placeholder /segera/alasan-keluar.
UPDATE `modules`
SET `url` = '/kehadiran/alasan-keluar'
WHERE `slug` = 'alasan-keluar' AND `url` = '/segera/alasan-keluar';
--> statement-breakpoint
-- 2) Alasan Keluar melengkapi grup Kehadiran pada paket Standar dan Premium
--    (paket Minimum tidak memuat menu Kehadiran). Hanya versi berstatus terbit
--    yang disentuh; draf paket tetap diatur lewat halaman Paket Langganan.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, 'alasan-keluar'
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
WHERE p.`slug` IN ('standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` f
    WHERE f.`plan_version_id` = v.`id` AND f.`module_slug` = 'alasan-keluar'
  );
