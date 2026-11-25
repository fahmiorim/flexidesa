-- Penataan menu sidebar menjadi 12 grup:
-- Beranda; Profil & Website Desa; Kependudukan; Pelayanan & Persuratan;
-- Kehadiran & Kepegawaian; Administrasi Desa; Keuangan Desa;
-- Pembangunan & Aset; Pertanahan & GIS; Program & Data Desa; Layanan Warga;
-- Pengaturan.
--
-- Modul yang tidak lagi masuk daftar menu disembunyikan (baris modul dan grant
-- tetap ada agar izin lama tidak yatim). Modul baru yang halamannya belum
-- dibangun memakai URL /segera/<slug> agar sidebar menampilkan halaman
-- placeholder, bukan tautan mati.
UPDATE `modules` SET `name` = 'Beranda' WHERE `slug` = 'beranda';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Profil & Website Desa' WHERE `slug` = 'info-desa';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Pelayanan & Persuratan' WHERE `slug` = 'layanan-surat';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Kehadiran & Kepegawaian' WHERE `slug` = 'kehadiran';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Administrasi Desa' WHERE `slug` = 'sekretariat';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Keuangan Desa' WHERE `slug` = 'keuangan';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Pertanahan & GIS' WHERE `slug` = 'pertanahan';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Program & Data Desa' WHERE `slug` = 'satu-data';
--> statement-breakpoint
UPDATE `modules`
SET `sort_order` = CASE `slug`
  WHEN 'beranda' THEN 1
  WHEN 'info-desa' THEN 2
  WHEN 'kependudukan' THEN 3
  WHEN 'layanan-surat' THEN 4
  WHEN 'kehadiran' THEN 5
  WHEN 'sekretariat' THEN 6
  WHEN 'keuangan' THEN 7
  WHEN 'pembangunan-aset' THEN 8
  WHEN 'pertanahan' THEN 9
  WHEN 'satu-data' THEN 10
  WHEN 'layanan-mandiri' THEN 11
  WHEN 'pengaturan' THEN 12
  ELSE `sort_order`
END
WHERE `slug` IN ('beranda', 'info-desa', 'kependudukan', 'layanan-surat', 'kehadiran', 'sekretariat', 'keuangan', 'pembangunan-aset', 'pertanahan', 'satu-data', 'layanan-mandiri', 'pengaturan');
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'pembangunan-aset', 'Pembangunan & Aset', NULL, '◈', 1, 0, 1, 8, 0
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'pembangunan-aset'
);
--> statement-breakpoint
-- Pindahkan submenu ke grup yang baru.
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'info-desa'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('pengaturan-desa', 'wilayah', 'perangkat-desa', 'lembaga-desa', 'status-desa', 'berita', 'galeri', 'dokumen', 'website-pengaturan');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'kependudukan'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('penduduk', 'keluarga', 'rumah-tangga', 'kelompok', 'suplemen', 'calon-pemilih', 'stunting', 'statistik-kependudukan', 'laporan-penduduk', 'laporan-bulanan', 'laporan-kelompok-rentan');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'layanan-surat'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('permohonan-surat', 'surat', 'pengaturan-surat', 'syarat-surat', 'klasifikasi-surat', 'cetak-surat', 'surat-masuk', 'surat-keluar', 'surat-dinas');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'kehadiran'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('data-pegawai', 'absensi', 'rekapitulasi-kehadiran', 'pengajuan-izin', 'persetujuan-izin', 'hari-libur', 'jam-kerja', 'alasan-keluar');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'sekretariat'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('bumindes', 'buku-administrasi-penduduk', 'buku-administrasi-pembangunan', 'buku-administrasi-lainnya', 'agenda-kegiatan', 'arsip');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'keuangan'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('apbdes', 'pendapatan', 'belanja', 'pembiayaan', 'penatausahaan', 'buku-kas-umum', 'realisasi', 'laporan-keuangan');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'pembangunan-aset'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('perencanaan-pembangunan', 'pembangunan', 'proyek-desa', 'inventaris', 'aset-desa', 'mutasi-aset', 'laporan-aset');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'pertanahan'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('peta', 'peta-wilayah', 'data-pertanahan', 'batas-wilayah', 'peta-penduduk');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'satu-data'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('bantuan', 'data-penerima-bantuan', 'idm-sdgs', 'potensi', 'statistik-program-desa');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'layanan-mandiri'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('pengaduan', 'aspirasi-warga', 'lapak', 'informasi-pelayanan');
--> statement-breakpoint
UPDATE `modules` m JOIN `modules` p ON p.`village_id` = m.`village_id` AND p.`slug` = 'pengaturan'
SET m.`parent_id` = p.`id`
WHERE m.`slug` IN ('pengguna', 'grup-akses', 'pengaturan-sistem', 'integrasi', 'template-website', 'log-aktivitas');
--> statement-breakpoint
-- Urutan submenu sesuai daftar menu baku.
UPDATE `modules`
SET `sort_order` = CASE `slug`
  WHEN 'pengaturan-desa' THEN 1
  WHEN 'wilayah' THEN 2
  WHEN 'perangkat-desa' THEN 3
  WHEN 'lembaga-desa' THEN 4
  WHEN 'status-desa' THEN 5
  WHEN 'berita' THEN 6
  WHEN 'galeri' THEN 7
  WHEN 'dokumen' THEN 8
  WHEN 'website-pengaturan' THEN 9
  WHEN 'penduduk' THEN 1
  WHEN 'keluarga' THEN 2
  WHEN 'rumah-tangga' THEN 3
  WHEN 'kelompok' THEN 4
  WHEN 'suplemen' THEN 5
  WHEN 'calon-pemilih' THEN 6
  WHEN 'stunting' THEN 7
  WHEN 'statistik-kependudukan' THEN 8
  WHEN 'laporan-penduduk' THEN 9
  WHEN 'laporan-bulanan' THEN 10
  WHEN 'laporan-kelompok-rentan' THEN 11
  WHEN 'permohonan-surat' THEN 1
  WHEN 'surat' THEN 2
  WHEN 'pengaturan-surat' THEN 3
  WHEN 'syarat-surat' THEN 4
  WHEN 'klasifikasi-surat' THEN 5
  WHEN 'cetak-surat' THEN 6
  WHEN 'surat-masuk' THEN 7
  WHEN 'surat-keluar' THEN 8
  WHEN 'surat-dinas' THEN 9
  WHEN 'rekapitulasi-kehadiran' THEN 3
  WHEN 'pengajuan-izin' THEN 4
  WHEN 'persetujuan-izin' THEN 5
  WHEN 'hari-libur' THEN 6
  WHEN 'jam-kerja' THEN 7
  WHEN 'alasan-keluar' THEN 8
  WHEN 'bumindes' THEN 1
  WHEN 'arsip' THEN 6
  WHEN 'laporan-keuangan' THEN 8
  WHEN 'pembangunan' THEN 2
  WHEN 'inventaris' THEN 4
  WHEN 'peta' THEN 1
  WHEN 'bantuan' THEN 1
  WHEN 'idm-sdgs' THEN 3
  WHEN 'pengaduan' THEN 1
  WHEN 'lapak' THEN 3
  WHEN 'pengguna' THEN 1
  ELSE `sort_order`
