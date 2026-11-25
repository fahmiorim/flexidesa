-- Halaman Cetak Surat sudah tersedia di /persuratan/cetak-surat.
-- 1) Baris modul tenant lama masih menunjuk URL placeholder /segera/cetak-surat.
UPDATE `modules`
SET `url` = '/persuratan/cetak-surat'
WHERE `slug` = 'cetak-surat' AND `url` = '/segera/cetak-surat';
--> statement-breakpoint
-- 2) Cetak Surat adalah sisi perangkat desa dari Permohonan Surat, sehingga
--    tersedia pada paket Minimum, Standar, dan Premium. Hanya versi berstatus
--    terbit yang disentuh; draf paket tetap diatur lewat halaman Paket Langganan.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, 'cetak-surat'
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` f
    WHERE f.`plan_version_id` = v.`id` AND f.`module_slug` = 'cetak-surat'
  );
