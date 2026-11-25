-- Fitur Kehadiran pada paket langganan.
-- Menu Hari Libur, Jam Kerja, Pengajuan Izin, dan Persetujuan Izin sudah punya
-- halaman, tetapi belum tercatat sebagai fitur paket. Paket yang dijual sebagai
-- langganan menyaring modul lewat `subscription_plan_features`, sehingga tanpa
-- baris ini role non-administrator tidak melihat menu tersebut.
-- Kehadiran mengikuti paket Standar dan Premium (sama seperti Pengaduan dan
-- Rekapitulasi Kehadiran), bukan paket Minimum. Hanya versi berstatus terbit
-- yang disentuh; draf paket tetap diatur lewat halaman Paket Langganan. Aman
-- dijalankan berulang karena setiap baris diperiksa lebih dulu.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, x.`module_slug`
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
JOIN (
  SELECT 'hari-libur' AS module_slug
  UNION ALL SELECT 'jam-kerja'
  UNION ALL SELECT 'pengajuan-izin'
  UNION ALL SELECT 'persetujuan-izin'
) x
WHERE p.`slug` IN ('standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` f
    WHERE f.`plan_version_id` = v.`id` AND f.`module_slug` = x.`module_slug`
  );
