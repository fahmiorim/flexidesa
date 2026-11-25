-- Penataan menu sidebar (penyederhanaan IA):
-- - Layanan Surat -> Persuratan; modul tersembunyi Daftar Surat, Surat
--   Masuk, Surat Keluar, Surat Dinas kini tampil sebagai submenu.
-- - Sekretariat digabung dengan Buku Administrasi Desa.
-- - Statistik & Kesehatan digabung ke Kependudukan.
-- - Pertanahan digabung dengan Pemetaan Umum.
-- - Layanan Mandiri digabung dengan Hubung Warga & Buku Tamu, plus
--   Pengaduan publik -> "Layanan Warga".
-- - Satu Data -> Data Desa (DTKS, Bantuan, SDGs, Lapak).
-- - Admin Web diratakan ke Info Desa.
-- - Modul paritas OpenSID yang belum ada (Dokumen & Informasi Publik,
--   Lapak, Vaksin, Pendataan/Pemantauan Covid, OpenDK) didaftarkan;
--   yang halamannya belum ada memakai URL /segera/<slug>.
UPDATE `modules` SET `name` = 'Persuratan' WHERE `slug` = 'layanan-surat';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Pertanahan & Peta' WHERE `slug` = 'pertanahan';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Layanan Warga' WHERE `slug` = 'layanan-mandiri';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Data Desa' WHERE `slug` = 'satu-data';
--> statement-breakpoint
UPDATE `modules`
SET `sort_order` = CASE `slug`
  WHEN 'kehadiran' THEN 4
  WHEN 'layanan-surat' THEN 5
  WHEN 'sekretariat' THEN 6
  WHEN 'keuangan' THEN 7
  WHEN 'analisis' THEN 8
  WHEN 'pertanahan' THEN 9
  WHEN 'layanan-mandiri' THEN 10
  WHEN 'anjungan' THEN 11
  WHEN 'satu-data' THEN 12
  WHEN 'pengaturan' THEN 13
  ELSE `sort_order`
END
WHERE `slug` IN ('kehadiran', 'layanan-surat', 'sekretariat', 'keuangan', 'analisis', 'pertanahan', 'layanan-mandiri', 'anjungan', 'satu-data', 'pengaturan');
--> statement-breakpoint
-- Grup yang dibubarkan disembunyikan (modul & grant-nya tetap ada).
UPDATE `modules` SET `is_hidden` = 1
WHERE `slug` IN ('statistik', 'kesehatan', 'buku-administrasi-desa', 'pemetaan', 'hubung-warga', 'admin-web', 'buku-tamu');
--> statement-breakpoint
-- Pindahkan anak grup yang dibubarkan ke grup gabungan.
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'kependudukan'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('stunting', 'statistik-kependudukan', 'laporan-bulanan', 'laporan-kelompok-rentan', 'laporan-penduduk');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'pertanahan'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('peta', 'pengaturan-peta');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'layanan-mandiri'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('pengaduan', 'pesan-warga', 'daftar-kontak', 'data-tamu', 'data-kepuasan', 'data-pertanyaan', 'data-keperluan');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'sekretariat'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('bumindes');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'info-desa'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('website-pengaturan', 'berita', 'galeri', 'slider', 'menu-publik', 'widget', 'komentar', 'media-sosial', 'teks-berjalan', 'pengunjung');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'layanan-surat'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('surat', 'surat-masuk', 'surat-keluar', 'surat-dinas');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'satu-data'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('bantuan', 'idm-sdgs');
--> statement-breakpoint
-- Tampilkan modul surat & data desa yang sebelumnya tersembunyi.
UPDATE `modules` SET `url` = '/persuratan/surat', `name` = 'Daftar Surat', `is_hidden` = 0, `sort_order` = 2 WHERE `slug` = 'surat';
--> statement-breakpoint
UPDATE `modules` SET `url` = '/persuratan/surat-masuk', `is_hidden` = 0, `sort_order` = 3 WHERE `slug` = 'surat-masuk';
--> statement-breakpoint
UPDATE `modules` SET `url` = '/persuratan/surat-keluar', `is_hidden` = 0, `sort_order` = 4 WHERE `slug` = 'surat-keluar';
--> statement-breakpoint
UPDATE `modules` SET `url` = '/persuratan/surat-dinas', `is_hidden` = 0, `sort_order` = 5 WHERE `slug` = 'surat-dinas';
--> statement-breakpoint
UPDATE `modules` SET `url` = '/segera/bantuan', `is_hidden` = 0, `sort_order` = 2 WHERE `slug` = 'bantuan';
--> statement-breakpoint
UPDATE `modules` SET `url` = '/desa/idm', `is_hidden` = 0, `sort_order` = 3 WHERE `slug` = 'idm-sdgs';
--> statement-breakpoint
-- Urutan submenu di dalam grup gabungan.
UPDATE `modules`
SET `sort_order` = CASE `slug`
  WHEN 'stunting' THEN 8
  WHEN 'statistik-kependudukan' THEN 9
  WHEN 'laporan-bulanan' THEN 10
  WHEN 'laporan-kelompok-rentan' THEN 11
  WHEN 'laporan-penduduk' THEN 12
  WHEN 'peta' THEN 3
  WHEN 'pengaturan-peta' THEN 4
  WHEN 'pengaduan' THEN 1
  WHEN 'kotak-pesan' THEN 2
  WHEN 'pendaftar-layanan-mandiri' THEN 3
  WHEN 'gawai-layanan' THEN 4
  WHEN 'pesan-warga' THEN 5
  WHEN 'daftar-kontak' THEN 6
  WHEN 'data-tamu' THEN 7
  WHEN 'data-kepuasan' THEN 8
  WHEN 'data-pertanyaan' THEN 9
  WHEN 'data-keperluan' THEN 10
  WHEN 'pendapat' THEN 11
  WHEN 'pengaturan-layanan-mandiri' THEN 12
  WHEN 'arsip' THEN 2
  WHEN 'inventaris' THEN 3
  WHEN 'website-pengaturan' THEN 6
  WHEN 'berita' THEN 7
  WHEN 'galeri' THEN 8
  WHEN 'slider' THEN 9
  WHEN 'menu-publik' THEN 10
  WHEN 'widget' THEN 11
  WHEN 'komentar' THEN 12
  WHEN 'media-sosial' THEN 13
  WHEN 'teks-berjalan' THEN 14
  WHEN 'pengunjung' THEN 15
  WHEN 'cetak-surat' THEN 6
  WHEN 'permohonan-surat' THEN 7
  WHEN 'syarat-surat' THEN 8
  WHEN 'klasifikasi-surat' THEN 9
  WHEN 'arsip-layanan' THEN 10
  ELSE `sort_order`