END
WHERE `slug` IN ('pengaturan-desa', 'wilayah', 'perangkat-desa', 'lembaga-desa', 'status-desa', 'berita', 'galeri', 'dokumen', 'website-pengaturan', 'penduduk', 'keluarga', 'rumah-tangga', 'kelompok', 'suplemen', 'calon-pemilih', 'stunting', 'statistik-kependudukan', 'laporan-penduduk', 'laporan-bulanan', 'laporan-kelompok-rentan', 'permohonan-surat', 'surat', 'pengaturan-surat', 'syarat-surat', 'klasifikasi-surat', 'cetak-surat', 'surat-masuk', 'surat-keluar', 'surat-dinas', 'rekapitulasi-kehadiran', 'pengajuan-izin', 'persetujuan-izin', 'hari-libur', 'jam-kerja', 'alasan-keluar', 'bumindes', 'arsip', 'laporan-keuangan', 'pembangunan', 'inventaris', 'peta', 'bantuan', 'idm-sdgs', 'pengaduan', 'lapak', 'pengguna');
--> statement-breakpoint
-- Label dan tautan yang berubah.
UPDATE `modules` SET `name` = 'Data Stunting' WHERE `slug` = 'stunting';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Rekapitulasi Kehadiran' WHERE `slug` = 'rekapitulasi-kehadiran';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Buku Administrasi Umum', `url` = '/bumindes/buku-administrasi?golongan=A' WHERE `slug` = 'bumindes';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Peta Desa' WHERE `slug` = 'peta';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Pengaduan Masyarakat' WHERE `slug` = 'pengaduan';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Lapak Desa' WHERE `slug` = 'lapak';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Kegiatan Pembangunan', `url` = '/keuangan/kegiatan', `is_hidden` = 0 WHERE `slug` = 'pembangunan';
--> statement-breakpoint
UPDATE `modules` SET `name` = 'Inventaris Barang' WHERE `slug` = 'inventaris';
--> statement-breakpoint
-- Modul yang tidak lagi tampil di sidebar.
UPDATE `modules` SET `is_hidden` = 1
WHERE `slug` IN ('slider', 'menu-publik', 'widget', 'komentar', 'media-sosial', 'teks-berjalan', 'pengunjung', 'arsip-layanan', 'pengaduan-kehadiran', 'c-desa', 'daftar-persil', 'pengaturan-peta', 'impor-data', 'laporan-manual', 'laporan-apbdes', 'pesan-warga', 'daftar-kontak', 'kotak-pesan', 'pendaftar-layanan-mandiri', 'gawai-layanan', 'pendapat', 'pengaturan-layanan-mandiri', 'data-tamu', 'data-kepuasan', 'data-pertanyaan', 'data-keperluan', 'dtks', 'opendk-pesan', 'opendk-sinkronisasi', 'pengaturan-aplikasi', 'modul', 'database', 'info-sistem', 'qr-code', 'optimasi-gambar', 'analisis', 'master-analisis', 'pengaturan-analisis', 'anjungan', 'daftar-anjungan', 'anjungan-menu', 'pengaturan-anjungan');
--> statement-breakpoint
-- Modul submenu baru.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, s.`slug`, s.`name`, s.`url`, NULL, 0, 0, 1, s.`sort_order`,
       COALESCE((SELECT p.`id` FROM `modules` p WHERE p.`village_id` = v.`id` AND p.`slug` = s.`parent_slug` LIMIT 1), 0)
