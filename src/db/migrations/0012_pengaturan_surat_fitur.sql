-- Pengaturan Surat dibutuhkan semua paket yang menyediakan layanan surat,
-- sama seperti Cetak Surat dan Permohonan Surat. Hanya versi terbit yang
-- disentuh; draf paket tetap diatur lewat halaman Paket Langganan.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, 'pengaturan-surat'
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` f
    WHERE f.`plan_version_id` = v.`id` AND f.`module_slug` = 'pengaturan-surat'
  );