END
WHERE `slug` IN ('stunting', 'statistik-kependudukan', 'laporan-bulanan', 'laporan-kelompok-rentan', 'laporan-penduduk', 'peta', 'pengaturan-peta', 'pengaduan', 'kotak-pesan', 'pendaftar-layanan-mandiri', 'gawai-layanan', 'pesan-warga', 'daftar-kontak', 'data-tamu', 'data-kepuasan', 'data-pertanyaan', 'data-keperluan', 'pendapat', 'pengaturan-layanan-mandiri', 'arsip', 'inventaris', 'website-pengaturan', 'berita', 'galeri', 'slider', 'menu-publik', 'widget', 'komentar', 'media-sosial', 'teks-berjalan', 'pengunjung', 'cetak-surat', 'permohonan-surat', 'syarat-surat', 'klasifikasi-surat', 'arsip-layanan');
--> statement-breakpoint
-- Modul paritas OpenSID yang belum pernah terdaftar.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'dokumen', 'Dokumen & Informasi Publik', '/website/dokumen', NULL, 0, 0, 1, 16,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'info-desa' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'dokumen'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'lapak', 'Lapak', '/segera/lapak', NULL, 0, 0, 1, 4,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'satu-data' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'lapak'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'vaksin', 'Vaksin', '/segera/vaksin', NULL, 0, 0, 1, 13,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'kependudukan' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'vaksin'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'covid-pendataan', 'Pendataan Covid', '/segera/covid-pendataan', NULL, 0, 0, 1, 14,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'kependudukan' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'covid-pendataan'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'covid-pemantauan', 'Pemantauan Covid', '/segera/covid-pemantauan', NULL, 0, 0, 1, 15,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'kependudukan' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'covid-pemantauan'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'opendk-pesan', 'Pesan OpenDK', '/segera/opendk-pesan', NULL, 0, 0, 1, 10,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'pengaturan' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'opendk-pesan'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'opendk-sinkronisasi', 'Sinkronisasi OpenDK', '/segera/opendk-sinkronisasi', NULL, 0, 0, 1, 11,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'pengaturan' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'opendk-sinkronisasi'
);
--> statement-breakpoint
-- Grant role untuk modul baru; administrator manage, role lain read.
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`,
       CASE WHEN r.`slug` = 'administrator' THEN 'manage' ELSE 'read' END,
       1,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` IN ('dokumen', 'lapak', 'vaksin', 'covid-pendataan', 'covid-pemantauan', 'opendk-pesan', 'opendk-sinkronisasi')
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
-- Bantuan kini tampil di menu: role lain perlu grant baca.
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`, 'read', 1, 0, 0, 0
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` = 'bantuan'
  AND r.`slug` IN ('sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
-- Fitur paket juga harus aktif, karena modul di luar paket tersaring dari
-- izin efektif walau grant-nya ada.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, f.`slug`
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
JOIN (
  SELECT 'dokumen' AS slug UNION ALL
  SELECT 'bantuan' UNION ALL
  SELECT 'idm-sdgs' UNION ALL
  SELECT 'lapak' UNION ALL
  SELECT 'vaksin' UNION ALL
  SELECT 'covid-pendataan' UNION ALL
  SELECT 'covid-pemantauan' UNION ALL
  SELECT 'opendk-pesan' UNION ALL
  SELECT 'opendk-sinkronisasi'
) f
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` x
    WHERE x.`plan_version_id` = v.`id` AND x.`module_slug` = f.`slug`
  );