FROM `villages` v
JOIN (
  SELECT 'data-pegawai' AS `slug`, 'Data Perangkat Desa' AS `name`, '/absensi-kepegawaian/pegawai' AS `url`, 'kehadiran' AS `parent_slug`, 1 AS `sort_order`
  UNION ALL SELECT 'absensi', 'Kehadiran', '/absensi-kepegawaian/absensi', 'kehadiran', 2
  UNION ALL SELECT 'buku-administrasi-penduduk', 'Buku Administrasi Penduduk', '/bumindes/buku-administrasi?golongan=B', 'sekretariat', 2
  UNION ALL SELECT 'buku-administrasi-pembangunan', 'Buku Administrasi Pembangunan', '/segera/buku-administrasi-pembangunan', 'sekretariat', 3
  UNION ALL SELECT 'buku-administrasi-lainnya', 'Buku Administrasi Lainnya', '/bumindes/buku-administrasi?golongan=E', 'sekretariat', 4
  UNION ALL SELECT 'agenda-kegiatan', 'Agenda Kegiatan', '/segera/agenda-kegiatan', 'sekretariat', 5
  UNION ALL SELECT 'apbdes', 'APBDes', '/keuangan/apbdes', 'keuangan', 1
  UNION ALL SELECT 'pendapatan', 'Pendapatan', '/segera/pendapatan', 'keuangan', 2
  UNION ALL SELECT 'belanja', 'Belanja', '/segera/belanja', 'keuangan', 3
  UNION ALL SELECT 'pembiayaan', 'Pembiayaan', '/segera/pembiayaan', 'keuangan', 4
  UNION ALL SELECT 'penatausahaan', 'Penatausahaan', '/segera/penatausahaan', 'keuangan', 5
  UNION ALL SELECT 'buku-kas-umum', 'Buku Kas Umum', '/segera/buku-kas-umum', 'keuangan', 6
  UNION ALL SELECT 'realisasi', 'Realisasi Anggaran', '/keuangan/realisasi', 'keuangan', 7
  UNION ALL SELECT 'perencanaan-pembangunan', 'Perencanaan Pembangunan', '/segera/perencanaan-pembangunan', 'pembangunan-aset', 1
  UNION ALL SELECT 'proyek-desa', 'Proyek Desa', '/segera/proyek-desa', 'pembangunan-aset', 3
  UNION ALL SELECT 'aset-desa', 'Aset Desa', '/segera/aset-desa', 'pembangunan-aset', 5
  UNION ALL SELECT 'mutasi-aset', 'Mutasi Aset', '/inventaris/mutasi', 'pembangunan-aset', 6
  UNION ALL SELECT 'laporan-aset', 'Laporan Aset', '/inventaris/laporan', 'pembangunan-aset', 7
  UNION ALL SELECT 'peta-wilayah', 'Peta Wilayah', '/segera/peta-wilayah', 'pertanahan', 2
  UNION ALL SELECT 'data-pertanahan', 'Data Pertanahan', '/segera/data-pertanahan', 'pertanahan', 3
  UNION ALL SELECT 'batas-wilayah', 'Batas Wilayah', '/segera/batas-wilayah', 'pertanahan', 4
  UNION ALL SELECT 'peta-penduduk', 'Peta Penduduk', '/segera/peta-penduduk', 'pertanahan', 5
  UNION ALL SELECT 'data-penerima-bantuan', 'Data Penerima Bantuan', '/segera/data-penerima-bantuan', 'satu-data', 2
  UNION ALL SELECT 'potensi', 'Data Potensi Desa', '/konten/potensi', 'satu-data', 4
  UNION ALL SELECT 'statistik-program-desa', 'Statistik Program Desa', '/segera/statistik-program-desa', 'satu-data', 5
  UNION ALL SELECT 'aspirasi-warga', 'Aspirasi Warga', '/segera/aspirasi-warga', 'layanan-mandiri', 2
  UNION ALL SELECT 'informasi-pelayanan', 'Informasi Pelayanan', '/pelayanan-publik/layanan', 'layanan-mandiri', 4
  UNION ALL SELECT 'grup-akses', 'Role & Hak Akses', '/pengaturan/grup-akses', 'pengaturan', 2
  UNION ALL SELECT 'pengaturan-sistem', 'Pengaturan Sistem', '/pengaturan/desa', 'pengaturan', 3
  UNION ALL SELECT 'integrasi', 'Integrasi', '/segera/integrasi', 'pengaturan', 4
  UNION ALL SELECT 'template-website', 'Template Website', '/segera/template-website', 'pengaturan', 5
  UNION ALL SELECT 'log-aktivitas', 'Log Aktivitas', '/pengaturan/pengguna/aktivitas', 'pengaturan', 6
) s
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = s.`slug`
);
--> statement-breakpoint
-- Grant role: administrator manage, role lain membaca submenu operasional.
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`,
       CASE WHEN r.`slug` = 'administrator' THEN 'manage' ELSE 'read' END,
       1,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` IN ('pembangunan-aset', 'data-pegawai', 'absensi', 'buku-administrasi-penduduk', 'buku-administrasi-pembangunan', 'buku-administrasi-lainnya', 'agenda-kegiatan', 'apbdes', 'pendapatan', 'belanja', 'pembiayaan', 'penatausahaan', 'buku-kas-umum', 'realisasi', 'perencanaan-pembangunan', 'proyek-desa', 'aset-desa', 'mutasi-aset', 'laporan-aset', 'peta-wilayah', 'data-pertanahan', 'batas-wilayah', 'peta-penduduk', 'data-penerima-bantuan', 'potensi', 'statistik-program-desa', 'aspirasi-warga', 'informasi-pelayanan')
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
-- Submenu pengaturan sensitif hanya untuk administrator.
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`, 'manage', 1, 1, 1, 1
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` IN ('grup-akses', 'pengaturan-sistem', 'integrasi', 'template-website', 'log-aktivitas')
  AND r.`slug` = 'administrator'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
-- Fitur paket: modul baru harus aktif agar tidak tersaring dari izin efektif.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, f.`slug`
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
JOIN (
  SELECT 'pembangunan-aset' AS `slug` UNION ALL
  SELECT 'data-pegawai' UNION ALL
  SELECT 'absensi' UNION ALL
  SELECT 'buku-administrasi-penduduk' UNION ALL
  SELECT 'buku-administrasi-pembangunan' UNION ALL
  SELECT 'buku-administrasi-lainnya' UNION ALL
  SELECT 'agenda-kegiatan' UNION ALL
  SELECT 'apbdes' UNION ALL
  SELECT 'pendapatan' UNION ALL
  SELECT 'belanja' UNION ALL
  SELECT 'pembiayaan' UNION ALL
  SELECT 'penatausahaan' UNION ALL
  SELECT 'buku-kas-umum' UNION ALL
  SELECT 'realisasi' UNION ALL
  SELECT 'perencanaan-pembangunan' UNION ALL
  SELECT 'proyek-desa' UNION ALL
  SELECT 'aset-desa' UNION ALL
  SELECT 'mutasi-aset' UNION ALL
  SELECT 'laporan-aset' UNION ALL
  SELECT 'peta-wilayah' UNION ALL
  SELECT 'data-pertanahan' UNION ALL
  SELECT 'batas-wilayah' UNION ALL
  SELECT 'peta-penduduk' UNION ALL
  SELECT 'data-penerima-bantuan' UNION ALL
  SELECT 'potensi' UNION ALL
  SELECT 'statistik-program-desa' UNION ALL
  SELECT 'aspirasi-warga' UNION ALL
  SELECT 'informasi-pelayanan' UNION ALL
  SELECT 'grup-akses' UNION ALL
  SELECT 'pengaturan-sistem' UNION ALL
  SELECT 'integrasi' UNION ALL
  SELECT 'template-website' UNION ALL
  SELECT 'log-aktivitas'
) f
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` x
    WHERE x.`plan_version_id` = v.`id` AND x.`module_slug` = f.`slug`
  );
