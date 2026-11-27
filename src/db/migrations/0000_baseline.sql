-- ===== 0000_baseline.sql =====
-- Fresh-install baseline: gabungan 0000-0007 menjadi satu migrasi tunggal.
-- Databases with the previous migration history must be reset before use.
-- Tenant roles, modules, permissions, and village admin accounts come from provisioning.
-- ===== 0000_baseline.sql =====
-- Fresh-install baseline. Databases with the previous migration history must be reset before use.
-- Tenant roles, modules, permissions, and village admin accounts come from provisioning.
CREATE TABLE `agenda_kegiatan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`judul` varchar(200) NOT NULL,
	`mulai` date NOT NULL,
	`selesai` date,
	`jam_mulai` time,
	`jam_selesai` time,
	`kategori` varchar(50) NOT NULL DEFAULT 'umum',
	`status` enum('rencana','berlangsung','selesai') NOT NULL DEFAULT 'rencana',
	`lokasi` varchar(200),
	`deskripsi` text,
	`tayang` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agenda_kegiatan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analisis_indikator` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kategori_id` int,
	`kode` varchar(20) NOT NULL,
	`nama` varchar(200) NOT NULL,
	`bobot` int NOT NULL DEFAULT 1,
	`keterangan` text,
	CONSTRAINT `analisis_indikator_id` PRIMARY KEY(`id`),
	CONSTRAINT `analisis_indikator_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `analisis_kategori` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(100) NOT NULL,
	`keterangan` text,
	CONSTRAINT `analisis_kategori_id` PRIMARY KEY(`id`),
	CONSTRAINT `analisis_kategori_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `anjungan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`deskripsi` text,
	`aktif` int DEFAULT 1,
	`urutan` int DEFAULT 0,
	`uuid` varchar(36),
	`ip_address` varchar(45),
	`mac_address` varchar(17),
	`ip_address_port_printer` varchar(100),
	`keyboard` int DEFAULT 1,
	`orientasi_layar` int DEFAULT 1,
	`permohonan_surat_tanpa_akun` int DEFAULT 0,
	`status` varchar(20) DEFAULT 'aktif',
	CONSTRAINT `anjungan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`hashed_key` varchar(255) NOT NULL,
	`prefix` varchar(16) NOT NULL,
	`rate_limit` int NOT NULL DEFAULT 100,
	`active` boolean NOT NULL DEFAULT true,
	`expires_at` datetime,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_hashed_key_uq` UNIQUE(`hashed_key`)
);
--> statement-breakpoint
CREATE TABLE `arsip` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kategori` varchar(100),
	`judul` varchar(200) NOT NULL,
	`berkas` varchar(255),
	`keterangan` text,
	CONSTRAINT `arsip_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int,
	`actor_id` varchar(36),
	`event` varchar(80) NOT NULL,
	`resource` varchar(80) NOT NULL,
	`resource_id` varchar(100),
	`ip_address` varchar(45),
	`user_agent` text,
	`details` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp,
	`refresh_token_expires_at` timestamp,
	`scope` text,
	`password` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_provider_account_uq` UNIQUE(`provider_id`,`account_id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_uq` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`username` varchar(100),
	`display_username` varchar(100),
	`village_id` int,
	`role_id` int,
	`active` boolean NOT NULL DEFAULT true,
	`last_login_at` timestamp,
	`must_change_pin` boolean NOT NULL DEFAULT true,
	`otp_login_aktif` boolean NOT NULL DEFAULT false,
	`two_factor_enabled` boolean NOT NULL DEFAULT false,
	`resident_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`),
	CONSTRAINT `users_username_uq` UNIQUE(`username`),
	CONSTRAINT `users_resident_uq` UNIQUE(`resident_id`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bantuan_peserta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`program_id` int NOT NULL,
	`resident_id` int,
	`family_id` int,
	`rtm_id` int,
	`kelompok_id` int,
	`card_number` varchar(60),
	`card_national_id` varchar(30),
	`card_name` varchar(100),
	`card_birth_place` varchar(100),
	`card_birth_date` date,
	`card_address` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bantuan_peserta_id` PRIMARY KEY(`id`),
	CONSTRAINT `bantuan_peserta_program_resident_uq` UNIQUE(`program_id`,`resident_id`),
	CONSTRAINT `bantuan_peserta_program_family_uq` UNIQUE(`program_id`,`family_id`),
	CONSTRAINT `bantuan_peserta_program_rtm_uq` UNIQUE(`program_id`,`rtm_id`),
	CONSTRAINT `bantuan_peserta_program_kelompok_uq` UNIQUE(`program_id`,`kelompok_id`)
);
--> statement-breakpoint
CREATE TABLE `bantuan_program` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`sasaran` int NOT NULL,
	`description` varchar(500),
	`start_date` date,
	`end_date` date,
	`asal_dana` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bantuan_program_id` PRIMARY KEY(`id`),
	CONSTRAINT `bantuan_program_village_slug_uq` UNIQUE(`village_id`,`slug`),
	CONSTRAINT `bantuan_program_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `bukti_pengiriman_notifikasi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`pengaduan_id` int NOT NULL,
	`metode` varchar(20) NOT NULL,
	`target` varchar(255) NOT NULL,
	`respons_provider` text,
	`sukses` boolean NOT NULL DEFAULT false,
	`pesan_error` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bukti_pengiriman_notifikasi_id` PRIMARY KEY(`id`),
	CONSTRAINT `bukti_pengiriman_pengaduan_metode_target_unique` UNIQUE(`pengaduan_id`,`metode`,`target`)
);
--> statement-breakpoint
CREATE TABLE `buku_tamu` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`instansi` varchar(200),
	`keperluan` text,
	`tanggal` date NOT NULL,
	`jam_masuk` time,
	`jam_keluar` time,
	`keterangan` text,
	CONSTRAINT `buku_tamu_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bumindes_kader` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(150) NOT NULL,
	`jabatan` varchar(150),
	`bidang` varchar(150),
	`alamat` varchar(255),
	`no_hp` varchar(30),
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bumindes_kader_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bumindes_pembangunan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tahun` int NOT NULL,
	`nama_kegiatan` varchar(255) NOT NULL,
	`lokasi` varchar(255),
	`volume` varchar(100),
	`sumber_dana` varchar(150),
	`biaya` decimal(19,2) NOT NULL DEFAULT '0.00',
	`pelaksana` varchar(150),
	`status` varchar(20) NOT NULL DEFAULT 'rencana',
	`tanggal_mulai` date,
	`tanggal_selesai` date,
	`hasil` text,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bumindes_pembangunan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bumindes_agenda` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`jenis` varchar(20) NOT NULL DEFAULT 'masuk',
	`tanggal` date NOT NULL,
	`nomor_surat` varchar(150),
	`asal_tujuan` varchar(255),
	`perihal` varchar(500) NOT NULL,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bumindes_agenda_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bumindes_aparat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(150) NOT NULL,
	`nip` varchar(30),
	`jabatan` varchar(150) NOT NULL,
	`tempat_lahir` varchar(100),
	`tanggal_lahir` date,
	`pendidikan` varchar(100),
	`nomor_sk_pengangkatan` varchar(100),
	`tanggal_pengangkatan` date,
	`nomor_sk_pemberhentian` varchar(100),
	`tanggal_pemberhentian` date,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bumindes_aparat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bumindes_peraturan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`jenis` varchar(40) NOT NULL DEFAULT 'peraturan_desa',
	`nomor` varchar(100) NOT NULL,
	`tahun` int,
	`tentang` varchar(500) NOT NULL,
	`tanggal_ditetapkan` date,
	`tanggal_diundangkan` date,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bumindes_peraturan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bumindes_tanah_kas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nomor_persil` varchar(50) NOT NULL,
	`asal` varchar(255),
	`luas` decimal(14,2) NOT NULL DEFAULT '0.00',
	`lokasi` varchar(255),
	`status` varchar(150),
	`nilai` decimal(19,2) NOT NULL DEFAULT '0.00',
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bumindes_tanah_kas_id` PRIMARY KEY(`id`),
	CONSTRAINT `bumindes_tanah_kas_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `bumindes_tanah_kas_mutasi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tanah_kas_id` int NOT NULL,
	`tanggal` date NOT NULL,
	`jenis` varchar(50) NOT NULL,
	`uraian` varchar(500) NOT NULL,
	`luas_perubahan` decimal(14,2),
	`nilai_perubahan` decimal(19,2),
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bumindes_tanah_kas_mutasi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bumindes_buku` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kode_buku` varchar(20) NOT NULL,
	`nama_buku` varchar(150) NOT NULL,
	`uraian` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bumindes_buku_id` PRIMARY KEY(`id`),
	CONSTRAINT `bumindes_buku_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `bumindes_item` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`buku_id` int NOT NULL,
	`nomor_urut` int NOT NULL DEFAULT 0,
	`tanggal` date,
	`uraian` varchar(500) NOT NULL,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bumindes_item_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `berita` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kategori_id` int,
	`penulis_id` varchar(36),
	`judul` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`ringkasan` varchar(500),
	`isi` text NOT NULL,
	`gambar` varchar(255),
	`dokumen` varchar(255),
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`terbit_pada` timestamp,
	`headline` boolean NOT NULL DEFAULT false,
	`slider` boolean NOT NULL DEFAULT false,
	`boleh_komentar` boolean NOT NULL DEFAULT true,
	`hit` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `berita_id` PRIMARY KEY(`id`),
	CONSTRAINT `berita_village_slug_unique` UNIQUE(`village_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `berita_kategori` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`aktif` boolean NOT NULL DEFAULT true,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `berita_kategori_id` PRIMARY KEY(`id`),
	CONSTRAINT `berita_kategori_village_slug_unique` UNIQUE(`village_id`,`slug`),
	CONSTRAINT `berita_kategori_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `dokumen_publik` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`kategori` varchar(50) NOT NULL DEFAULT 'informasi_publik',
	`jenis` varchar(50),
	`nomor` varchar(100),
	`tahun` int,
	`berkas` varchar(255),
	`tautan` varchar(500),
	`keterangan` text,
	`aktif` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dokumen_publik_id` PRIMARY KEY(`id`),
	CONSTRAINT `dokumen_publik_village_slug_unique` UNIQUE(`village_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `galeri_album` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(150) NOT NULL,
	`slug` varchar(150) NOT NULL,
	`keterangan` text,
	`kategori` varchar(80),
	`published_at` timestamp,
	`sampul` varchar(255),
	`aktif` boolean NOT NULL DEFAULT true,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `galeri_album_id` PRIMARY KEY(`id`),
	CONSTRAINT `galeri_album_village_slug_unique` UNIQUE(`village_id`,`slug`),
	CONSTRAINT `galeri_album_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `galeri_foto` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`album_id` int,
	`gambar` varchar(255) NOT NULL,
	`judul` varchar(150),
	`keterangan` text,
	`aktif` boolean NOT NULL DEFAULT true,
	`slider` boolean NOT NULL DEFAULT false,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `galeri_foto_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `halaman_statis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`judul` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`isi` text NOT NULL,
	`aktif` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `halaman_statis_id` PRIMARY KEY(`id`),
	CONSTRAINT `halaman_statis_village_slug_unique` UNIQUE(`village_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `jabatan_perangkat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`jenis` varchar(20) NOT NULL DEFAULT 'lainnya',
	`tupoksi` text,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jabatan_perangkat_id` PRIMARY KEY(`id`),
	CONSTRAINT `jabatan_perangkat_village_slug_unique` UNIQUE(`village_id`,`slug`),
	CONSTRAINT `jabatan_perangkat_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_publik` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`parent_id` int,
	`nama` varchar(50) NOT NULL,
	`link` varchar(500) NOT NULL,
	`link_tipe` varchar(20) NOT NULL DEFAULT 'internal',
	`aktif` boolean NOT NULL DEFAULT true,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_publik_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `perangkat_desa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`jabatan_id` int,
	`resident_id` int,
	`nama` varchar(100) NOT NULL,
	`gelar_depan` varchar(100),
	`gelar_belakang` varchar(100),
	`nip` varchar(25),
	`niap` varchar(30),
	`nik` varchar(16),
	`tag_id_card` varchar(30),
	`jenis_kelamin` varchar(10),
	`tempat_lahir` varchar(100),
	`tanggal_lahir` date,
	`pendidikan` varchar(100),
	`agama` varchar(50),
	`pangkat` varchar(50),
	`telepon` varchar(30),
	`email` varchar(150),
	`alamat` varchar(255),
	`nomor_sk_pengangkatan` varchar(100),
	`tanggal_pengangkatan` date,
	`nomor_sk_pemberhentian` varchar(100),
	`tanggal_pemberhentian` date,
	`atasan_id` int,
	`foto` varchar(255),
	`tanda_tangan` varchar(255),
	`penanda_tangan` boolean NOT NULL DEFAULT false,
	`status_pejabat` boolean NOT NULL DEFAULT false,
	`kehadiran` boolean NOT NULL DEFAULT true,
	`ttd_an` boolean NOT NULL DEFAULT false,
	`ttd_ub` boolean NOT NULL DEFAULT false,
	`bagan_tingkat` int,
	`bagan_offset` varchar(10),
	`bagan_layout` varchar(20),
	`bagan_warna` varchar(10),
	`media_sosial` json,
	`status` varchar(20) NOT NULL DEFAULT 'aktif',
	`periode` varchar(20),
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `perangkat_desa_id` PRIMARY KEY(`id`),
	CONSTRAINT `perangkat_desa_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `profil_desa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`visi` text,
	`misi` text,
	`sejarah` text,
	`sambutan` text,
	`koordinat` varchar(60),
	`map_tipe` varchar(20),
	`luas_wilayah` decimal(12,2),
	`batas_utara` varchar(150),
	`batas_selatan` varchar(150),
	`batas_timur` varchar(150),
	`batas_barat` varchar(150),
	`ketinggian` varchar(100),
	`suhu_rata_rata` varchar(100),
	`curah_hujan` varchar(100),
	`topografi` varchar(150),
	`jenis_tanah` varchar(150),
	`sumber_daya_alam` text,
	`flora_fauna` text,
	`rawan_bencana` varchar(255),
	`kearifan_lokal` text,
	`jenis_jaringan` varchar(150),
	`provider_internet` varchar(150),
	`cakupan_wilayah` text,
	`kecepatan_internet` varchar(100),
	`akses_publik` text,
	`status_desa` varchar(20),
	`lembaga_adat` varchar(150),
	`struktur_adat` varchar(255),
	`wilayah_adat` text,
	`peraturan_adat` text,
	`regulasi_penetapan_kampung_adat` varchar(255),
	`dokumen_regulasi_penetapan_kampung_adat` varchar(255),
	`batas_desa` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profil_desa_id` PRIMARY KEY(`id`),
	CONSTRAINT `profil_desa_village_unique` UNIQUE(`village_id`)
);
--> statement-breakpoint
CREATE TABLE `slider` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`gambar` varchar(255) NOT NULL,
	`judul` varchar(150),
	`keterangan` varchar(500),
	`tautan` varchar(255),
	`aktif` boolean NOT NULL DEFAULT true,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slider_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `widget` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`judul` varchar(100),
	`isi` text,
	`jenis` tinyint NOT NULL DEFAULT 1,
	`pengaturan` text,
	`aktif` boolean NOT NULL DEFAULT true,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `widget_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dokumen_desa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`jenis` varchar(50),
	`nomor` varchar(100),
	`judul` varchar(200) NOT NULL,
	`berkas` varchar(255),
	`keterangan` text,
	CONSTRAINT `dokumen_desa_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dokumen_warga` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int NOT NULL,
	`jenis` varchar(40) NOT NULL,
	`nama` varchar(200) NOT NULL,
	`berkas` text NOT NULL,
	`mime` varchar(100) NOT NULL,
	`nama_asli` varchar(255) NOT NULL,
	`sumber` varchar(20) NOT NULL DEFAULT 'warga',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dokumen_warga_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `domain_dns_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain_id` int NOT NULL,
	`status` varchar(20) NOT NULL,
	`addresses` text,
	`error` varchar(255),
	`checked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `domain_dns_checks_id` PRIMARY KEY(`id`),
	CONSTRAINT `domain_dns_checks_domain_id_unique` UNIQUE(`domain_id`)
);
--> statement-breakpoint
CREATE TABLE `domain_ssl_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain_id` int NOT NULL,
	`status` varchar(20) NOT NULL,
	`valid_from` timestamp,
	`valid_to` timestamp,
	`issuer` varchar(255),
	`error` varchar(255),
	`checked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `domain_ssl_checks_id` PRIMARY KEY(`id`),
	CONSTRAINT `domain_ssl_checks_domain_id_unique` UNIQUE(`domain_id`)
);
--> statement-breakpoint
CREATE TABLE `dtks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`rtm_id` int NOT NULL,
	`keluarga_id` int,
	`versi_kuisioner` enum('regsos_ek2022_k') NOT NULL DEFAULT 'regsos_ek2022_k',
	`status` enum('draf','terverifikasi') NOT NULL DEFAULT 'draf',
	`tanggal_pencacahan` date,
	`tanggal_pemeriksaan` date,
	`nama_petugas_pencacahan` varchar(100),
	`nama_responden` varchar(100),
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dtks_id` PRIMARY KEY(`id`),
	CONSTRAINT `dtks_village_rtm_versi_uq` UNIQUE(`village_id`,`rtm_id`,`versi_kuisioner`),
	CONSTRAINT `dtks_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `dtks_anggota` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`dtks_id` int NOT NULL,
	`penduduk_id` int NOT NULL,
	`hubungan_id` int,
	`status_anggota` varchar(30) DEFAULT 'aktif',
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dtks_anggota_id` PRIMARY KEY(`id`),
	CONSTRAINT `dtks_anggota_dtks_penduduk_uq` UNIQUE(`dtks_id`,`penduduk_id`)
);
--> statement-breakpoint
CREATE TABLE `dtks_lampiran` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`berkas` varchar(255) NOT NULL,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dtks_lampiran_id` PRIMARY KEY(`id`),
	CONSTRAINT `dtks_lampiran_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `dtks_pengaturan_program` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kode_program` varchar(50) NOT NULL,
	`nama_program` varchar(200) NOT NULL,
	`aktif` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dtks_pengaturan_program_id` PRIMARY KEY(`id`),
	CONSTRAINT `dtks_pengaturan_program_village_kode_uq` UNIQUE(`village_id`,`kode_program`)
);
--> statement-breakpoint
CREATE TABLE `dtks_ref_lampiran` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`dtks_id` int NOT NULL,
	`lampiran_id` int NOT NULL,
	CONSTRAINT `dtks_ref_lampiran_id` PRIMARY KEY(`id`),
	CONSTRAINT `dtks_ref_lampiran_dtks_lampiran_uq` UNIQUE(`dtks_id`,`lampiran_id`)
);
--> statement-breakpoint
CREATE TABLE `elections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`judul` varchar(200) NOT NULL,
	`status` enum('draf','aktif','selesai') NOT NULL DEFAULT 'draf',
	`tanggal` date NOT NULL,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `elections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_member_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`family_id` int,
	`resident_id` int,
	`resident_name` varchar(100) NOT NULL,
	`aksi` enum('added','removed','role_changed') NOT NULL,
	`relation_id` int,
	`relation_name` varchar(60),
	`actor_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_member_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `families` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`number` varchar(16) NOT NULL,
	`address` varchar(255),
	`region_id` int,
	`welfare_class` int,
	`card_printed_at` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `families_id` PRIMARY KEY(`id`),
	CONSTRAINT `families_village_number_uq` UNIQUE(`village_id`,`number`),
	CONSTRAINT `families_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `galeri_video` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`judul` varchar(150) NOT NULL,
	`keterangan` text,
	`url` varchar(500) NOT NULL,
	`provider` varchar(20) NOT NULL,
	`thumbnail` varchar(255),
	`aktif` boolean NOT NULL DEFAULT true,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `galeri_video_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `area` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(50) NOT NULL,
	`path` text,
	`ref_polygon` int,
	`foto` varchar(100),
	`desk` text,
	`enabled` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `area_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cdesa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nomor` varchar(50) NOT NULL,
	`nomor_persil` varchar(50),
	`nomor_sertifikat` varchar(50),
	`tanggal` date,
	`nama_pemegang` varchar(255),
	`luas` decimal(10,2) NOT NULL DEFAULT '0.00',
	`keterangan` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cdesa_id` PRIMARY KEY(`id`),
	CONSTRAINT `cdesa_village_nomor_uq` UNIQUE(`village_id`,`nomor`),
	CONSTRAINT `cdesa_village_id_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `cdesa_mutasi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`cdesa_id` int NOT NULL,
	`nomor` varchar(50) NOT NULL,
	`tanggal` date NOT NULL,
	`tipe` varchar(30) NOT NULL,
	`keterangan` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cdesa_mutasi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cdesa_rincian` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`cdesa_id` int NOT NULL,
	`nama` varchar(255),
	`alamat` text,
	`dllb` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cdesa_rincian_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `garis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(50) NOT NULL,
	`path` text,
	`ref_line` int,
	`foto` varchar(100),
	`desk` text,
	`enabled` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `garis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gis_simbol` (
	`id` int AUTO_INCREMENT NOT NULL,
	`simbol` varchar(40) NOT NULL,
	`desk` text,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `gis_simbol_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persil` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nomor` varchar(50) NOT NULL,
	`nomor_cdesa` varchar(50),
	`luas` decimal(10,2) NOT NULL DEFAULT '0.00',
	`status` varchar(30) NOT NULL DEFAULT 'milik',
	`path` text,
	`keterangan` text,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `persil_id` PRIMARY KEY(`id`),
	CONSTRAINT `persil_village_nomor_uq` UNIQUE(`village_id`,`nomor`)
);
--> statement-breakpoint
CREATE TABLE `point` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(50) NOT NULL,
	`simbol` varchar(50),
	`tipe` int DEFAULT 0,
	`parrent` int DEFAULT 1,
	`path` text,
	`enabled` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `point_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `polygon` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(50) NOT NULL,
	`simbol` varchar(50),
	`color` varchar(25),
	`tipe` int NOT NULL DEFAULT 0,
	`parrent` int DEFAULT 1,
	`enabled` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `polygon_id` PRIMARY KEY(`id`),
	CONSTRAINT `polygon_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `idm_indikator` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tahun` int NOT NULL,
	`kode` varchar(20) NOT NULL,
	`nama` varchar(200) NOT NULL,
	`skor` int DEFAULT 0,
	`kategori` varchar(50),
	`keterangan` text,
	CONSTRAINT `idm_indikator_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `idm_ringkasan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tahun` int NOT NULL,
	`skor_minimal` decimal(6,4),
	`target_status` varchar(50),
	`status_api` varchar(50),
	`skor_api` decimal(6,4),
	`penambahan` decimal(6,4),
	`disinkronkan_pada` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `idm_ringkasan_id` PRIMARY KEY(`id`),
	CONSTRAINT `idm_ringkasan_village_tahun_uq` UNIQUE(`village_id`,`tahun`)
);
--> statement-breakpoint
CREATE TABLE `idm_sdgs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tahun` int NOT NULL,
	`goal` int NOT NULL,
	`skor` int NOT NULL DEFAULT 0,
	`keterangan` text,
	CONSTRAINT `idm_sdgs_id` PRIMARY KEY(`id`),
	CONSTRAINT `idm_sdgs_village_tahun_goal_uq` UNIQUE(`village_id`,`tahun`,`goal`)
);
--> statement-breakpoint
CREATE TABLE `incoming_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`agenda_number` int NOT NULL DEFAULT 0,
	`received_date` varchar(10) NOT NULL,
	`letter_number` varchar(50) NOT NULL,
	`letter_date` varchar(10),
	`sender` varchar(150),
	`classification_id` int,
	`summary` varchar(255),
	`disposition` varchar(255),
	`archive_location` varchar(150),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incoming_letters_id` PRIMARY KEY(`id`),
	CONSTRAINT `incoming_letters_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `bulanan_anak` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`posyandu_id` int NOT NULL,
	`kia_id` int NOT NULL,
	`tanggal_periksa` date,
	`status_gizi` tinyint NOT NULL,
	`umur_bulan` tinyint NOT NULL,
	`status_tikar` tinyint NOT NULL,
	`pemberian_imunisasi_dasar` boolean NOT NULL DEFAULT false,
	`pemberian_imunisasi_campak` boolean,
	`pengukuran_berat_badan` boolean NOT NULL DEFAULT false,
	`berat_badan` float,
	`pengukuran_tinggi_badan` boolean NOT NULL DEFAULT false,
	`tinggi_badan` float,
	`konseling_gizi_ayah` boolean NOT NULL DEFAULT false,
	`konseling_gizi_ibu` boolean NOT NULL DEFAULT false,
	`kunjungan_rumah` boolean NOT NULL DEFAULT false,
	`air_bersih` boolean NOT NULL DEFAULT false,
	`kepemilikan_jamban` boolean NOT NULL DEFAULT false,
	`akta_lahir` boolean NOT NULL DEFAULT false,
	`jaminan_kesehatan` boolean NOT NULL DEFAULT false,
	`pengasuhan_paud` boolean NOT NULL DEFAULT false,
	`keterangan` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulanan_anak_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ibu_hamil` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`posyandu_id` int NOT NULL,
	`kia_id` int NOT NULL,
	`tanggal_periksa` date,
	`status_kehamilan` tinyint,
	`usia_kehamilan` tinyint,
	`tanggal_melahirkan` date,
	`pemeriksaan_kehamilan` boolean NOT NULL DEFAULT false,
	`konsumsi_pil_fe` boolean NOT NULL DEFAULT false,
	`butir_pil_fe` int,
	`pemeriksaan_nifas` boolean NOT NULL DEFAULT false,
	`konseling_gizi` boolean NOT NULL DEFAULT false,
	`kunjungan_rumah` boolean NOT NULL DEFAULT false,
	`akses_air_bersih` boolean NOT NULL DEFAULT false,
	`kepemilikan_jamban` boolean NOT NULL DEFAULT false,
	`jaminan_kesehatan` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ibu_hamil_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`no_kia` varchar(30) NOT NULL,
	`ibu_id` int NOT NULL,
	`anak_id` int,
	`hari_perkiraan_lahir` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kia_id` PRIMARY KEY(`id`),
	CONSTRAINT `kia_village_no_uq` UNIQUE(`village_id`,`no_kia`),
	CONSTRAINT `kia_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `posyandu` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(100) NOT NULL,
	`alamat` varchar(200),
	`nama_ketua` varchar(100),
	`nama_bidan` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `posyandu_id` PRIMARY KEY(`id`),
	CONSTRAINT `posyandu_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `sasaran_paud` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`posyandu_id` int NOT NULL,
	`kia_id` int NOT NULL,
	`tanggal_periksa` date,
	`kategori_usia` tinyint NOT NULL,
	`januari` tinyint NOT NULL DEFAULT 1,
	`februari` tinyint NOT NULL DEFAULT 1,
	`maret` tinyint NOT NULL DEFAULT 1,
	`april` tinyint NOT NULL DEFAULT 1,
	`mei` tinyint NOT NULL DEFAULT 1,
	`juni` tinyint NOT NULL DEFAULT 1,
	`juli` tinyint NOT NULL DEFAULT 1,
	`agustus` tinyint NOT NULL DEFAULT 1,
	`september` tinyint NOT NULL DEFAULT 1,
	`oktober` tinyint NOT NULL DEFAULT 1,
	`november` tinyint NOT NULL DEFAULT 1,
	`desember` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sasaran_paud_id` PRIMARY KEY(`id`),
	CONSTRAINT `sasaran_paud_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `layanan_publik` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(180) NOT NULL,
	`kategori` varchar(60) NOT NULL DEFAULT 'administrasi',
	`deskripsi` text,
	`persyaratan` text,
	`estimasi_hari` int NOT NULL DEFAULT 1,
	`biaya` int NOT NULL DEFAULT 0,
	`metode` varchar(80) NOT NULL DEFAULT 'online_dan_langsung',
	`aktif` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `layanan_publik_id` PRIMARY KEY(`id`),
	CONSTRAINT `layanan_publik_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `pengajuan_layanan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`layanan_id` int NOT NULL,
	`resident_id` int,
	`nomor_tiket` varchar(40) NOT NULL,
	`nama_pemohon` varchar(150) NOT NULL,
	`nik` varchar(16),
	`telepon` varchar(30),
	`email` varchar(150),
	`alamat` text,
	`keperluan` text NOT NULL,
	`lampiran` text,
	`status` varchar(24) NOT NULL DEFAULT 'diajukan',
	`catatan_petugas` text,
	`alasan_penolakan` text,
	`petugas_id` varchar(36),
	`diproses_pada` timestamp,
	`selesai_pada` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pengajuan_layanan_id` PRIMARY KEY(`id`),
	CONSTRAINT `pengajuan_layanan_village_ticket_uq` UNIQUE(`village_id`,`nomor_tiket`),
	CONSTRAINT `pengajuan_layanan_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `riwayat_pengajuan_layanan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`pengajuan_id` int NOT NULL,
	`status_sebelumnya` varchar(24),
	`status_baru` varchar(24) NOT NULL,
	`catatan` text,
	`actor_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `riwayat_pengajuan_layanan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pengajuan_layanan_berkas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`pengajuan_id` int NOT NULL,
	`nama_persyaratan` varchar(180) NOT NULL,
	`jenis` varchar(20) NOT NULL DEFAULT 'persyaratan',
	`jalur` varchar(500) NOT NULL,
	`nama_asli` varchar(255) NOT NULL,
	`mime` varchar(80) NOT NULL DEFAULT 'application/pdf',
	`ukuran` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pengajuan_layanan_berkas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pendapat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int,
	`session_key` varchar(64),
	`pengguna` varchar(100),
	`pilihan` tinyint NOT NULL,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pendapat_id` PRIMARY KEY(`id`),
	CONSTRAINT `pendapat_village_session_uq` UNIQUE(`village_id`,`session_key`)
);
--> statement-breakpoint
CREATE TABLE `anggota_grup_kontak` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`grup_id` int NOT NULL,
	`kontak_id` int NOT NULL,
	`peran` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anggota_grup_kontak_id` PRIMARY KEY(`id`),
	CONSTRAINT `anggota_grup_kontak_unique` UNIQUE(`grup_id`,`kontak_id`)
);
--> statement-breakpoint
CREATE TABLE `kontak` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int,
	`nama` varchar(100) NOT NULL,
	`telepon` varchar(20),
	`email` varchar(100),
	`telegram` varchar(50),
	`hubung_warga` varchar(50) DEFAULT 'Telegram',
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kontak_id` PRIMARY KEY(`id`),
	CONSTRAINT `kontak_village_id_uq` UNIQUE(`village_id`,`id`),
	CONSTRAINT `kontak_village_telepon_uq` UNIQUE(`village_id`,`telepon`),
	CONSTRAINT `kontak_village_telegram_uq` UNIQUE(`village_id`,`telegram`),
	CONSTRAINT `kontak_village_email_uq` UNIQUE(`village_id`,`email`)
);
--> statement-breakpoint
CREATE TABLE `kontak_grup` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama_grup` varchar(50) NOT NULL,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kontak_grup_id` PRIMARY KEY(`id`),
	CONSTRAINT `kontak_grup_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `mailbox_pesan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`arah` varchar(10) NOT NULL,
	`alamat` varchar(255) NOT NULL,
	`subjek` varchar(255),
	`isi` text NOT NULL,
	`dibaca` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`webhook_event_id` varchar(128),
	CONSTRAINT `mailbox_pesan_id` PRIMARY KEY(`id`),
	CONSTRAINT `mailbox_pesan_village_webhook_event_uq` UNIQUE(`village_id`,`webhook_event_id`)
);
--> statement-breakpoint
CREATE TABLE `lembaga_anggota` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`lembaga_id` int NOT NULL,
	`resident_id` int,
	`nama` varchar(150) NOT NULL,
	`nomor_anggota` varchar(20),
	`jabatan` varchar(100),
	`nomor_sk_jabatan` varchar(255),
	`nomor_sk_pengangkatan` varchar(255),
	`tanggal_sk_pengangkatan` date,
	`nomor_sk_pemberhentian` varchar(255),
	`tanggal_sk_pemberhentian` date,
	`periode` varchar(100),
	`keterangan` varchar(300),
	`foto` varchar(255),
	`periode_mulai` date,
	`periode_selesai` date,
	`aktif` boolean NOT NULL DEFAULT true,
	`tampil_publik` boolean NOT NULL DEFAULT false,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lembaga_anggota_id` PRIMARY KEY(`id`),
	CONSTRAINT `lembaga_anggota_village_lembaga_nomor_uq` UNIQUE(`village_id`,`lembaga_id`,`nomor_anggota`)
);
--> statement-breakpoint
CREATE TABLE `lembaga_desa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(150) NOT NULL,
	`kode` varchar(16),
	`jenis` varchar(50) NOT NULL DEFAULT 'lainnya',
	`master_id` int,
	`deskripsi` text,
	`tugas_fungsi` text,
	`dasar_hukum` varchar(255),
	`no_sk_pendirian` varchar(255),
	`ketua_resident_id` int,
	`logo` varchar(255),
	`masa_bakti_mulai` date,
	`masa_bakti_selesai` date,
	`status` varchar(20) NOT NULL DEFAULT 'aktif',
	`tampil_publik` boolean NOT NULL DEFAULT false,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lembaga_desa_id` PRIMARY KEY(`id`),
	CONSTRAINT `lembaga_desa_village_id_uq` UNIQUE(`village_id`,`id`),
	CONSTRAINT `lembaga_desa_village_kode_uq` UNIQUE(`village_id`,`kode`)
);
--> statement-breakpoint
CREATE TABLE `lembaga_master` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(50) NOT NULL,
	`deskripsi` text,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lembaga_master_id` PRIMARY KEY(`id`),
	CONSTRAINT `lembaga_master_village_nama_uq` UNIQUE(`village_id`,`nama`),
	CONSTRAINT `lembaga_master_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `pemerintahan_dokumen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`perangkat_id` int,
	`lembaga_id` int,
	`judul` varchar(180) NOT NULL,
	`nomor` varchar(100),
	`tanggal` date,
	`berkas` varchar(255) NOT NULL,
	`tampil_publik` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pemerintahan_dokumen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `perangkat_riwayat_jabatan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`perangkat_id` int NOT NULL,
	`jabatan` varchar(150) NOT NULL,
	`nomor_sk` varchar(100),
	`mulai` date,
	`selesai` date,
	`keterangan` text,
	`tampil_publik` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `perangkat_riwayat_jabatan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `potensi_desa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kategori` varchar(40) NOT NULL,
	`judul` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`ringkasan` varchar(500),
	`deskripsi` text,
	`gambar` varchar(255),
	`lokasi` varchar(200),
	`kontak` varchar(150),
	`unggulan` boolean NOT NULL DEFAULT false,
	`aktif` boolean NOT NULL DEFAULT false,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `potensi_desa_id` PRIMARY KEY(`id`),
	CONSTRAINT `potensi_desa_village_slug_uq` UNIQUE(`village_id`,`slug`),
	CONSTRAINT `potensi_desa_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `potensi_indikator` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`potensi_id` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`nilai` varchar(100) NOT NULL,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `potensi_indikator_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventaris` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kategori_id` int,
	`nomor_inventaris` varchar(50),
	`nama_barang` varchar(200) NOT NULL,
	`kode_barang` varchar(50),
	`merk` varchar(100),
	`tipe` varchar(100),
	`spesifikasi` text,
	`jumlah` decimal(12,2) NOT NULL DEFAULT '1',
	`satuan` varchar(20) DEFAULT 'buah',
	`harga_satuan` decimal(15,2),
	`nilai_akhir` decimal(15,2),
	`akumulasi_penyusutan` decimal(15,2) NOT NULL DEFAULT '0',
	`umur_manfaat_bulan` int,
	`nilai_residu` decimal(15,2) NOT NULL DEFAULT '0',
	`tanggal_mulai_penyusutan` date,
	`tahun_pembelian` int,
	`tanggal_pembelian` date,
	`asal` enum('pembelian','hibah','bantuan_pemerintah','sumbangan','lainnya'),
	`donatur` varchar(150),
	`kondisi` enum('baik','rusak_ringan','rusak_berat','dalam_perbaikan') NOT NULL DEFAULT 'baik',
	`lokasi` varchar(150),
	`keterangan` text,
	`penanggung_jawab` varchar(150),
	`jabatan_penanggung_jawab` varchar(100),
	`telepon_penanggung_jawab` varchar(30),
	`is_deleted` boolean NOT NULL DEFAULT false,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventaris_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventaris_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `inventaris_dokumen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`inventaris_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`nama_file` varchar(255) NOT NULL,
	`mime` varchar(100) NOT NULL,
	`ukuran` int NOT NULL,
	`jalur_media` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventaris_dokumen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventaris_kategori` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kode` varchar(20) NOT NULL,
	`nama` varchar(150) NOT NULL,
	`golongan` enum('tanah','gedung_bangunan','jalan_irigasi_jaringan','peralatan_mesin','aset_lainnya','konstruksi_dalam_pengerjaan') NOT NULL,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventaris_kategori_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventaris_kategori_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `inventaris_mutasi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`inventaris_id` int NOT NULL,
	`jenis` enum('pindah','rusak','hapus','perbaikan') NOT NULL,
	`status` enum('diajukan','disetujui','ditolak') NOT NULL DEFAULT 'diajukan',
	`tanggal_mutasi` date NOT NULL,
	`lokasi_baru` varchar(150),
	`kondisi_baru` enum('baik','rusak_ringan','rusak_berat','dalam_perbaikan'),
	`jumlah_mutasi` decimal(12,2) DEFAULT '1',
	`alasan` text,
	`keterangan` text,
	`diajukan_oleh` varchar(150),
	`diajukan_oleh_id` varchar(50),
	`verifikasi_oleh` varchar(150),
	`verifikasi_sekdes` varchar(150),
	`verifikasi_kades` varchar(150),
	`log_verifikasi` text,
	`catatan_verifikasi` text,
	`disetujui_oleh` varchar(150),
	`tanggal_persetujuan` timestamp,
	`catatan_penolakan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventaris_mutasi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventaris_pemeliharaan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`inventaris_id` int NOT NULL,
	`jenis` varchar(100) NOT NULL,
	`tanggal_rencana` date NOT NULL,
	`tanggal_selesai` date,
	`status` enum('terjadwal','dalam_proses','selesai','dibatalkan') NOT NULL DEFAULT 'terjadwal',
	`kondisi_setelah` enum('baik','rusak_ringan','rusak_berat','dalam_perbaikan'),
	`biaya` decimal(15,2) NOT NULL DEFAULT '0',
	`pelaksana` varchar(150),
	`deskripsi` text,
	`hasil` text,
	`is_deleted` boolean NOT NULL DEFAULT false,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventaris_pemeliharaan_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventaris_pemeliharaan_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `inventaris_pemeliharaan_riwayat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`pemeliharaan_id` int NOT NULL,
	`inventaris_id` int NOT NULL,
	`aksi` enum('dibuat','diperbarui','dihapus') NOT NULL,
	`status_sebelum` enum('terjadwal','dalam_proses','selesai','dibatalkan'),
	`status_sesudah` enum('terjadwal','dalam_proses','selesai','dibatalkan'),
	`ringkasan` text,
	`dilakukan_oleh` varchar(150) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventaris_pemeliharaan_riwayat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventaris_penanggung_jawab_riwayat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`inventaris_id` int NOT NULL,
	`nama_sebelum` varchar(150),
	`jabatan_sebelum` varchar(100),
	`telepon_sebelum` varchar(30),
	`nama_sesudah` varchar(150),
	`jabatan_sesudah` varchar(100),
	`telepon_sesudah` varchar(30),
	`diubah_oleh` varchar(150) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventaris_penanggung_jawab_riwayat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keuangan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`template_uuid` varchar(20) NOT NULL,
	`tahun` int NOT NULL,
	`anggaran` decimal(65,2) NOT NULL DEFAULT '0.00',
	`realisasi` decimal(65,2) NOT NULL DEFAULT '0.00',
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keuangan_id` PRIMARY KEY(`id`),
	CONSTRAINT `keuangan_village_tahun_uuid_unique` UNIQUE(`village_id`,`tahun`,`template_uuid`)
);
--> statement-breakpoint
CREATE TABLE `keuangan_jurnal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tahun` int NOT NULL,
	`tanggal` date NOT NULL,
	`kode_rekening` varchar(50) NOT NULL,
	`uraian` text NOT NULL,
	`debet` decimal(19,2) NOT NULL DEFAULT '0.00',
	`kredit` decimal(19,2) NOT NULL DEFAULT '0.00',
	`sumber` varchar(20) NOT NULL DEFAULT 'manual',
	`referensi` varchar(255),
	`created_by` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keuangan_jurnal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keuangan_laporan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tipe` varchar(40) NOT NULL,
	`judul` varchar(255) NOT NULL,
	`tahun` int NOT NULL,
	`semester` int NOT NULL,
	`nama_file` varchar(255) NOT NULL,
	`jalur_file` varchar(255) NOT NULL,
	`ukuran_file` int NOT NULL DEFAULT 0,
	`diserahkan_pada` timestamp,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keuangan_laporan_id` PRIMARY KEY(`id`),
	CONSTRAINT `keuangan_laporan_village_tahun_semester_unique` UNIQUE(`village_id`,`tipe`,`tahun`,`semester`)
);
--> statement-breakpoint
CREATE TABLE `keuangan_saldo_bank` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tahun` int NOT NULL,
	`rekening_bank` varchar(50) NOT NULL,
	`nama_bank` varchar(100) NOT NULL,
	`saldo_awal` decimal(19,2) NOT NULL DEFAULT '0.00',
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keuangan_saldo_bank_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_saldo_bank` UNIQUE(`village_id`,`tahun`,`rekening_bank`)
);
--> statement-breakpoint
CREATE TABLE `keuangan_template` (
	`uuid` varchar(20) NOT NULL,
	`parent_uuid` varchar(20),
	`uraian` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keuangan_template_uuid` PRIMARY KEY(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `keuangan_transaksi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`template_uuid` varchar(20),
	`keterangan` varchar(255) NOT NULL,
	`jumlah` decimal(65,2) NOT NULL DEFAULT '0.00',
	`jenis` enum('pendapatan','belanja') NOT NULL,
	`tanggal` timestamp NOT NULL DEFAULT (now()),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keuangan_transaksi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keuangan_triwulan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`template_uuid` varchar(20) NOT NULL,
	`tahun` int NOT NULL,
	`tw1` decimal(65,2) NOT NULL DEFAULT '0.00',
	`tw2` decimal(65,2) NOT NULL DEFAULT '0.00',
	`tw3` decimal(65,2) NOT NULL DEFAULT '0.00',
	`tw4` decimal(65,2) NOT NULL DEFAULT '0.00',
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keuangan_triwulan_id` PRIMARY KEY(`id`),
	CONSTRAINT `keuangan_triwulan_village_tahun_uuid_unique` UNIQUE(`village_id`,`tahun`,`template_uuid`)
);
--> statement-breakpoint
CREATE TABLE `laporan_penduduk` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`judul` varchar(255) NOT NULL,
	`tahun` int NOT NULL,
	`bulan` int NOT NULL,
	`nama_file` varchar(255) NOT NULL,
	`jalur_file` varchar(255) NOT NULL,
	`ukuran_file` int NOT NULL DEFAULT 0,
	`kirim` timestamp,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `laporan_penduduk_id` PRIMARY KEY(`id`),
	CONSTRAINT `laporan_penduduk_village_tahun_bulan_uq` UNIQUE(`village_id`,`tahun`,`bulan`)
);
--> statement-breakpoint
CREATE TABLE `kelompok` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`type` varchar(20) NOT NULL,
	`category_id` int,
	`code` varchar(50),
	`decree_number` varchar(100),
	`description` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kelompok_id` PRIMARY KEY(`id`),
	CONSTRAINT `kelompok_village_slug_uq` UNIQUE(`village_id`,`slug`),
	CONSTRAINT `kelompok_village_type_code_uq` UNIQUE(`village_id`,`code`),
	CONSTRAINT `kelompok_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `kelompok_anggota` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kelompok_id` int NOT NULL,
	`resident_id` int NOT NULL,
	`position` int NOT NULL,
	`member_number` varchar(50),
	`decree_number` varchar(100),
	`keterangan` varchar(300),
	`tampil_publik` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kelompok_anggota_id` PRIMARY KEY(`id`),
	CONSTRAINT `kelompok_anggota_kelompok_resident_uq` UNIQUE(`kelompok_id`,`resident_id`)
);
--> statement-breakpoint
CREATE TABLE `kelompok_master` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` varchar(20) NOT NULL,
	`description` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kelompok_master_id` PRIMARY KEY(`id`),
	CONSTRAINT `kelompok_master_village_name_uq` UNIQUE(`village_id`,`name`,`type`),
	CONSTRAINT `kelompok_master_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `letter_classifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `letter_classifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `letter_classifications_village_code_unique` UNIQUE(`village_id`,`code`),
	CONSTRAINT `letter_classifications_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `letter_dinas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`letter_number` varchar(100) NOT NULL,
	`letter_date` varchar(10) NOT NULL,
	`recipient` varchar(150),
	`recipient_address` varchar(255),
	`subject` varchar(200) NOT NULL,
	`content` text,
	`classification_id` int,
	`archive_file` varchar(255),
	`archive_location` varchar(150),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `letter_dinas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `letter_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `letter_requirements_id` PRIMARY KEY(`id`),
	CONSTRAINT `letter_requirements_village_name_unique` UNIQUE(`village_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `letter_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(150) NOT NULL,
	`classification_id` int,
	`template_body` text NOT NULL,
	`template_body_alt` text,
	`form_isian` text,
	`kode_isian` text,
	`syarat_surat` text,
	`requires_resident` boolean NOT NULL DEFAULT true,
	`is_active` boolean NOT NULL DEFAULT true,
	`number_format` varchar(100) NOT NULL DEFAULT '[kode_surat]/[nomor]/[kode_desa]/[tahun]',
	`format_nomor_global` tinyint DEFAULT 1,
	`validity_months` int NOT NULL DEFAULT 1,
	`satuan_masa_berlaku` varchar(15) DEFAULT 'M',
	`sort_order` int NOT NULL DEFAULT 0,
	`qr_code` boolean,
	`qr_code_tte` boolean,
	`logo_garuda` boolean,
	`kecamatan` boolean,
	`orientasi` varchar(10),
	`ukuran` varchar(10),
	`margin` text,
	`header` int DEFAULT 1,
	`footer` int DEFAULT 1,
	`sumber_penduduk_berulang` boolean,
	`template_variant` varchar(50),
	`layout_config` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `letter_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `letter_types_village_code_unique` UNIQUE(`village_id`,`code`),
	CONSTRAINT `letter_types_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`type_id` int NOT NULL,
	`resident_id` int,
	`type_name` varchar(150) NOT NULL,
	`number` varchar(50),
	`sequence` int NOT NULL DEFAULT 0,
	`status` enum('draft','verifikasi','issued','cancelled') NOT NULL DEFAULT 'draft',
	`letter_date` varchar(10) NOT NULL,
	`year` int NOT NULL,
	`purpose` varchar(255),
	`content` text,
	`isi_surat` text,
	`nilai_isian` text,
	`verifikasi_operator` boolean,
	`verifikasi_sekdes` boolean,
	`verifikasi_kades` boolean,
	`log_verifikasi` varchar(100),
	`catatan_verifikasi` text,
	`tte` boolean,
	`tte_file` varchar(255),
	`urls_id` int,
	`verification_token` varchar(64),
	`verification_token_hash` varchar(64),
	`pemohon` varchar(200),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`issued_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `letters_id` PRIMARY KEY(`id`),
	CONSTRAINT `letters_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `letter_number_archive` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`letter_id` int,
	`number` varchar(50) NOT NULL,
	`sequence` int NOT NULL,
	`year` int NOT NULL,
	`type_id` int NOT NULL,
	`classification_id` int,
	`type_name` varchar(150) NOT NULL,
	`issued_at` timestamp NOT NULL,
	CONSTRAINT `letter_number_archive_id` PRIMARY KEY(`id`),
	CONSTRAINT `letter_number_archive_village_number_uq` UNIQUE(`village_id`,`number`),
	CONSTRAINT `letter_number_archive_letter_uq` UNIQUE(`letter_id`)
);
--> statement-breakpoint
CREATE TABLE `outgoing_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`agenda_number` int NOT NULL DEFAULT 0,
	`letter_number` varchar(50) NOT NULL,
	`letter_date` varchar(10) NOT NULL,
	`recipient` varchar(150),
	`classification_id` int,
	`summary` varchar(255),
	`sent_date` varchar(10),
	`archive_location` varchar(150),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outgoing_letters_id` PRIMARY KEY(`id`),
	CONSTRAINT `outgoing_letters_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `pembangunan_dokumentasi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`proyek_id` int NOT NULL,
	`gambar` varchar(255) NOT NULL,
	`judul` varchar(150),
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pembangunan_dokumentasi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pembangunan_proyek` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`judul` varchar(200) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`deskripsi` text,
	`lokasi` varchar(200),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`tahun_anggaran` int NOT NULL,
	`sumber_dana` varchar(40),
	`anggaran` decimal(15,2),
	`volume` decimal(12,2),
	`satuan` varchar(30),
	`pelaksana` varchar(200),
	`mulai` date,
	`selesai` date,
	`status` varchar(20) NOT NULL DEFAULT 'rencana',
	`progres` tinyint NOT NULL DEFAULT 0,
	`hasil` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pembangunan_proyek_id` PRIMARY KEY(`id`),
	CONSTRAINT `pembangunan_proyek_village_slug_uq` UNIQUE(`village_id`,`slug`),
	CONSTRAINT `pembangunan_proyek_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `pengaduan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nomor_tiket` varchar(40) NOT NULL,
	`kategori` varchar(30) NOT NULL DEFAULT 'umum',
	`judul` varchar(200) NOT NULL,
	`isi` text NOT NULL,
	`nama_pelapor` varchar(100) NOT NULL,
	`nik` varchar(16),
	`telepon` varchar(30),
	`email` varchar(100),
	`alamat` varchar(255),
	`lampiran` varchar(255),
	`status` varchar(20) NOT NULL DEFAULT 'baru',
	`tanggapan` text,
	`petugas_id` varchar(36),
	`ditanggapi_pada` timestamp,
	`publik` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pengaduan_id` PRIMARY KEY(`id`),
	CONSTRAINT `pengaduan_village_tiket_uq` UNIQUE(`village_id`,`nomor_tiket`),
	CONSTRAINT `pengaduan_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `permohonan_surat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int NOT NULL,
	`letter_type_id` int NOT NULL,
	`letter_id` int,
	`no_antrian` varchar(30),
	`status` int NOT NULL DEFAULT 1,
	`isian_form` text,
	`syarat` text,
	`no_hp_aktif` varchar(30),
	`keterangan` text,
	`alasan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permohonan_surat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int,
	`slug` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`url` varchar(255),
	`icon` varchar(100) DEFAULT '',
	`is_group` boolean NOT NULL DEFAULT false,
	`is_hidden` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int DEFAULT 0,
	`parent_id` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `modules_village_slug_uq` UNIQUE(`village_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role_id` int NOT NULL,
	`module_id` int NOT NULL,
	`access` enum('read','write','manage') NOT NULL,
	`can_read` boolean NOT NULL DEFAULT false,
	`can_create` boolean NOT NULL DEFAULT false,
	`can_update` boolean NOT NULL DEFAULT false,
	`can_delete` boolean NOT NULL DEFAULT false,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_permissions_role_module_uq` UNIQUE(`role_id`,`module_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int,
	`name` varchar(50) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`is_system` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_village_slug_uq` UNIQUE(`village_id`,`slug`),
	CONSTRAINT `roles_village_name_uq` UNIQUE(`village_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `blood_types` (
	`id` int NOT NULL,
	`name` varchar(20) NOT NULL,
	CONSTRAINT `blood_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `citizenships` (
	`id` int NOT NULL,
	`name` varchar(50) NOT NULL,
	CONSTRAINT `citizenships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `educations` (
	`id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `educations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_relations` (
	`id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `family_relations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marital_statuses` (
	`id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `marital_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occupations` (
	`id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `occupations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `religions` (
	`id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `religions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`dusun` varchar(100),
	`rw` varchar(10),
	`rt` varchar(10),
	`kepala` varchar(100),
	`kepala_resident_id` int,
	`koordinat` varchar(60),
	`path` text,
	`zoom` int,
	`map_tipe` varchar(20),
	`warna` varchar(25),
	`border` varchar(25),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regions_id` PRIMARY KEY(`id`),
	CONSTRAINT `regions_village_dusun_rw_rt_uq` UNIQUE(`village_id`,`dusun`,`rw`,`rt`),
	CONSTRAINT `regions_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `residents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`national_id` varchar(16),
	`name` varchar(100) NOT NULL,
	`gender` enum('male','female') NOT NULL,
	`birth_place` varchar(100),
	`birth_date` date,
	`ktp_el` enum('belum','ktpEl','kia'),
	`status_rekam` enum('belumWajib','belumRekam','sudahRekam','cardPrinted','printReadyRecord','cardShipped','sentForCardPrinting','cardIssued'),
	`id_card_tag` varchar(17),
	`ktp_issued_place` varchar(150),
	`ktp_issued_date` date,
	`previous_family_number` varchar(30),
	`arrival_purpose` text,
	`birth_time` varchar(5),
	`birth_place_type` enum('hospital','puskesmas','polindes','home','other'),
	`birth_type` enum('single','twin2','twin3','twin4'),
	`birth_child_number` int,
	`birth_assistant` enum('doctor','midwifeNurse','traditional','other'),
	`birth_weight_gram` int,
	`birth_length_cm` int,
	`family_id` int,
	`rtm_id` int,
	`rtm_level` int,
	`religion_id` int,
	`education_id` int,
	`education_sedang_id` int,
	`occupation_id` int,
	`migrant_worker` varchar(100),
	`marital_status_id` int,
	`family_relation_id` int,
	`blood_type_id` int,
	`citizenship_id` int,
	`origin_country` varchar(10),
	`adat` varchar(150),
	`marga` varchar(150),
	`residence_status` enum('permanent','temporary') NOT NULL DEFAULT 'permanent',
	`life_status` enum('alive','deceased','moved','missing','departed','invalid') NOT NULL DEFAULT 'alive',
	`region_id` int,
	`address` varchar(255),
	`previous_address` varchar(200),
	`current_address` varchar(200),
	`latitude` varchar(30),
	`longitude` varchar(30),
	`phone` varchar(30),
	`email` varchar(50),
	`telegram` varchar(100),
	`contact_method` enum('sms','email','telegram'),
	`father_name` varchar(100),
	`mother_name` varchar(100),
	`father_national_id` varchar(16),
	`mother_national_id` varchar(16),
	`birth_certificate_number` varchar(40),
	`marriage_certificate_number` varchar(40),
	`marriage_date` date,
	`divorce_certificate_number` varchar(40),
	`divorce_date` date,
	`passport_number` varchar(45),
	`passport_expiry_date` date,
	`kitas_number` varchar(45),
	`ethnicity` varchar(150),
	`disability` enum('physical','blind','deafSpeech','mental','physicalMental','other','none'),
	`chronic_illness` enum('heart','liver','lungs','cancer','stroke','diabetes','kidney','malaria','leprosy','hivAids','mentalDisorder','tuberculosis','asthma','zoonotic','none'),
	`kb_method` enum('pill','iud','injection','condom','implant','femaleSterilization','maleSterilization','other','none'),
	`pregnancy_status` enum('pregnant','notPregnant'),
	`insurance` enum('none','bpjsPbi','bpjsNonPbi','bpjsRegional','other'),
	`insurance_number` varchar(100),
	`insurance_status` enum('active','inactive'),
	`bpjs_employment_number` varchar(100),
	`literacy` enum('latin','regional','arab','arabLatin','arabRegional','arabLatinRegional'),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `residents_id` PRIMARY KEY(`id`),
	CONSTRAINT `residents_village_national_id_uq` UNIQUE(`village_id`,`national_id`),
	CONSTRAINT `residents_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `resident_mutations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int,
	`type` enum('birth','death','move_out','move_in','missing','change') NOT NULL,
	`event_date` date NOT NULL,
	`reported_at` timestamp NOT NULL DEFAULT (now()),
	`actor_id` varchar(36),
	`reason` varchar(255),
	`notes` text,
	`reference_no` varchar(100),
	`from_region_id` int,
	`to_region_id` int,
	`from_address` varchar(255),
	`to_address` varchar(255),
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resident_mutations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rtm` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`number` varchar(32) NOT NULL,
	`address` varchar(255),
	`region_id` int,
	`kelas_sosial` int,
	`bdt` varchar(30),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rtm_id` PRIMARY KEY(`id`),
	CONSTRAINT `rtm_village_number_uq` UNIQUE(`village_id`,`number`),
	CONSTRAINT `rtm_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `suplemen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`sasaran` int NOT NULL DEFAULT 1,
	`keterangan` text,
	`form_isian` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suplemen_id` PRIMARY KEY(`id`),
	CONSTRAINT `suplemen_village_slug_uq` UNIQUE(`village_id`,`slug`),
	CONSTRAINT `suplemen_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `suplemen_terdata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`id_suplemen` int NOT NULL,
	`penduduk_id` int,
	`keluarga_id` int,
	`data_form_isian` json,
	`keterangan` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suplemen_terdata_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`judul` varchar(200) NOT NULL,
	`deskripsi` text,
	`sasaran` varchar(200),
	`mulai` date,
	`selesai` date,
	`aktif` int DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_id` PRIMARY KEY(`id`),
	CONSTRAINT `survey_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_jawaban` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`responden_id` int NOT NULL,
	`soal_id` int NOT NULL,
	`jawaban` text,
	CONSTRAINT `survey_jawaban_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_responden` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`survey_id` int NOT NULL,
	`nama` varchar(150),
	`nik` varchar(16),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_responden_id` PRIMARY KEY(`id`),
	CONSTRAINT `survey_responden_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_soal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`survey_id` int NOT NULL,
	`pertanyaan` text NOT NULL,
	`tipe` varchar(20) DEFAULT 'text',
	`pilihan` text,
	`bobot` int NOT NULL DEFAULT 1,
	`skor_pilihan` text,
	`indikator_id` int,
	`urutan` int DEFAULT 0,
	CONSTRAINT `survey_soal_id` PRIMARY KEY(`id`),
	CONSTRAINT `survey_soal_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `theme` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`slug` varchar(50) NOT NULL,
	`nama` varchar(100) NOT NULL,
	`versi` varchar(20) NOT NULL DEFAULT '1.0.0',
	`sumber` varchar(20) NOT NULL DEFAULT 'bawaan',
	`aktif` boolean NOT NULL DEFAULT true,
	`opsi` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `theme_id` PRIMARY KEY(`id`),
	CONSTRAINT `theme_village_slug_unique` UNIQUE(`village_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `tenant_domain_tombstones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` varchar(255) NOT NULL,
	`village_id` int NOT NULL,
	`purged_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenant_domain_tombstones_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_domain_tombstones_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `tenant_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`dibuat_oleh` varchar(36) NOT NULL,
	`berkas` varchar(255) NOT NULL,
	`ukuran_byte` int NOT NULL DEFAULT 0,
	`jumlah_baris` int NOT NULL DEFAULT 0,
	`dibuat_pada` timestamp NOT NULL DEFAULT (now()),
	`kedaluwarsa_pada` timestamp NOT NULL,
	CONSTRAINT `tenant_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_purge_archive` (
	`village_id` int NOT NULL,
	`ringkasan` text NOT NULL,
	`dibuat_oleh` varchar(36) NOT NULL,
	`dibuat_pada` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenant_purge_archive_village_id` PRIMARY KEY(`village_id`)
);
--> statement-breakpoint
CREATE TABLE `village_domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`domain` varchar(255) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `village_domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `village_domains_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `villages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100),
	`code` varchar(10),
	`bps_code` varchar(10),
	`slug` varchar(60),
	`postal_code` varchar(5),
	`district` varchar(100),
	`district_code` varchar(8),
	`camat_name` varchar(100),
	`camat_nip` varchar(25),
	`regency` varchar(100),
	`regency_code` varchar(4),
	`province` varchar(100),
	`province_code` varchar(2),
	`logo` varchar(255),
	`office_photo` varchar(255),
	`signature` varchar(255),
	`stamp` varchar(255),
	`domain` varchar(255),
	`active` boolean NOT NULL DEFAULT true,
	`nonaktif_sejak` timestamp,
	`purged_at` timestamp,
	`kuota_media_mb` int,
	`head_name` varchar(100),
	`head_nip` varchar(25),
	`penomoran_surat` tinyint NOT NULL DEFAULT 2,
	`office_address` varchar(255),
	`email` varchar(100),
	`phone` varchar(30),
	`website` varchar(255),
	`operator_phone` varchar(30),
	`contact_name` varchar(100),
	`contact_phone` varchar(30),
	`contact_position` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `villages_id` PRIMARY KEY(`id`),
	CONSTRAINT `villages_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `villages_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `website_template_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int NOT NULL,
	`version` varchar(20) NOT NULL,
	`changelog` text NOT NULL,
	`tokens` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `website_template_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `website_template_versions_template_version_unique` UNIQUE(`template_id`,`version`)
);
--> statement-breakpoint
CREATE TABLE `website_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` varchar(30) NOT NULL,
	`description` text NOT NULL,
	`version` varchar(20) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`tokens` text NOT NULL,
	`tags` text NOT NULL,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `website_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `website_templates_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `rentang_umur` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(60) NOT NULL,
	`dari` int NOT NULL DEFAULT 0,
	`sampai` int,
	`status` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rentang_umur_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rentang_umur_defaults` (
	`village_id` int NOT NULL,
	`default_sets` varchar(200) NOT NULL DEFAULT 'standard',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rentang_umur_defaults_village_id_pk` PRIMARY KEY(`village_id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limit_entries` (
	`key_hash` varchar(64) NOT NULL,
	`request_times` json NOT NULL,
	`expires_at` bigint NOT NULL,
	CONSTRAINT `rate_limit_entries_key_hash` PRIMARY KEY(`key_hash`)
);
--> statement-breakpoint
CREATE TABLE `pemilihan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tahun` int NOT NULL,
	`jenis` varchar(50) NOT NULL,
	`tanggal` date,
	`keterangan` text,
	CONSTRAINT `pemilihan_id` PRIMARY KEY(`id`),
	CONSTRAINT `pemilihan_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `pemilihan_kandidat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`pemilihan_id` int NOT NULL,
	`nomor_urut` int NOT NULL,
	`nama` varchar(100) NOT NULL,
	`keterangan` varchar(500),
	`jumlah_suara` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pemilihan_kandidat_id` PRIMARY KEY(`id`),
	CONSTRAINT `pemilihan_kandidat_nomor_uq` UNIQUE(`pemilihan_id`,`nomor_urut`)
);
--> statement-breakpoint
CREATE TABLE `sinergi_program` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`mitra` varchar(200),
	`tahun` int,
	`tanggal_mulai` varchar(20),
	`tanggal_selesai` varchar(20),
	`keterangan` text,
	CONSTRAINT `sinergi_program_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registrasi_warga` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nik` varchar(16) NOT NULL,
	`nama` varchar(100) NOT NULL,
	`no_hp` varchar(20),
	`status` varchar(20) NOT NULL DEFAULT 'menunggu',
	`catatan` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	CONSTRAINT `registrasi_warga_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lapak` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int,
	`nama` varchar(200) NOT NULL,
	`pemilik` varchar(100),
	`kategori` varchar(100),
	`alamat` text,
	`keterangan` text,
	CONSTRAINT `lapak_id` PRIMARY KEY(`id`),
	CONSTRAINT `lapak_village_id_uq` UNIQUE(`village_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `kehadiran_pengaduan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`waktu` timestamp NOT NULL DEFAULT (now()),
	`status` boolean NOT NULL DEFAULT false,
	`keterangan` text,
	`pelapor_id` int,
	`terlapor_id` int,
	CONSTRAINT `kehadiran_pengaduan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kehadiran_perangkat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`perangkat_id` int,
	`pegawai_id` int,
	`tanggal` date NOT NULL,
	`jam_masuk` time,
	`jam_keluar` time,
	`status` varchar(20) DEFAULT 'hadir',
	`latitude_masuk` varchar(30),
	`longitude_masuk` varchar(30),
	`foto_masuk` varchar(255),
	`catatan` varchar(500),
	CONSTRAINT `kehadiran_perangkat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cuti_kuota` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`pegawai_id` int NOT NULL,
	`tahun` int NOT NULL,
	`total` int NOT NULL DEFAULT 12,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cuti_kuota_id` PRIMARY KEY(`id`),
	CONSTRAINT `cuti_kuota_village_pegawai_tahun_uq` UNIQUE(`village_id`,`pegawai_id`,`tahun`)
);
--> statement-breakpoint
CREATE TABLE `cuti_pegawai` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`pegawai_id` int NOT NULL,
	`jenis` varchar(30) NOT NULL DEFAULT 'cuti_tahunan',
	`mulai` date NOT NULL,
	`selesai` date NOT NULL,
	`durasi` int NOT NULL,
	`alasan` text NOT NULL,
	`lampiran` varchar(255),
	`status` varchar(20) NOT NULL DEFAULT 'menunggu',
	`catatan` text,
	`diputuskan_oleh` varchar(36),
	`diputuskan_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cuti_pegawai_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kepegawaian_dokumen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`pegawai_id` int NOT NULL,
	`judul` varchar(180) NOT NULL,
	`kategori` varchar(50) NOT NULL DEFAULT 'lainnya',
	`nomor` varchar(100),
	`tanggal` date,
	`berkas` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kepegawaian_dokumen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kepegawaian_pegawai` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`perangkat_id` int,
	`nama` varchar(150) NOT NULL,
	`nip` varchar(30),
	`nik` varchar(16),
	`jabatan` varchar(150),
	`jenis_kelamin` varchar(10),
	`tempat_lahir` varchar(100),
	`tanggal_lahir` date,
	`alamat` varchar(500),
	`telepon` varchar(30),
	`email` varchar(150),
	`pendidikan` varchar(100),
	`status_pegawai` varchar(20) NOT NULL DEFAULT 'tetap',
	`status` varchar(20) NOT NULL DEFAULT 'aktif',
	`tanggal_masuk` date,
	`tanggal_keluar` date,
	`foto` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kepegawaian_pegawai_id` PRIMARY KEY(`id`),
	CONSTRAINT `kepegawaian_pegawai_village_id_uq` UNIQUE(`village_id`,`id`),
	CONSTRAINT `kepegawaian_pegawai_village_perangkat_uq` UNIQUE(`village_id`,`perangkat_id`)
);
--> statement-breakpoint
CREATE TABLE `kepegawaian_riwayat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`pegawai_id` int NOT NULL,
	`jabatan` varchar(150) NOT NULL,
	`unit_kerja` varchar(150),
	`nomor_sk` varchar(100),
	`mulai` date NOT NULL,
	`selesai` date,
	`keterangan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kepegawaian_riwayat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tte_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`provider` varchar(50) DEFAULT 'bsre',
	`aktif` int DEFAULT 0,
	`konfigurasi` text,
	CONSTRAINT `tte_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `tte_config_village_uq` UNIQUE(`village_id`)
);
--> statement-breakpoint
CREATE TABLE `sisa_lebih` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tahun` int NOT NULL,
	`jumlah` varchar(50),
	`keterangan` text,
	`tanggal` date,
	CONSTRAINT `sisa_lebih_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pelanggan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`kontak` varchar(100),
	`alamat` text,
	`keterangan` text,
	`status_langganan` varchar(20) DEFAULT 'menunggu',
	`tanggal_mulai` date,
	`tanggal_selesai` date,
	`no_kerjasama` varchar(100),
	`keterangan_langganan` text,
	`dokumen_kerjasama` varchar(500),
	`dokumen_nama` varchar(255),
	`dokumen_mime` varchar(100),
	CONSTRAINT `pelanggan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kategori` varchar(100) NOT NULL,
	`mime_allowlist` json,
	`max_files` int,
	`max_size_bytes` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_settings_village_kategori_unique` UNIQUE(`village_id`,`kategori`)
);
--> statement-breakpoint
CREATE TABLE `incoming_letter_dispositions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`incoming_letter_id` int NOT NULL,
	`to_user_id` varchar(255),
	`to_role` varchar(50),
	`instruction` varchar(255) NOT NULL,
	`due_date` varchar(10),
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`note` varchar(255),
	`lampiran` text,
	`dispatched_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incoming_letter_dispositions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `letter_agenda_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`type` varchar(20) NOT NULL,
	`letter_id` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`note` varchar(255),
	`actor_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `letter_agenda_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outgoing_letter_shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`outgoing_letter_id` int NOT NULL,
	`sent_date` varchar(10) NOT NULL,
	`recipient` varchar(150),
	`delivery_method` varchar(50),
	`tracking_no` varchar(50),
	`note` varchar(255),
	`lampiran` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outgoing_letter_shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surat_audit_trail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` int NOT NULL,
	`field_name` varchar(100) NOT NULL,
	`old_value` text,
	`new_value` text,
	`actor_id` varchar(255),
	`action` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surat_audit_trail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unified_shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`source_module` varchar(50) NOT NULL,
	`source_id` int NOT NULL,
	`sent_date` varchar(10) NOT NULL,
	`recipient` varchar(150),
	`delivery_method` varchar(50),
	`tracking_no` varchar(50),
	`note` varchar(255),
	`lampiran` text,
	`created_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unified_shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `komentar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`halaman` varchar(50) NOT NULL,
	`nama_penulis` varchar(100) NOT NULL,
	`email` varchar(150),
	`isi` text NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'aktif',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `komentar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pengunjung_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`halaman` varchar(100) NOT NULL,
	`tanggal` varchar(10) NOT NULL,
	`jumlah` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pengunjung_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warga_pesan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int NOT NULL,
	`pengirim` varchar(20) NOT NULL,
	`isi` text NOT NULL,
	`dibaca_warga_pada` timestamp,
	`dibaca_operator_pada` timestamp,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warga_pesan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifikasi_terkirim` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int,
	`jenis` varchar(60) NOT NULL,
	`kanal` varchar(20) NOT NULL,
	`target` varchar(255) NOT NULL,
	`subjek` varchar(200),
	`pesan` text,
	`sukses` boolean NOT NULL DEFAULT false,
	`dilewati` boolean NOT NULL DEFAULT false,
	`respons_provider` text,
	`pesan_error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifikasi_terkirim_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kehadiran_izin` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int NOT NULL,
	`jenis` varchar(20) NOT NULL DEFAULT 'izin',
	`tanggal_mulai` date NOT NULL,
	`tanggal_selesai` date NOT NULL,
	`alasan` text NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'menunggu',
	`catatan_operator` text,
	`diputuskan_oleh` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kehadiran_izin_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kehadiran_pengaturan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`jam_masuk` varchar(5) NOT NULL DEFAULT '08:00',
	`jam_keluar` varchar(5) NOT NULL DEFAULT '16:00',
	`hari_libur` text NOT NULL,
	`latitude_kantor` varchar(30),
	`longitude_kantor` varchar(30),
	`radius_meter` int NOT NULL DEFAULT 100,
	`toleransi_terlambat_menit` int NOT NULL DEFAULT 0,
	`wajib_gps` boolean NOT NULL DEFAULT true,
	`wajib_foto` boolean NOT NULL DEFAULT true,
	`diperbarui_oleh` varchar(36),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kehadiran_pengaturan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verifikasi_kontak` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`resident_id` int NOT NULL,
	`target` varchar(150) NOT NULL,
	`kanal` varchar(20) NOT NULL DEFAULT 'whatsapp',
	`kode_hash` varchar(64) NOT NULL,
	`kedaluwarsa` timestamp NOT NULL,
	`terverifikasi_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verifikasi_kontak_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lapak_produk` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`lapak_id` int NOT NULL,
	`nama` varchar(200) NOT NULL,
	`deskripsi` text,
	`harga` decimal(12,2) NOT NULL,
	`stok` int DEFAULT 0,
	`gambar` varchar(500),
	`aktif` int NOT NULL DEFAULT 1,
	`latitude` varchar(20),
	`longitude` varchar(20),
	CONSTRAINT `lapak_produk_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keranjang` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lapak_id` int NOT NULL,
	`produk_id` int NOT NULL,
	`jumlah` int NOT NULL DEFAULT 1,
	`session_key` varchar(100) NOT NULL,
	CONSTRAINT `keranjang_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pengaturan_desa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`kunci` varchar(100) NOT NULL,
	`nilai` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pengaturan_desa_id` PRIMARY KEY(`id`),
	CONSTRAINT `pengaturan_desa_village_kunci_uq` UNIQUE(`village_id`,`kunci`)
);
--> statement-breakpoint
CREATE TABLE `pengguna_shortcut` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`href` varchar(255) NOT NULL,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pengguna_shortcut_id` PRIMARY KEY(`id`),
	CONSTRAINT `pengguna_shortcut_user_href_uq` UNIQUE(`user_id`,`href`)
);
--> statement-breakpoint
CREATE TABLE `pengguna_menu_urutan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`urut` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pengguna_menu_urutan_id` PRIMARY KEY(`id`),
	CONSTRAINT `pengguna_menu_urutan_user_slug_uq` UNIQUE(`user_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `plugin_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`slug` varchar(80) NOT NULL,
	`aktif` boolean NOT NULL DEFAULT false,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plugin_registry_id` PRIMARY KEY(`id`),
	CONSTRAINT `plugin_registry_village_slug_uq` UNIQUE(`village_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `login_otp` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`kanal` varchar(20) NOT NULL,
	`target` varchar(255) NOT NULL,
	`kode_hash` varchar(64) NOT NULL,
	`kedaluwarsa` timestamp NOT NULL,
	`percobaan` int NOT NULL DEFAULT 0,
	`terpakai_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_otp_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `umpan_balik` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama` varchar(100),
	`kontak` varchar(150),
	`pesan` text NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'baru',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `umpan_balik_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keuangan_bulanan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tahun` int NOT NULL,
	`bulan` int NOT NULL,
	`template_uuid` varchar(20) NOT NULL,
	`target` decimal(65,2) NOT NULL DEFAULT '0.00',
	`realisasi` decimal(65,2) NOT NULL DEFAULT '0.00',
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keuangan_bulanan_id` PRIMARY KEY(`id`),
	CONSTRAINT `keuangan_bulanan_village_year_month_account_uq` UNIQUE(`village_id`,`tahun`,`bulan`,`template_uuid`)
);
--> statement-breakpoint
CREATE TABLE `village_blocked_ips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`ip_address` varchar(45) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`expires_at` timestamp,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `village_blocked_ips_id` PRIMARY KEY(`id`),
	CONSTRAINT `village_blocked_ip_uq` UNIQUE(`village_id`,`ip_address`)
);
--> statement-breakpoint
CREATE TABLE `village_security_settings` (
	`village_id` int NOT NULL,
	`password_min_length` int NOT NULL DEFAULT 8,
	`password_expiry_days` int NOT NULL DEFAULT 90,
	`password_reuse_count` int NOT NULL DEFAULT 3,
	`require_uppercase` boolean NOT NULL DEFAULT true,
	`require_lowercase` boolean NOT NULL DEFAULT true,
	`require_number` boolean NOT NULL DEFAULT true,
	`require_symbol` boolean NOT NULL DEFAULT false,
	`session_timeout_minutes` int NOT NULL DEFAULT 30,
	`auto_logout_inactive` boolean NOT NULL DEFAULT true,
	`concurrent_login` boolean NOT NULL DEFAULT false,
	`require_two_factor_for_all_users` boolean NOT NULL DEFAULT false,
	`ip_restriction_enabled` boolean NOT NULL DEFAULT false,
	`allowed_ips` text,
	`updated_by` varchar(36),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `village_security_settings_village_id_pk` PRIMARY KEY(`village_id`)
);
--> statement-breakpoint
CREATE TABLE `two_factor` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`secret` text NOT NULL,
	`backup_codes` text NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`failed_verification_count` int NOT NULL DEFAULT 0,
	`locked_until` timestamp,
	CONSTRAINT `two_factor_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_history_user_hash_unique` UNIQUE(`user_id`,`password_hash`)
);
--> statement-breakpoint
ALTER TABLE `agenda_kegiatan` ADD CONSTRAINT `agenda_kegiatan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analisis_indikator` ADD CONSTRAINT `analisis_indikator_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analisis_indikator` ADD CONSTRAINT `analisis_indikator_kategori_tenant_fk` FOREIGN KEY (`village_id`,`kategori_id`) REFERENCES `analisis_kategori`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analisis_kategori` ADD CONSTRAINT `analisis_kategori_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anjungan` ADD CONSTRAINT `anjungan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `arsip` ADD CONSTRAINT `arsip_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bantuan_peserta` ADD CONSTRAINT `bantuan_peserta_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bantuan_peserta` ADD CONSTRAINT `bantuan_peserta_program_tenant_fk` FOREIGN KEY (`village_id`,`program_id`) REFERENCES `bantuan_program`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bantuan_peserta` ADD CONSTRAINT `bantuan_peserta_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bantuan_peserta` ADD CONSTRAINT `bantuan_peserta_family_tenant_fk` FOREIGN KEY (`village_id`,`family_id`) REFERENCES `families`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bantuan_peserta` ADD CONSTRAINT `bantuan_peserta_rtm_tenant_fk` FOREIGN KEY (`village_id`,`rtm_id`) REFERENCES `rtm`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bantuan_peserta` ADD CONSTRAINT `bantuan_peserta_kelompok_tenant_fk` FOREIGN KEY (`village_id`,`kelompok_id`) REFERENCES `kelompok`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bantuan_program` ADD CONSTRAINT `bantuan_program_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bukti_pengiriman_notifikasi` ADD CONSTRAINT `bukti_pengiriman_notifikasi_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bukti_pengiriman_notifikasi` ADD CONSTRAINT `bukti_pengiriman_notifikasi_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bukti_pengiriman_notifikasi` ADD CONSTRAINT `bukti_pengiriman_pengaduan_tenant_fk` FOREIGN KEY (`village_id`,`pengaduan_id`) REFERENCES `pengaduan`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buku_tamu` ADD CONSTRAINT `buku_tamu_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_kader` ADD CONSTRAINT `bumindes_kader_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_pembangunan` ADD CONSTRAINT `bumindes_pembangunan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_agenda` ADD CONSTRAINT `bumindes_agenda_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_aparat` ADD CONSTRAINT `bumindes_aparat_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_peraturan` ADD CONSTRAINT `bumindes_peraturan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_tanah_kas` ADD CONSTRAINT `bumindes_tanah_kas_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_tanah_kas_mutasi` ADD CONSTRAINT `bumindes_tanah_kas_mutasi_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_tanah_kas_mutasi` ADD CONSTRAINT `bumindes_tanah_kas_mutasi_persil_tenant_fk` FOREIGN KEY (`village_id`,`tanah_kas_id`) REFERENCES `bumindes_tanah_kas`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_buku` ADD CONSTRAINT `bumindes_buku_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_item` ADD CONSTRAINT `bumindes_item_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bumindes_item` ADD CONSTRAINT `bumindes_item_buku_tenant_fk` FOREIGN KEY (`village_id`,`buku_id`) REFERENCES `bumindes_buku`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `berita` ADD CONSTRAINT `berita_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `berita` ADD CONSTRAINT `berita_penulis_id_users_id_fk` FOREIGN KEY (`penulis_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `berita` ADD CONSTRAINT `berita_kategori_tenant_fk` FOREIGN KEY (`village_id`,`kategori_id`) REFERENCES `berita_kategori`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `berita_kategori` ADD CONSTRAINT `berita_kategori_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dokumen_publik` ADD CONSTRAINT `dokumen_publik_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `galeri_album` ADD CONSTRAINT `galeri_album_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `galeri_foto` ADD CONSTRAINT `galeri_foto_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `galeri_foto` ADD CONSTRAINT `galeri_foto_album_tenant_fk` FOREIGN KEY (`village_id`,`album_id`) REFERENCES `galeri_album`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `halaman_statis` ADD CONSTRAINT `halaman_statis_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jabatan_perangkat` ADD CONSTRAINT `jabatan_perangkat_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_publik` ADD CONSTRAINT `menu_publik_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `perangkat_desa` ADD CONSTRAINT `perangkat_desa_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `perangkat_desa` ADD CONSTRAINT `perangkat_desa_jabatan_tenant_fk` FOREIGN KEY (`village_id`,`jabatan_id`) REFERENCES `jabatan_perangkat`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profil_desa` ADD CONSTRAINT `profil_desa_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slider` ADD CONSTRAINT `slider_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `widget` ADD CONSTRAINT `widget_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dokumen_desa` ADD CONSTRAINT `dokumen_desa_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dokumen_warga` ADD CONSTRAINT `dokumen_warga_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dokumen_warga` ADD CONSTRAINT `dokumen_warga_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `domain_dns_checks` ADD CONSTRAINT `domain_dns_checks_domain_id_village_domains_id_fk` FOREIGN KEY (`domain_id`) REFERENCES `village_domains`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `domain_ssl_checks` ADD CONSTRAINT `domain_ssl_checks_domain_id_village_domains_id_fk` FOREIGN KEY (`domain_id`) REFERENCES `village_domains`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks` ADD CONSTRAINT `dtks_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks` ADD CONSTRAINT `dtks_rtm_tenant_fk` FOREIGN KEY (`village_id`,`rtm_id`) REFERENCES `rtm`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks` ADD CONSTRAINT `dtks_keluarga_tenant_fk` FOREIGN KEY (`village_id`,`keluarga_id`) REFERENCES `families`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks_anggota` ADD CONSTRAINT `dtks_anggota_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks_anggota` ADD CONSTRAINT `dtks_anggota_dtks_tenant_fk` FOREIGN KEY (`village_id`,`dtks_id`) REFERENCES `dtks`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks_anggota` ADD CONSTRAINT `dtks_anggota_penduduk_tenant_fk` FOREIGN KEY (`village_id`,`penduduk_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks_lampiran` ADD CONSTRAINT `dtks_lampiran_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks_pengaturan_program` ADD CONSTRAINT `dtks_pengaturan_program_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks_ref_lampiran` ADD CONSTRAINT `dtks_ref_lampiran_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks_ref_lampiran` ADD CONSTRAINT `dtks_ref_lampiran_dtks_tenant_fk` FOREIGN KEY (`village_id`,`dtks_id`) REFERENCES `dtks`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dtks_ref_lampiran` ADD CONSTRAINT `dtks_ref_lampiran_lampiran_tenant_fk` FOREIGN KEY (`village_id`,`lampiran_id`) REFERENCES `dtks_lampiran`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `elections` ADD CONSTRAINT `elections_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_member_logs` ADD CONSTRAINT `family_member_logs_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_member_logs` ADD CONSTRAINT `family_member_logs_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_member_logs` ADD CONSTRAINT `family_member_logs_family_tenant_fk` FOREIGN KEY (`village_id`,`family_id`) REFERENCES `families`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_member_logs` ADD CONSTRAINT `family_member_logs_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `families` ADD CONSTRAINT `families_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `families` ADD CONSTRAINT `families_region_tenant_fk` FOREIGN KEY (`village_id`,`region_id`) REFERENCES `regions`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `galeri_video` ADD CONSTRAINT `galeri_video_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `area` ADD CONSTRAINT `area_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `area` ADD CONSTRAINT `area_polygon_tenant_fk` FOREIGN KEY (`village_id`,`ref_polygon`) REFERENCES `polygon`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cdesa` ADD CONSTRAINT `cdesa_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cdesa_mutasi` ADD CONSTRAINT `cdesa_mutasi_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cdesa_mutasi` ADD CONSTRAINT `cdesa_mutasi_village_cdesa_id_cdesa_village_id_id_fk` FOREIGN KEY (`village_id`,`cdesa_id`) REFERENCES `cdesa`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cdesa_rincian` ADD CONSTRAINT `cdesa_rincian_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cdesa_rincian` ADD CONSTRAINT `cdesa_rincian_village_cdesa_id_cdesa_village_id_id_fk` FOREIGN KEY (`village_id`,`cdesa_id`) REFERENCES `cdesa`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `garis` ADD CONSTRAINT `garis_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persil` ADD CONSTRAINT `persil_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `point` ADD CONSTRAINT `point_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `polygon` ADD CONSTRAINT `polygon_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `idm_indikator` ADD CONSTRAINT `idm_indikator_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `idm_ringkasan` ADD CONSTRAINT `idm_ringkasan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `idm_sdgs` ADD CONSTRAINT `idm_sdgs_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incoming_letters` ADD CONSTRAINT `incoming_letters_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incoming_letters` ADD CONSTRAINT `incoming_letters_classification_tenant_fk` FOREIGN KEY (`village_id`,`classification_id`) REFERENCES `letter_classifications`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulanan_anak` ADD CONSTRAINT `bulanan_anak_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulanan_anak` ADD CONSTRAINT `bulanan_anak_posyandu_tenant_fk` FOREIGN KEY (`village_id`,`posyandu_id`) REFERENCES `posyandu`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulanan_anak` ADD CONSTRAINT `bulanan_anak_kia_tenant_fk` FOREIGN KEY (`village_id`,`kia_id`) REFERENCES `kia`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ibu_hamil` ADD CONSTRAINT `ibu_hamil_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ibu_hamil` ADD CONSTRAINT `ibu_hamil_posyandu_tenant_fk` FOREIGN KEY (`village_id`,`posyandu_id`) REFERENCES `posyandu`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ibu_hamil` ADD CONSTRAINT `ibu_hamil_kia_tenant_fk` FOREIGN KEY (`village_id`,`kia_id`) REFERENCES `kia`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kia` ADD CONSTRAINT `kia_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kia` ADD CONSTRAINT `kia_ibu_tenant_fk` FOREIGN KEY (`village_id`,`ibu_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kia` ADD CONSTRAINT `kia_anak_tenant_fk` FOREIGN KEY (`village_id`,`anak_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posyandu` ADD CONSTRAINT `posyandu_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sasaran_paud` ADD CONSTRAINT `sasaran_paud_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sasaran_paud` ADD CONSTRAINT `sasaran_paud_posyandu_tenant_fk` FOREIGN KEY (`village_id`,`posyandu_id`) REFERENCES `posyandu`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sasaran_paud` ADD CONSTRAINT `sasaran_paud_kia_tenant_fk` FOREIGN KEY (`village_id`,`kia_id`) REFERENCES `kia`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `layanan_publik` ADD CONSTRAINT `layanan_publik_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengajuan_layanan` ADD CONSTRAINT `pengajuan_layanan_service_tenant_fk` FOREIGN KEY (`village_id`,`layanan_id`) REFERENCES `layanan_publik`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengajuan_layanan` ADD CONSTRAINT `pengajuan_layanan_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengajuan_layanan` ADD CONSTRAINT `pengajuan_layanan_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengajuan_layanan` ADD CONSTRAINT `pengajuan_layanan_petugas_fk` FOREIGN KEY (`petugas_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `riwayat_pengajuan_layanan` ADD CONSTRAINT `riwayat_pengajuan_request_tenant_fk` FOREIGN KEY (`village_id`,`pengajuan_id`) REFERENCES `pengajuan_layanan`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `riwayat_pengajuan_layanan` ADD CONSTRAINT `riwayat_pengajuan_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `riwayat_pengajuan_layanan` ADD CONSTRAINT `riwayat_pengajuan_actor_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengajuan_layanan_berkas` ADD CONSTRAINT `pengajuan_layanan_berkas_request_tenant_fk` FOREIGN KEY (`village_id`,`pengajuan_id`) REFERENCES `pengajuan_layanan`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengajuan_layanan_berkas` ADD CONSTRAINT `pengajuan_layanan_berkas_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pendapat` ADD CONSTRAINT `pendapat_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pendapat` ADD CONSTRAINT `pendapat_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anggota_grup_kontak` ADD CONSTRAINT `anggota_grup_kontak_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anggota_grup_kontak` ADD CONSTRAINT `anggota_grup_kontak_grup_tenant_fk` FOREIGN KEY (`village_id`,`grup_id`) REFERENCES `kontak_grup`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anggota_grup_kontak` ADD CONSTRAINT `anggota_grup_kontak_kontak_tenant_fk` FOREIGN KEY (`village_id`,`kontak_id`) REFERENCES `kontak`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kontak` ADD CONSTRAINT `kontak_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kontak` ADD CONSTRAINT `kontak_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kontak_grup` ADD CONSTRAINT `kontak_grup_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mailbox_pesan` ADD CONSTRAINT `mailbox_pesan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lembaga_anggota` ADD CONSTRAINT `lembaga_anggota_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lembaga_anggota` ADD CONSTRAINT `lembaga_anggota_tenant_fk` FOREIGN KEY (`village_id`,`lembaga_id`) REFERENCES `lembaga_desa`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lembaga_anggota` ADD CONSTRAINT `lembaga_anggota_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lembaga_desa` ADD CONSTRAINT `lembaga_desa_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lembaga_desa` ADD CONSTRAINT `lembaga_desa_ketua_tenant_fk` FOREIGN KEY (`village_id`,`ketua_resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lembaga_desa` ADD CONSTRAINT `lembaga_desa_master_tenant_fk` FOREIGN KEY (`village_id`,`master_id`) REFERENCES `lembaga_master`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lembaga_master` ADD CONSTRAINT `lembaga_master_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pemerintahan_dokumen` ADD CONSTRAINT `pemerintahan_dokumen_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pemerintahan_dokumen` ADD CONSTRAINT `pemerintahan_dokumen_perangkat_tenant_fk` FOREIGN KEY (`village_id`,`perangkat_id`) REFERENCES `perangkat_desa`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pemerintahan_dokumen` ADD CONSTRAINT `pemerintahan_dokumen_lembaga_tenant_fk` FOREIGN KEY (`village_id`,`lembaga_id`) REFERENCES `lembaga_desa`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `perangkat_riwayat_jabatan` ADD CONSTRAINT `perangkat_riwayat_jabatan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `perangkat_riwayat_jabatan` ADD CONSTRAINT `perangkat_riwayat_tenant_fk` FOREIGN KEY (`village_id`,`perangkat_id`) REFERENCES `perangkat_desa`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `potensi_desa` ADD CONSTRAINT `potensi_desa_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `potensi_indikator` ADD CONSTRAINT `potensi_indikator_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `potensi_indikator` ADD CONSTRAINT `potensi_indikator_tenant_fk` FOREIGN KEY (`village_id`,`potensi_id`) REFERENCES `potensi_desa`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris` ADD CONSTRAINT `inventaris_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris` ADD CONSTRAINT `inventaris_kategori_tenant_fk` FOREIGN KEY (`village_id`,`kategori_id`) REFERENCES `inventaris_kategori`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_dokumen` ADD CONSTRAINT `inventaris_dokumen_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_dokumen` ADD CONSTRAINT `inventaris_dokumen_asset_tenant_fk` FOREIGN KEY (`village_id`,`inventaris_id`) REFERENCES `inventaris`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_kategori` ADD CONSTRAINT `inventaris_kategori_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_mutasi` ADD CONSTRAINT `inventaris_mutasi_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_mutasi` ADD CONSTRAINT `inventaris_mutasi_inventaris_tenant_fk` FOREIGN KEY (`village_id`,`inventaris_id`) REFERENCES `inventaris`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_pemeliharaan` ADD CONSTRAINT `inventaris_pemeliharaan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_pemeliharaan` ADD CONSTRAINT `inventaris_pemeliharaan_asset_tenant_fk` FOREIGN KEY (`village_id`,`inventaris_id`) REFERENCES `inventaris`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_pemeliharaan_riwayat` ADD CONSTRAINT `inventaris_pemeliharaan_riwayat_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_pemeliharaan_riwayat` ADD CONSTRAINT `inventaris_pemeliharaan_history_schedule_tenant_fk` FOREIGN KEY (`village_id`,`pemeliharaan_id`) REFERENCES `inventaris_pemeliharaan`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_pemeliharaan_riwayat` ADD CONSTRAINT `inventaris_pemeliharaan_history_asset_tenant_fk` FOREIGN KEY (`village_id`,`inventaris_id`) REFERENCES `inventaris`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_penanggung_jawab_riwayat` ADD CONSTRAINT `inventaris_penanggung_jawab_riwayat_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventaris_penanggung_jawab_riwayat` ADD CONSTRAINT `inventaris_pj_history_asset_tenant_fk` FOREIGN KEY (`village_id`,`inventaris_id`) REFERENCES `inventaris`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan` ADD CONSTRAINT `keuangan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan` ADD CONSTRAINT `keuangan_template_uuid_keuangan_template_uuid_fk` FOREIGN KEY (`template_uuid`) REFERENCES `keuangan_template`(`uuid`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan` ADD CONSTRAINT `keuangan_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_laporan` ADD CONSTRAINT `keuangan_laporan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_laporan` ADD CONSTRAINT `keuangan_laporan_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_transaksi` ADD CONSTRAINT `keuangan_transaksi_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_transaksi` ADD CONSTRAINT `keuangan_transaksi_template_uuid_keuangan_template_uuid_fk` FOREIGN KEY (`template_uuid`) REFERENCES `keuangan_template`(`uuid`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_transaksi` ADD CONSTRAINT `keuangan_transaksi_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_triwulan` ADD CONSTRAINT `keuangan_triwulan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_triwulan` ADD CONSTRAINT `keuangan_triwulan_template_uuid_keuangan_template_uuid_fk` FOREIGN KEY (`template_uuid`) REFERENCES `keuangan_template`(`uuid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_triwulan` ADD CONSTRAINT `keuangan_triwulan_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `laporan_penduduk` ADD CONSTRAINT `laporan_penduduk_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `laporan_penduduk` ADD CONSTRAINT `laporan_penduduk_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kelompok` ADD CONSTRAINT `kelompok_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kelompok` ADD CONSTRAINT `kelompok_category_tenant_fk` FOREIGN KEY (`village_id`,`category_id`) REFERENCES `kelompok_master`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kelompok_anggota` ADD CONSTRAINT `kelompok_anggota_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kelompok_anggota` ADD CONSTRAINT `kelompok_anggota_kelompok_tenant_fk` FOREIGN KEY (`village_id`,`kelompok_id`) REFERENCES `kelompok`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kelompok_anggota` ADD CONSTRAINT `kelompok_anggota_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kelompok_master` ADD CONSTRAINT `kelompok_master_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_classifications` ADD CONSTRAINT `letter_classifications_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_dinas` ADD CONSTRAINT `letter_dinas_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_dinas` ADD CONSTRAINT `letter_dinas_classification_tenant_fk` FOREIGN KEY (`village_id`,`classification_id`) REFERENCES `letter_classifications`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_requirements` ADD CONSTRAINT `letter_requirements_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_types` ADD CONSTRAINT `letter_types_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_types` ADD CONSTRAINT `letter_types_classification_tenant_fk` FOREIGN KEY (`village_id`,`classification_id`) REFERENCES `letter_classifications`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_type_tenant_fk` FOREIGN KEY (`village_id`,`type_id`) REFERENCES `letter_types`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_number_archive` ADD CONSTRAINT `letter_number_archive_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_number_archive` ADD CONSTRAINT `letter_number_archive_letter_tenant_fk` FOREIGN KEY (`village_id`,`letter_id`) REFERENCES `letters`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outgoing_letters` ADD CONSTRAINT `outgoing_letters_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outgoing_letters` ADD CONSTRAINT `outgoing_letters_classification_tenant_fk` FOREIGN KEY (`village_id`,`classification_id`) REFERENCES `letter_classifications`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pembangunan_dokumentasi` ADD CONSTRAINT `pembangunan_dokumentasi_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pembangunan_dokumentasi` ADD CONSTRAINT `pembangunan_dokumentasi_proyek_tenant_fk` FOREIGN KEY (`village_id`,`proyek_id`) REFERENCES `pembangunan_proyek`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pembangunan_proyek` ADD CONSTRAINT `pembangunan_proyek_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengaduan` ADD CONSTRAINT `pengaduan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengaduan` ADD CONSTRAINT `pengaduan_petugas_id_users_id_fk` FOREIGN KEY (`petugas_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permohonan_surat` ADD CONSTRAINT `permohonan_surat_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permohonan_surat` ADD CONSTRAINT `permohonan_surat_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permohonan_surat` ADD CONSTRAINT `permohonan_surat_type_tenant_fk` FOREIGN KEY (`village_id`,`letter_type_id`) REFERENCES `letter_types`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permohonan_surat` ADD CONSTRAINT `permohonan_surat_letter_tenant_fk` FOREIGN KEY (`village_id`,`letter_id`) REFERENCES `letters`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `modules` ADD CONSTRAINT `modules_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_module_id_modules_id_fk` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roles` ADD CONSTRAINT `roles_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `regions` ADD CONSTRAINT `regions_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_religion_id_religions_id_fk` FOREIGN KEY (`religion_id`) REFERENCES `religions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_education_id_educations_id_fk` FOREIGN KEY (`education_id`) REFERENCES `educations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_education_sedang_id_educations_id_fk` FOREIGN KEY (`education_sedang_id`) REFERENCES `educations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_occupation_id_occupations_id_fk` FOREIGN KEY (`occupation_id`) REFERENCES `occupations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_marital_status_id_marital_statuses_id_fk` FOREIGN KEY (`marital_status_id`) REFERENCES `marital_statuses`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_family_relation_id_family_relations_id_fk` FOREIGN KEY (`family_relation_id`) REFERENCES `family_relations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_blood_type_id_blood_types_id_fk` FOREIGN KEY (`blood_type_id`) REFERENCES `blood_types`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_citizenship_id_citizenships_id_fk` FOREIGN KEY (`citizenship_id`) REFERENCES `citizenships`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_family_tenant_fk` FOREIGN KEY (`village_id`,`family_id`) REFERENCES `families`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_rtm_tenant_fk` FOREIGN KEY (`village_id`,`rtm_id`) REFERENCES `rtm`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `residents` ADD CONSTRAINT `residents_region_tenant_fk` FOREIGN KEY (`village_id`,`region_id`) REFERENCES `regions`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resident_mutations` ADD CONSTRAINT `resident_mutations_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resident_mutations` ADD CONSTRAINT `resident_mutations_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resident_mutations` ADD CONSTRAINT `resident_mutations_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resident_mutations` ADD CONSTRAINT `resident_mutations_from_region_tenant_fk` FOREIGN KEY (`village_id`,`from_region_id`) REFERENCES `regions`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resident_mutations` ADD CONSTRAINT `resident_mutations_to_region_tenant_fk` FOREIGN KEY (`village_id`,`to_region_id`) REFERENCES `regions`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rtm` ADD CONSTRAINT `rtm_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rtm` ADD CONSTRAINT `rtm_region_tenant_fk` FOREIGN KEY (`village_id`,`region_id`) REFERENCES `regions`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suplemen` ADD CONSTRAINT `suplemen_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suplemen_terdata` ADD CONSTRAINT `suplemen_terdata_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suplemen_terdata` ADD CONSTRAINT `suplemen_terdata_suplemen_tenant_fk` FOREIGN KEY (`village_id`,`id_suplemen`) REFERENCES `suplemen`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suplemen_terdata` ADD CONSTRAINT `suplemen_terdata_penduduk_tenant_fk` FOREIGN KEY (`village_id`,`penduduk_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suplemen_terdata` ADD CONSTRAINT `suplemen_terdata_keluarga_tenant_fk` FOREIGN KEY (`village_id`,`keluarga_id`) REFERENCES `families`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey` ADD CONSTRAINT `survey_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_jawaban` ADD CONSTRAINT `survey_jawaban_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_jawaban` ADD CONSTRAINT `survey_jawaban_responden_tenant_fk` FOREIGN KEY (`village_id`,`responden_id`) REFERENCES `survey_responden`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_jawaban` ADD CONSTRAINT `survey_jawaban_soal_tenant_fk` FOREIGN KEY (`village_id`,`soal_id`) REFERENCES `survey_soal`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_responden` ADD CONSTRAINT `survey_responden_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_responden` ADD CONSTRAINT `survey_responden_survey_tenant_fk` FOREIGN KEY (`village_id`,`survey_id`) REFERENCES `survey`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_soal` ADD CONSTRAINT `survey_soal_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_soal` ADD CONSTRAINT `survey_soal_survey_tenant_fk` FOREIGN KEY (`village_id`,`survey_id`) REFERENCES `survey`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_soal` ADD CONSTRAINT `survey_soal_indikator_tenant_fk` FOREIGN KEY (`village_id`,`indikator_id`) REFERENCES `analisis_indikator`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `theme` ADD CONSTRAINT `theme_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_domain_tombstones` ADD CONSTRAINT `tenant_domain_tombstones_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_exports` ADD CONSTRAINT `tenant_exports_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_purge_archive` ADD CONSTRAINT `tenant_purge_archive_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `village_domains` ADD CONSTRAINT `village_domains_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `website_template_versions` ADD CONSTRAINT `website_template_versions_template_id_website_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `website_templates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rentang_umur` ADD CONSTRAINT `rentang_umur_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rentang_umur_defaults` ADD CONSTRAINT `rentang_umur_defaults_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pemilihan` ADD CONSTRAINT `pemilihan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pemilihan_kandidat` ADD CONSTRAINT `pemilihan_kandidat_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pemilihan_kandidat` ADD CONSTRAINT `pemilihan_kandidat_parent_tenant_fk` FOREIGN KEY (`village_id`,`pemilihan_id`) REFERENCES `pemilihan`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sinergi_program` ADD CONSTRAINT `sinergi_program_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `registrasi_warga` ADD CONSTRAINT `registrasi_warga_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lapak` ADD CONSTRAINT `lapak_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lapak` ADD CONSTRAINT `lapak_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_pengaduan` ADD CONSTRAINT `kehadiran_pengaduan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_pengaduan` ADD CONSTRAINT `kehadiran_pengaduan_pelapor_tenant_fk` FOREIGN KEY (`village_id`,`pelapor_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_pengaduan` ADD CONSTRAINT `kehadiran_pengaduan_pegawai_tenant_fk` FOREIGN KEY (`village_id`,`terlapor_id`) REFERENCES `kepegawaian_pegawai`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_perangkat` ADD CONSTRAINT `kehadiran_perangkat_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_perangkat` ADD CONSTRAINT `kehadiran_perangkat_pegawai_tenant_fk` FOREIGN KEY (`village_id`,`pegawai_id`) REFERENCES `kepegawaian_pegawai`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cuti_kuota` ADD CONSTRAINT `cuti_kuota_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cuti_kuota` ADD CONSTRAINT `cuti_kuota_pegawai_tenant_fk` FOREIGN KEY (`village_id`,`pegawai_id`) REFERENCES `kepegawaian_pegawai`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cuti_pegawai` ADD CONSTRAINT `cuti_pegawai_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cuti_pegawai` ADD CONSTRAINT `cuti_pegawai_pegawai_tenant_fk` FOREIGN KEY (`village_id`,`pegawai_id`) REFERENCES `kepegawaian_pegawai`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kepegawaian_dokumen` ADD CONSTRAINT `kepegawaian_dokumen_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kepegawaian_dokumen` ADD CONSTRAINT `kepegawaian_dokumen_pegawai_tenant_fk` FOREIGN KEY (`village_id`,`pegawai_id`) REFERENCES `kepegawaian_pegawai`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kepegawaian_pegawai` ADD CONSTRAINT `kepegawaian_pegawai_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kepegawaian_riwayat` ADD CONSTRAINT `kepegawaian_riwayat_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kepegawaian_riwayat` ADD CONSTRAINT `kepegawaian_riwayat_pegawai_tenant_fk` FOREIGN KEY (`village_id`,`pegawai_id`) REFERENCES `kepegawaian_pegawai`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tte_config` ADD CONSTRAINT `tte_config_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sisa_lebih` ADD CONSTRAINT `sisa_lebih_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pelanggan` ADD CONSTRAINT `pelanggan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_settings` ADD CONSTRAINT `media_settings_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incoming_letter_dispositions` ADD CONSTRAINT `incoming_letter_dispositions_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incoming_letter_dispositions` ADD CONSTRAINT `incoming_letter_dispositions_to_user_id_users_id_fk` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incoming_letter_dispositions` ADD CONSTRAINT `ild_incoming_letter_tenant_fk` FOREIGN KEY (`village_id`,`incoming_letter_id`) REFERENCES `incoming_letters`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_agenda_logs` ADD CONSTRAINT `letter_agenda_logs_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letter_agenda_logs` ADD CONSTRAINT `letter_agenda_logs_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outgoing_letter_shipments` ADD CONSTRAINT `outgoing_letter_shipments_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outgoing_letter_shipments` ADD CONSTRAINT `ols_outgoing_letter_tenant_fk` FOREIGN KEY (`village_id`,`outgoing_letter_id`) REFERENCES `outgoing_letters`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surat_audit_trail` ADD CONSTRAINT `surat_audit_trail_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surat_audit_trail` ADD CONSTRAINT `surat_audit_trail_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unified_shipments` ADD CONSTRAINT `unified_shipments_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unified_shipments` ADD CONSTRAINT `unified_shipments_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `komentar` ADD CONSTRAINT `komentar_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengunjung_log` ADD CONSTRAINT `pengunjung_log_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warga_pesan` ADD CONSTRAINT `warga_pesan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warga_pesan` ADD CONSTRAINT `warga_pesan_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warga_pesan` ADD CONSTRAINT `warga_pesan_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifikasi_terkirim` ADD CONSTRAINT `notifikasi_terkirim_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifikasi_terkirim` ADD CONSTRAINT `notifikasi_terkirim_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_izin` ADD CONSTRAINT `kehadiran_izin_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_izin` ADD CONSTRAINT `kehadiran_izin_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_pengaturan` ADD CONSTRAINT `kehadiran_pengaturan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verifikasi_kontak` ADD CONSTRAINT `verifikasi_kontak_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verifikasi_kontak` ADD CONSTRAINT `verifikasi_kontak_resident_tenant_fk` FOREIGN KEY (`village_id`,`resident_id`) REFERENCES `residents`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lapak_produk` ADD CONSTRAINT `lapak_produk_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lapak_produk` ADD CONSTRAINT `lapak_produk_lapak_tenant_fk` FOREIGN KEY (`village_id`,`lapak_id`) REFERENCES `lapak`(`village_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keranjang` ADD CONSTRAINT `keranjang_lapak_id_lapak_id_fk` FOREIGN KEY (`lapak_id`) REFERENCES `lapak`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keranjang` ADD CONSTRAINT `keranjang_produk_id_lapak_produk_id_fk` FOREIGN KEY (`produk_id`) REFERENCES `lapak_produk`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengaturan_desa` ADD CONSTRAINT `pengaturan_desa_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengguna_shortcut` ADD CONSTRAINT `pengguna_shortcut_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengguna_menu_urutan` ADD CONSTRAINT `pengguna_menu_urutan_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_registry` ADD CONSTRAINT `plugin_registry_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `login_otp` ADD CONSTRAINT `login_otp_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `umpan_balik` ADD CONSTRAINT `umpan_balik_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_bulanan` ADD CONSTRAINT `keuangan_bulanan_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_bulanan` ADD CONSTRAINT `keuangan_bulanan_template_uuid_keuangan_template_uuid_fk` FOREIGN KEY (`template_uuid`) REFERENCES `keuangan_template`(`uuid`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_bulanan` ADD CONSTRAINT `keuangan_bulanan_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `village_blocked_ips` ADD CONSTRAINT `village_blocked_ips_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `village_blocked_ips` ADD CONSTRAINT `village_blocked_ips_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `village_security_settings` ADD CONSTRAINT `village_security_settings_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `village_security_settings` ADD CONSTRAINT `village_security_settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `two_factor` ADD CONSTRAINT `two_factor_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_history` ADD CONSTRAINT `password_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `agenda_kegiatan_village_mulai_idx` ON `agenda_kegiatan` (`village_id`,`mulai`);--> statement-breakpoint
CREATE INDEX `analisis_indikator_village_kategori_idx` ON `analisis_indikator` (`village_id`,`kategori_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_village_created_idx` ON `audit_logs` (`village_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_created_idx` ON `audit_logs` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_event_idx` ON `audit_logs` (`event`);--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role_id`);--> statement-breakpoint
CREATE INDEX `users_village_resident_idx` ON `users` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `bantuan_peserta_program_idx` ON `bantuan_peserta` (`program_id`);--> statement-breakpoint
CREATE INDEX `bantuan_peserta_village_program_idx` ON `bantuan_peserta` (`village_id`,`program_id`);--> statement-breakpoint
CREATE INDEX `bantuan_peserta_village_resident_idx` ON `bantuan_peserta` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `bantuan_peserta_village_family_idx` ON `bantuan_peserta` (`village_id`,`family_id`);--> statement-breakpoint
CREATE INDEX `bantuan_peserta_village_rtm_idx` ON `bantuan_peserta` (`village_id`,`rtm_id`);--> statement-breakpoint
CREATE INDEX `bantuan_peserta_village_kelompok_idx` ON `bantuan_peserta` (`village_id`,`kelompok_id`);--> statement-breakpoint
CREATE INDEX `bantuan_program_village_sasaran_idx` ON `bantuan_program` (`village_id`,`sasaran`);--> statement-breakpoint
CREATE INDEX `bukti_pengiriman_village_pengaduan_idx` ON `bukti_pengiriman_notifikasi` (`village_id`,`pengaduan_id`);--> statement-breakpoint
CREATE INDEX `bumindes_kader_village_idx` ON `bumindes_kader` (`village_id`);--> statement-breakpoint
CREATE INDEX `bumindes_pembangunan_village_tahun_idx` ON `bumindes_pembangunan` (`village_id`,`tahun`);--> statement-breakpoint
CREATE INDEX `bumindes_agenda_village_jenis_idx` ON `bumindes_agenda` (`village_id`,`jenis`);--> statement-breakpoint
CREATE INDEX `bumindes_aparat_village_idx` ON `bumindes_aparat` (`village_id`);--> statement-breakpoint
CREATE INDEX `bumindes_peraturan_village_jenis_idx` ON `bumindes_peraturan` (`village_id`,`jenis`);--> statement-breakpoint
CREATE INDEX `bumindes_tanah_kas_village_idx` ON `bumindes_tanah_kas` (`village_id`);--> statement-breakpoint
CREATE INDEX `bumindes_tanah_kas_mutasi_village_idx` ON `bumindes_tanah_kas_mutasi` (`village_id`);--> statement-breakpoint
CREATE INDEX `bumindes_tanah_kas_mutasi_persil_idx` ON `bumindes_tanah_kas_mutasi` (`tanah_kas_id`);--> statement-breakpoint
CREATE INDEX `bumindes_tanah_kas_mutasi_tenant_idx` ON `bumindes_tanah_kas_mutasi` (`village_id`,`tanah_kas_id`);--> statement-breakpoint
CREATE INDEX `bumindes_item_village_buku_idx` ON `bumindes_item` (`village_id`,`buku_id`);--> statement-breakpoint
CREATE INDEX `berita_village_status_idx` ON `berita` (`village_id`,`status`,`terbit_pada`);--> statement-breakpoint
CREATE INDEX `berita_kategori_idx` ON `berita` (`kategori_id`);--> statement-breakpoint
CREATE INDEX `berita_village_kategori_idx` ON `berita` (`village_id`,`kategori_id`);--> statement-breakpoint
CREATE INDEX `dokumen_publik_village_kategori_idx` ON `dokumen_publik` (`village_id`,`kategori`);--> statement-breakpoint
CREATE INDEX `galeri_album_village_category_published_idx` ON `galeri_album` (`village_id`,`kategori`,`published_at`);--> statement-breakpoint
CREATE INDEX `galeri_foto_village_idx` ON `galeri_foto` (`village_id`);--> statement-breakpoint
CREATE INDEX `galeri_foto_album_idx` ON `galeri_foto` (`album_id`);--> statement-breakpoint
CREATE INDEX `galeri_foto_village_album_idx` ON `galeri_foto` (`village_id`,`album_id`);--> statement-breakpoint
CREATE INDEX `menu_publik_village_idx` ON `menu_publik` (`village_id`,`urut`);--> statement-breakpoint
CREATE INDEX `perangkat_desa_village_idx` ON `perangkat_desa` (`village_id`);--> statement-breakpoint
CREATE INDEX `perangkat_desa_village_atasan_idx` ON `perangkat_desa` (`village_id`,`atasan_id`);--> statement-breakpoint
CREATE INDEX `perangkat_desa_jabatan_idx` ON `perangkat_desa` (`jabatan_id`);--> statement-breakpoint
CREATE INDEX `perangkat_desa_village_jabatan_idx` ON `perangkat_desa` (`village_id`,`jabatan_id`);--> statement-breakpoint
CREATE INDEX `perangkat_desa_village_resident_idx` ON `perangkat_desa` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `slider_village_idx` ON `slider` (`village_id`,`urut`);--> statement-breakpoint
CREATE INDEX `widget_village_idx` ON `widget` (`village_id`,`urut`);--> statement-breakpoint
CREATE INDEX `dokumen_warga_village_resident_idx` ON `dokumen_warga` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `dokumen_warga_village_jenis_idx` ON `dokumen_warga` (`village_id`,`jenis`);--> statement-breakpoint
CREATE INDEX `domain_dns_checks_status_idx` ON `domain_dns_checks` (`status`);--> statement-breakpoint
CREATE INDEX `domain_ssl_checks_status_idx` ON `domain_ssl_checks` (`status`);--> statement-breakpoint
CREATE INDEX `dtks_village_status_idx` ON `dtks` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `dtks_village_versi_idx` ON `dtks` (`village_id`,`versi_kuisioner`);--> statement-breakpoint
CREATE INDEX `dtks_rtm_idx` ON `dtks` (`rtm_id`);--> statement-breakpoint
CREATE INDEX `dtks_keluarga_idx` ON `dtks` (`keluarga_id`);--> statement-breakpoint
CREATE INDEX `dtks_village_keluarga_idx` ON `dtks` (`village_id`,`keluarga_id`);--> statement-breakpoint
CREATE INDEX `dtks_anggota_village_idx` ON `dtks_anggota` (`village_id`);--> statement-breakpoint
CREATE INDEX `dtks_anggota_dtks_idx` ON `dtks_anggota` (`dtks_id`);--> statement-breakpoint
CREATE INDEX `dtks_anggota_penduduk_idx` ON `dtks_anggota` (`penduduk_id`);--> statement-breakpoint
CREATE INDEX `dtks_anggota_village_dtks_idx` ON `dtks_anggota` (`village_id`,`dtks_id`);--> statement-breakpoint
CREATE INDEX `dtks_anggota_village_penduduk_idx` ON `dtks_anggota` (`village_id`,`penduduk_id`);--> statement-breakpoint
CREATE INDEX `dtks_lampiran_village_idx` ON `dtks_lampiran` (`village_id`);--> statement-breakpoint
CREATE INDEX `dtks_ref_lampiran_village_dtks_idx` ON `dtks_ref_lampiran` (`village_id`,`dtks_id`);--> statement-breakpoint
CREATE INDEX `dtks_ref_lampiran_village_lampiran_idx` ON `dtks_ref_lampiran` (`village_id`,`lampiran_id`);--> statement-breakpoint
CREATE INDEX `elections_village_status_idx` ON `elections` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `elections_village_tanggal_idx` ON `elections` (`village_id`,`tanggal`);--> statement-breakpoint
CREATE INDEX `family_member_logs_family_idx` ON `family_member_logs` (`family_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `family_member_logs_village_idx` ON `family_member_logs` (`village_id`);--> statement-breakpoint
CREATE INDEX `family_member_logs_resident_idx` ON `family_member_logs` (`resident_id`);--> statement-breakpoint
CREATE INDEX `family_member_logs_village_family_idx` ON `family_member_logs` (`village_id`,`family_id`);--> statement-breakpoint
CREATE INDEX `family_member_logs_village_resident_idx` ON `family_member_logs` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `families_region_idx` ON `families` (`region_id`);--> statement-breakpoint
CREATE INDEX `galeri_video_village_published_idx` ON `galeri_video` (`village_id`,`aktif`,`published_at`);--> statement-breakpoint
CREATE INDEX `area_village_sort_idx` ON `area` (`village_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `area_village_polygon_idx` ON `area` (`village_id`,`ref_polygon`);--> statement-breakpoint
CREATE INDEX `cdesa_village_sort_idx` ON `cdesa` (`village_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `cdesa_mutasi_village_cdesa_idx` ON `cdesa_mutasi` (`village_id`,`cdesa_id`);--> statement-breakpoint
CREATE INDEX `cdesa_rincian_village_cdesa_idx` ON `cdesa_rincian` (`village_id`,`cdesa_id`);--> statement-breakpoint
CREATE INDEX `garis_village_sort_idx` ON `garis` (`village_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `garis_village_ref_line_idx` ON `garis` (`village_id`,`ref_line`);--> statement-breakpoint
CREATE INDEX `gis_simbol_simbol_idx` ON `gis_simbol` (`simbol`);--> statement-breakpoint
CREATE INDEX `persil_village_sort_idx` ON `persil` (`village_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `point_village_sort_idx` ON `point` (`village_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `point_village_parrent_idx` ON `point` (`village_id`,`parrent`);--> statement-breakpoint
CREATE INDEX `polygon_village_sort_idx` ON `polygon` (`village_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `polygon_village_parrent_idx` ON `polygon` (`village_id`,`parrent`);--> statement-breakpoint
CREATE INDEX `incoming_letters_village_received_idx` ON `incoming_letters` (`village_id`,`received_date`);--> statement-breakpoint
CREATE INDEX `incoming_letters_village_classification_idx` ON `incoming_letters` (`village_id`,`classification_id`);--> statement-breakpoint
CREATE INDEX `bulanan_anak_village_idx` ON `bulanan_anak` (`village_id`);--> statement-breakpoint
CREATE INDEX `bulanan_anak_kia_idx` ON `bulanan_anak` (`kia_id`);--> statement-breakpoint
CREATE INDEX `ibu_hamil_village_idx` ON `ibu_hamil` (`village_id`);--> statement-breakpoint
CREATE INDEX `ibu_hamil_kia_idx` ON `ibu_hamil` (`kia_id`);--> statement-breakpoint
CREATE INDEX `kia_village_idx` ON `kia` (`village_id`);--> statement-breakpoint
CREATE INDEX `posyandu_village_idx` ON `posyandu` (`village_id`);--> statement-breakpoint
CREATE INDEX `sasaran_paud_village_idx` ON `sasaran_paud` (`village_id`);--> statement-breakpoint
CREATE INDEX `sasaran_paud_kia_idx` ON `sasaran_paud` (`kia_id`);--> statement-breakpoint
CREATE INDEX `layanan_publik_village_active_idx` ON `layanan_publik` (`village_id`,`aktif`);--> statement-breakpoint
CREATE INDEX `layanan_publik_village_name_idx` ON `layanan_publik` (`village_id`,`nama`);--> statement-breakpoint
CREATE INDEX `pengajuan_layanan_tenant_status_idx` ON `pengajuan_layanan` (`village_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `pengajuan_layanan_tenant_layanan_idx` ON `pengajuan_layanan` (`village_id`,`layanan_id`);--> statement-breakpoint
CREATE INDEX `riwayat_pengajuan_tenant_request_idx` ON `riwayat_pengajuan_layanan` (`village_id`,`pengajuan_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `pengajuan_layanan_berkas_tenant_request_idx` ON `pengajuan_layanan_berkas` (`village_id`,`pengajuan_id`);--> statement-breakpoint
CREATE INDEX `pengajuan_layanan_berkas_tenant_type_idx` ON `pengajuan_layanan_berkas` (`village_id`,`pengajuan_id`,`jenis`);--> statement-breakpoint
CREATE INDEX `pendapat_village_idx` ON `pendapat` (`village_id`);--> statement-breakpoint
CREATE INDEX `pendapat_created_idx` ON `pendapat` (`created_at`);--> statement-breakpoint
CREATE INDEX `pendapat_village_resident_idx` ON `pendapat` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `anggota_grup_kontak_village_idx` ON `anggota_grup_kontak` (`village_id`);--> statement-breakpoint
CREATE INDEX `anggota_grup_kontak_village_grup_idx` ON `anggota_grup_kontak` (`village_id`,`grup_id`);--> statement-breakpoint
CREATE INDEX `anggota_grup_kontak_village_kontak_idx` ON `anggota_grup_kontak` (`village_id`,`kontak_id`);--> statement-breakpoint
CREATE INDEX `kontak_village_idx` ON `kontak` (`village_id`);--> statement-breakpoint
CREATE INDEX `kontak_village_resident_idx` ON `kontak` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `kontak_grup_village_idx` ON `kontak_grup` (`village_id`);--> statement-breakpoint
CREATE INDEX `mailbox_pesan_village_created_idx` ON `mailbox_pesan` (`village_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `lembaga_anggota_village_lembaga_idx` ON `lembaga_anggota` (`village_id`,`lembaga_id`);--> statement-breakpoint
CREATE INDEX `lembaga_desa_village_status_idx` ON `lembaga_desa` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `pemerintahan_dokumen_village_idx` ON `pemerintahan_dokumen` (`village_id`);--> statement-breakpoint
CREATE INDEX `perangkat_riwayat_village_perangkat_idx` ON `perangkat_riwayat_jabatan` (`village_id`,`perangkat_id`);--> statement-breakpoint
CREATE INDEX `potensi_desa_village_category_active_idx` ON `potensi_desa` (`village_id`,`kategori`,`aktif`,`urut`);--> statement-breakpoint
CREATE INDEX `potensi_indikator_village_potensi_idx` ON `potensi_indikator` (`village_id`,`potensi_id`,`urut`);--> statement-breakpoint
CREATE INDEX `inv_village_kategori` ON `inventaris` (`village_id`,`kategori_id`);--> statement-breakpoint
CREATE INDEX `inv_village_no` ON `inventaris` (`village_id`,`nomor_inventaris`);--> statement-breakpoint
CREATE INDEX `inv_doc_village_asset` ON `inventaris_dokumen` (`village_id`,`inventaris_id`);--> statement-breakpoint
CREATE INDEX `inv_kat_village_kode` ON `inventaris_kategori` (`village_id`,`kode`);--> statement-breakpoint
CREATE INDEX `inv_mut_village_inv` ON `inventaris_mutasi` (`village_id`,`inventaris_id`);--> statement-breakpoint
CREATE INDEX `inv_mut_village_status` ON `inventaris_mutasi` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `inv_pem_village_date` ON `inventaris_pemeliharaan` (`village_id`,`tanggal_rencana`);--> statement-breakpoint
CREATE INDEX `inv_pem_village_status` ON `inventaris_pemeliharaan` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `inv_pem_hist_village_date` ON `inventaris_pemeliharaan_riwayat` (`village_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `inv_pem_hist_village_asset` ON `inventaris_pemeliharaan_riwayat` (`village_id`,`inventaris_id`);--> statement-breakpoint
CREATE INDEX `inv_pj_village_asset_date` ON `inventaris_penanggung_jawab_riwayat` (`village_id`,`inventaris_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `keuangan_village_tahun_idx` ON `keuangan` (`village_id`,`tahun`);--> statement-breakpoint
CREATE INDEX `idx_keuangan_jurnal_village_tahun` ON `keuangan_jurnal` (`village_id`,`tahun`);--> statement-breakpoint
CREATE INDEX `idx_keuangan_jurnal_tanggal` ON `keuangan_jurnal` (`tanggal`);--> statement-breakpoint
CREATE INDEX `keuangan_laporan_village_tahun_idx` ON `keuangan_laporan` (`village_id`,`tahun`);--> statement-breakpoint
CREATE INDEX `keuangan_template_parent_idx` ON `keuangan_template` (`parent_uuid`);--> statement-breakpoint
CREATE INDEX `keuangan_transaksi_village_idx` ON `keuangan_transaksi` (`village_id`);--> statement-breakpoint
CREATE INDEX `keuangan_transaksi_jenis_idx` ON `keuangan_transaksi` (`jenis`);--> statement-breakpoint
CREATE INDEX `keuangan_triwulan_village_tahun_idx` ON `keuangan_triwulan` (`village_id`,`tahun`);--> statement-breakpoint
CREATE INDEX `laporan_penduduk_village_tahun_idx` ON `laporan_penduduk` (`village_id`,`tahun`);--> statement-breakpoint
CREATE INDEX `kelompok_village_type_idx` ON `kelompok` (`village_id`,`type`);--> statement-breakpoint
CREATE INDEX `kelompok_category_idx` ON `kelompok` (`category_id`);--> statement-breakpoint
CREATE INDEX `kelompok_village_category_idx` ON `kelompok` (`village_id`,`category_id`);--> statement-breakpoint
CREATE INDEX `kelompok_anggota_kelompok_idx` ON `kelompok_anggota` (`kelompok_id`);--> statement-breakpoint
CREATE INDEX `kelompok_anggota_resident_idx` ON `kelompok_anggota` (`resident_id`);--> statement-breakpoint
CREATE INDEX `kelompok_anggota_village_resident_idx` ON `kelompok_anggota` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `kelompok_anggota_village_kelompok_idx` ON `kelompok_anggota` (`village_id`,`kelompok_id`);--> statement-breakpoint
CREATE INDEX `letter_dinas_village_date_idx` ON `letter_dinas` (`village_id`,`letter_date`);--> statement-breakpoint
CREATE INDEX `letter_dinas_village_classification_idx` ON `letter_dinas` (`village_id`,`classification_id`);--> statement-breakpoint
CREATE INDEX `letter_requirements_village_idx` ON `letter_requirements` (`village_id`);--> statement-breakpoint
CREATE INDEX `letter_types_village_classification_idx` ON `letter_types` (`village_id`,`classification_id`);--> statement-breakpoint
CREATE INDEX `letters_village_type_year_idx` ON `letters` (`village_id`,`type_id`,`year`);--> statement-breakpoint
CREATE INDEX `letters_village_status_idx` ON `letters` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `letter_number_archive_type_year_idx` ON `letter_number_archive` (`village_id`,`type_id`,`year`);--> statement-breakpoint
CREATE INDEX `letter_number_archive_class_year_idx` ON `letter_number_archive` (`village_id`,`classification_id`,`year`);--> statement-breakpoint
CREATE INDEX `letter_number_archive_year_idx` ON `letter_number_archive` (`village_id`,`year`);--> statement-breakpoint
CREATE INDEX `letter_number_archive_village_letter_idx` ON `letter_number_archive` (`village_id`,`letter_id`);--> statement-breakpoint
CREATE INDEX `outgoing_letters_village_letter_date_idx` ON `outgoing_letters` (`village_id`,`letter_date`);--> statement-breakpoint
CREATE INDEX `outgoing_letters_village_classification_idx` ON `outgoing_letters` (`village_id`,`classification_id`);--> statement-breakpoint
CREATE INDEX `pembangunan_dokumentasi_village_proyek_idx` ON `pembangunan_dokumentasi` (`village_id`,`proyek_id`);--> statement-breakpoint
CREATE INDEX `pembangunan_proyek_village_tahun_idx` ON `pembangunan_proyek` (`village_id`,`tahun_anggaran`);--> statement-breakpoint
CREATE INDEX `pembangunan_proyek_village_status_idx` ON `pembangunan_proyek` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `pengaduan_village_status_idx` ON `pengaduan` (`village_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `pengaduan_village_publik_idx` ON `pengaduan` (`village_id`,`publik`);--> statement-breakpoint
CREATE INDEX `permohonan_surat_village_status_idx` ON `permohonan_surat` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `permohonan_surat_village_created_idx` ON `permohonan_surat` (`village_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `permohonan_surat_letter_idx` ON `permohonan_surat` (`letter_id`);--> statement-breakpoint
CREATE INDEX `modules_parent_idx` ON `modules` (`parent_id`);--> statement-breakpoint
CREATE INDEX `role_permissions_module_idx` ON `role_permissions` (`module_id`);--> statement-breakpoint
CREATE INDEX `regions_village_sort_idx` ON `regions` (`village_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `regions_village_kepala_idx` ON `regions` (`village_id`,`kepala_resident_id`);--> statement-breakpoint
CREATE INDEX `residents_village_name_idx` ON `residents` (`village_id`,`name`);--> statement-breakpoint
CREATE INDEX `residents_village_family_idx` ON `residents` (`village_id`,`family_id`);--> statement-breakpoint
CREATE INDEX `residents_village_life_status_idx` ON `residents` (`village_id`,`life_status`);--> statement-breakpoint
CREATE INDEX `residents_region_idx` ON `residents` (`region_id`);--> statement-breakpoint
CREATE INDEX `resident_mutations_village_type_idx` ON `resident_mutations` (`village_id`,`type`);--> statement-breakpoint
CREATE INDEX `resident_mutations_village_date_idx` ON `resident_mutations` (`village_id`,`event_date`);--> statement-breakpoint
CREATE INDEX `resident_mutations_resident_idx` ON `resident_mutations` (`resident_id`);--> statement-breakpoint
CREATE INDEX `resident_mutations_village_resident_idx` ON `resident_mutations` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `resident_mutations_village_from_region_idx` ON `resident_mutations` (`village_id`,`from_region_id`);--> statement-breakpoint
CREATE INDEX `resident_mutations_village_to_region_idx` ON `resident_mutations` (`village_id`,`to_region_id`);--> statement-breakpoint
CREATE INDEX `resident_mutations_reported_at_idx` ON `resident_mutations` (`reported_at`);--> statement-breakpoint
CREATE INDEX `rtm_region_idx` ON `rtm` (`region_id`);--> statement-breakpoint
CREATE INDEX `suplemen_terdata_suplemen_idx` ON `suplemen_terdata` (`id_suplemen`);--> statement-breakpoint
CREATE INDEX `suplemen_terdata_penduduk_idx` ON `suplemen_terdata` (`penduduk_id`);--> statement-breakpoint
CREATE INDEX `suplemen_terdata_keluarga_idx` ON `suplemen_terdata` (`keluarga_id`);--> statement-breakpoint
CREATE INDEX `suplemen_terdata_village_suplemen_idx` ON `suplemen_terdata` (`village_id`,`id_suplemen`);--> statement-breakpoint
CREATE INDEX `suplemen_terdata_village_penduduk_idx` ON `suplemen_terdata` (`village_id`,`penduduk_id`);--> statement-breakpoint
CREATE INDEX `suplemen_terdata_village_keluarga_idx` ON `suplemen_terdata` (`village_id`,`keluarga_id`);--> statement-breakpoint
CREATE INDEX `survey_jawaban_village_responden_idx` ON `survey_jawaban` (`village_id`,`responden_id`);--> statement-breakpoint
CREATE INDEX `survey_jawaban_village_soal_idx` ON `survey_jawaban` (`village_id`,`soal_id`);--> statement-breakpoint
CREATE INDEX `survey_responden_village_survey_idx` ON `survey_responden` (`village_id`,`survey_id`);--> statement-breakpoint
CREATE INDEX `survey_soal_village_survey_idx` ON `survey_soal` (`village_id`,`survey_id`);--> statement-breakpoint
CREATE INDEX `survey_soal_village_indikator_idx` ON `survey_soal` (`village_id`,`indikator_id`);--> statement-breakpoint
CREATE INDEX `tenant_domain_tombstones_village_idx` ON `tenant_domain_tombstones` (`village_id`);--> statement-breakpoint
CREATE INDEX `tenant_exports_village_idx` ON `tenant_exports` (`village_id`,`dibuat_pada`);--> statement-breakpoint
CREATE INDEX `village_domains_village_idx` ON `village_domains` (`village_id`);--> statement-breakpoint
CREATE INDEX `website_templates_status_idx` ON `website_templates` (`status`);--> statement-breakpoint
CREATE INDEX `website_templates_category_idx` ON `website_templates` (`category`);--> statement-breakpoint
CREATE INDEX `rate_limit_entries_expires_idx` ON `rate_limit_entries` (`expires_at`);--> statement-breakpoint
CREATE INDEX `pemilihan_kandidat_pemilihan_idx` ON `pemilihan_kandidat` (`pemilihan_id`);--> statement-breakpoint
CREATE INDEX `pemilihan_kandidat_village_pemilihan_idx` ON `pemilihan_kandidat` (`village_id`,`pemilihan_id`);--> statement-breakpoint
CREATE INDEX `registrasi_warga_tenant_status_idx` ON `registrasi_warga` (`village_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `registrasi_warga_tenant_nik_idx` ON `registrasi_warga` (`village_id`,`nik`);--> statement-breakpoint
CREATE INDEX `lapak_village_resident_idx` ON `lapak` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `kehadiran_pengaduan_village_waktu_idx` ON `kehadiran_pengaduan` (`village_id`,`waktu`);--> statement-breakpoint
CREATE INDEX `kehadiran_pengaduan_village_pegawai_idx` ON `kehadiran_pengaduan` (`village_id`,`terlapor_id`);--> statement-breakpoint
CREATE INDEX `kehadiran_perangkat_village_tanggal_idx` ON `kehadiran_perangkat` (`village_id`,`tanggal`);--> statement-breakpoint
CREATE INDEX `kehadiran_perangkat_village_pegawai_idx` ON `kehadiran_perangkat` (`village_id`,`pegawai_id`);--> statement-breakpoint
CREATE INDEX `kehadiran_perangkat_village_status_idx` ON `kehadiran_perangkat` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `cuti_pegawai_village_status_idx` ON `cuti_pegawai` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `cuti_pegawai_village_pegawai_idx` ON `cuti_pegawai` (`village_id`,`pegawai_id`);--> statement-breakpoint
CREATE INDEX `cuti_pegawai_village_dates_idx` ON `cuti_pegawai` (`village_id`,`mulai`,`selesai`);--> statement-breakpoint
CREATE INDEX `kepegawaian_dokumen_village_pegawai_idx` ON `kepegawaian_dokumen` (`village_id`,`pegawai_id`);--> statement-breakpoint
CREATE INDEX `kepegawaian_pegawai_village_status_idx` ON `kepegawaian_pegawai` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `kepegawaian_pegawai_village_jabatan_idx` ON `kepegawaian_pegawai` (`village_id`,`jabatan`);--> statement-breakpoint
CREATE INDEX `kepegawaian_riwayat_village_pegawai_idx` ON `kepegawaian_riwayat` (`village_id`,`pegawai_id`);--> statement-breakpoint
CREATE INDEX `incoming_letter_dispositions_village_idx` ON `incoming_letter_dispositions` (`village_id`);--> statement-breakpoint
CREATE INDEX `incoming_letter_dispositions_letter_idx` ON `incoming_letter_dispositions` (`incoming_letter_id`);--> statement-breakpoint
CREATE INDEX `ild_village_letter_idx` ON `incoming_letter_dispositions` (`village_id`,`incoming_letter_id`);--> statement-breakpoint
CREATE INDEX `letter_agenda_logs_village_idx` ON `letter_agenda_logs` (`village_id`);--> statement-breakpoint
CREATE INDEX `outgoing_letter_shipments_village_idx` ON `outgoing_letter_shipments` (`village_id`);--> statement-breakpoint
CREATE INDEX `outgoing_letter_shipments_letter_idx` ON `outgoing_letter_shipments` (`outgoing_letter_id`);--> statement-breakpoint
CREATE INDEX `ols_village_letter_idx` ON `outgoing_letter_shipments` (`village_id`,`outgoing_letter_id`);--> statement-breakpoint
CREATE INDEX `surat_audit_trail_village_idx` ON `surat_audit_trail` (`village_id`);--> statement-breakpoint
CREATE INDEX `surat_audit_trail_entity_idx` ON `surat_audit_trail` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `unified_shipments_village_idx` ON `unified_shipments` (`village_id`);--> statement-breakpoint
CREATE INDEX `unified_shipments_source_idx` ON `unified_shipments` (`source_module`,`source_id`);--> statement-breakpoint
CREATE INDEX `komentar_village_halaman_idx` ON `komentar` (`village_id`,`halaman`);--> statement-breakpoint
CREATE INDEX `komentar_village_status_idx` ON `komentar` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `pengunjung_log_village_halaman_tanggal_idx` ON `pengunjung_log` (`village_id`,`halaman`,`tanggal`);--> statement-breakpoint
CREATE INDEX `warga_pesan_village_resident_idx` ON `warga_pesan` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `warga_pesan_village_created_idx` ON `warga_pesan` (`village_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifikasi_village_resident_idx` ON `notifikasi_terkirim` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `kehadiran_izin_village_status_idx` ON `kehadiran_izin` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `kehadiran_izin_village_resident_idx` ON `kehadiran_izin` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `kehadiran_pengaturan_village_idx` ON `kehadiran_pengaturan` (`village_id`);--> statement-breakpoint
CREATE INDEX `verifikasi_kontak_resident_idx` ON `verifikasi_kontak` (`village_id`,`resident_id`);--> statement-breakpoint
CREATE INDEX `lapak_produk_village_lapak_idx` ON `lapak_produk` (`village_id`,`lapak_id`);--> statement-breakpoint
CREATE INDEX `umpan_balik_village_status_idx` ON `umpan_balik` (`village_id`,`status`);--> statement-breakpoint
CREATE INDEX `umpan_balik_village_created_idx` ON `umpan_balik` (`village_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `keuangan_bulanan_village_year_idx` ON `keuangan_bulanan` (`village_id`,`tahun`);--> statement-breakpoint
CREATE INDEX `village_blocked_ip_lookup_idx` ON `village_blocked_ips` (`village_id`,`ip_address`,`expires_at`);--> statement-breakpoint
CREATE INDEX `two_factor_user_idx` ON `two_factor` (`user_id`);--> statement-breakpoint
CREATE INDEX `password_history_user_created_idx` ON `password_history` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE TRIGGER users_role_tenant_bi BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  DECLARE role_village INT DEFAULT NULL;
  IF NEW.role_id IS NOT NULL THEN
    SELECT village_id INTO role_village FROM roles WHERE id = NEW.role_id;
    IF (NEW.village_id IS NULL AND role_village IS NOT NULL)
       OR (NEW.village_id IS NOT NULL
           AND (role_village IS NULL OR role_village <> NEW.village_id)) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role tidak sesuai tenant akun.';
    END IF;
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER users_role_tenant_bu BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  DECLARE role_village INT DEFAULT NULL;
  IF NEW.role_id IS NOT NULL THEN
    SELECT village_id INTO role_village FROM roles WHERE id = NEW.role_id;
    IF (NEW.village_id IS NULL AND role_village IS NOT NULL)
       OR (NEW.village_id IS NOT NULL
           AND (role_village IS NULL OR role_village <> NEW.village_id)) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role tidak sesuai tenant akun.';
    END IF;
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER roles_tenant_village_bu BEFORE UPDATE ON roles
FOR EACH ROW
BEGIN
  IF NOT (NEW.village_id <=> OLD.village_id)
     AND EXISTS (SELECT 1 FROM users WHERE role_id = OLD.id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role yang dipakai tidak dapat dipindah tenant.';
  END IF;
END;
--> statement-breakpoint
INSERT INTO `website_templates` (`slug`, `name`, `category`, `description`, `version`, `status`, `tokens`, `tags`, `created_by`) VALUES (
	'esensi',
	'Esensi',
	'umum',
	'Tema bawaan platform yang dipakai tenant baru. Komposisi bersih dengan aksen biru, hero besar, dan kartu informasi yang mudah dipindai.',
	'1.0.0',
	'published',
	'{"primary":"#2563eb","secondary":"#1e40af","accent":"#f59e0b","background":"#f8fafc","surface":"#ffffff","text":"#0f172a","fontHeading":"serif","radius":"sedang","style":"terang"}',
	'["umum","pedesaan","layanan"]',
	NULL
);--> statement-breakpoint
INSERT INTO `website_template_versions` (`template_id`, `version`, `changelog`, `tokens`) VALUES (
	(SELECT `id` FROM `website_templates` WHERE `slug` = 'esensi'),
	'1.0.0',
	'Versi awal bawaan platform.',
	'{"primary":"#2563eb","secondary":"#1e40af","accent":"#f59e0b","background":"#f8fafc","surface":"#ffffff","text":"#0f172a","fontHeading":"serif","radius":"sedang","style":"terang"}'
);
--> statement-breakpoint
-- ===== 0001_paket_langganan.sql =====
CREATE TABLE `subscription_plan_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_version_id` int NOT NULL,
	`module_slug` varchar(100) NOT NULL,
	CONSTRAINT `subscription_plan_features_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plan_features_version_module_uq` UNIQUE(`plan_version_id`,`module_slug`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plan_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_id` int NOT NULL,
	`version` int NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`changelog` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`published_at` timestamp,
	CONSTRAINT `subscription_plan_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plan_versions_plan_version_uq` UNIQUE(`plan_id`,`version`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `village_plan_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`plan_version_id` int NOT NULL,
	`assigned_by` varchar(36),
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `village_plan_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `village_plan_subscriptions_village_uq` UNIQUE(`village_id`)
);
--> statement-breakpoint
ALTER TABLE `subscription_plan_features` ADD CONSTRAINT `subscription_plan_features_version_fk` FOREIGN KEY (`plan_version_id`) REFERENCES `subscription_plan_versions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_plan_versions` ADD CONSTRAINT `subscription_plan_versions_plan_fk` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `village_plan_subscriptions` ADD CONSTRAINT `village_plan_subscriptions_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `village_plan_subscriptions` ADD CONSTRAINT `village_plan_subscriptions_version_fk` FOREIGN KEY (`plan_version_id`) REFERENCES `subscription_plan_versions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `subscription_plan_features_module_idx` ON `subscription_plan_features` (`module_slug`);--> statement-breakpoint
CREATE INDEX `subscription_plan_versions_plan_status_idx` ON `subscription_plan_versions` (`plan_id`,`status`);--> statement-breakpoint
CREATE INDEX `subscription_plans_status_idx` ON `subscription_plans` (`status`);--> statement-breakpoint
CREATE INDEX `village_plan_subscriptions_version_idx` ON `village_plan_subscriptions` (`plan_version_id`);
--> statement-breakpoint
INSERT INTO `subscription_plans` (`slug`, `name`, `status`) VALUES
  ('minimum', 'Minimum', 'active'),
  ('standar', 'Standar', 'active'),
  ('premium', 'Premium', 'active');
--> statement-breakpoint
INSERT INTO `subscription_plan_versions` (`plan_id`, `version`, `status`)
SELECT `id`, 1, 'draft'
FROM `subscription_plans`
WHERE `slug` IN ('minimum', 'standar', 'premium');
--> statement-breakpoint
-- ===== 0002_paket_seed_terbit.sql =====
UPDATE `subscription_plan_versions` SET `status` = 'published', `published_at` = NOW() WHERE `status` = 'draft' AND `plan_id` IN (SELECT `id` FROM `subscription_plans` WHERE `slug` IN ('minimum', 'standar', 'premium'));
--> statement-breakpoint
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`) SELECT v.`id`, x.`module_slug` FROM `subscription_plan_versions` v JOIN `subscription_plans` p ON p.`id` = v.`plan_id` JOIN (SELECT 'pengaturan-desa' AS module_slug UNION ALL SELECT 'wilayah' UNION ALL SELECT 'perangkat-desa' UNION ALL SELECT 'lembaga-desa' UNION ALL SELECT 'status-desa' UNION ALL SELECT 'penduduk' UNION ALL SELECT 'keluarga' UNION ALL SELECT 'statistik-kependudukan' UNION ALL SELECT 'permohonan-surat' UNION ALL SELECT 'pengguna') x WHERE p.`slug` = 'minimum' AND v.`version` = 1;
--> statement-breakpoint
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`) SELECT v.`id`, x.`module_slug` FROM `subscription_plan_versions` v JOIN `subscription_plans` p ON p.`id` = v.`plan_id` JOIN (SELECT 'pengaturan-desa' AS module_slug UNION ALL SELECT 'wilayah' UNION ALL SELECT 'perangkat-desa' UNION ALL SELECT 'lembaga-desa' UNION ALL SELECT 'status-desa' UNION ALL SELECT 'penduduk' UNION ALL SELECT 'keluarga' UNION ALL SELECT 'statistik-kependudukan' UNION ALL SELECT 'permohonan-surat' UNION ALL SELECT 'pengguna' UNION ALL SELECT 'rumah-tangga' UNION ALL SELECT 'kelompok' UNION ALL SELECT 'suplemen' UNION ALL SELECT 'calon-pemilih' UNION ALL SELECT 'laporan-bulanan' UNION ALL SELECT 'laporan-kelompok-rentan' UNION ALL SELECT 'laporan-penduduk' UNION ALL SELECT 'stunting' UNION ALL SELECT 'pengaduan-kehadiran' UNION ALL SELECT 'rekapitulasi-kehadiran' UNION ALL SELECT 'inventaris' UNION ALL SELECT 'bumindes' UNION ALL SELECT 'laporan-keuangan' UNION ALL SELECT 'peta') x WHERE p.`slug` = 'standar' AND v.`version` = 1;
--> statement-breakpoint
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`) SELECT v.`id`, x.`module_slug` FROM `subscription_plan_versions` v JOIN `subscription_plans` p ON p.`id` = v.`plan_id` JOIN (SELECT 'pengaturan-desa' AS module_slug UNION ALL SELECT 'wilayah' UNION ALL SELECT 'perangkat-desa' UNION ALL SELECT 'lembaga-desa' UNION ALL SELECT 'status-desa' UNION ALL SELECT 'penduduk' UNION ALL SELECT 'keluarga' UNION ALL SELECT 'statistik-kependudukan' UNION ALL SELECT 'permohonan-surat' UNION ALL SELECT 'pengguna' UNION ALL SELECT 'rumah-tangga' UNION ALL SELECT 'kelompok' UNION ALL SELECT 'suplemen' UNION ALL SELECT 'calon-pemilih' UNION ALL SELECT 'laporan-bulanan' UNION ALL SELECT 'laporan-kelompok-rentan' UNION ALL SELECT 'laporan-penduduk' UNION ALL SELECT 'stunting' UNION ALL SELECT 'pengaduan-kehadiran' UNION ALL SELECT 'rekapitulasi-kehadiran' UNION ALL SELECT 'inventaris' UNION ALL SELECT 'bumindes' UNION ALL SELECT 'laporan-keuangan' UNION ALL SELECT 'peta' UNION ALL SELECT 'pengaduan' UNION ALL SELECT 'website-pengaturan' UNION ALL SELECT 'berita' UNION ALL SELECT 'galeri') x WHERE p.`slug` = 'premium' AND v.`version` = 1;

--> statement-breakpoint
-- ===== 0003_kehadiran_jam_libur_alasan.sql =====
CREATE TABLE `kehadiran_alasan_keluar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`alasan` varchar(255) NOT NULL,
	`keterangan` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kehadiran_alasan_keluar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kehadiran_hari_libur` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tanggal` date NOT NULL,
	`keterangan` text,
	CONSTRAINT `kehadiran_hari_libur_id` PRIMARY KEY(`id`),
	CONSTRAINT `kehadiran_hari_libur_village_tanggal_uq` UNIQUE(`village_id`,`tanggal`)
);
--> statement-breakpoint
CREATE TABLE `kehadiran_jam_kerja` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama_hari` varchar(65) NOT NULL,
	`jam_masuk` time NOT NULL,
	`jam_keluar` time NOT NULL,
	`status` boolean NOT NULL DEFAULT true,
	`keterangan` text,
	CONSTRAINT `kehadiran_jam_kerja_id` PRIMARY KEY(`id`),
	CONSTRAINT `kehadiran_jam_kerja_village_hari_uq` UNIQUE(`village_id`,`nama_hari`)
);
--> statement-breakpoint
ALTER TABLE `kehadiran_alasan_keluar` ADD CONSTRAINT `kehadiran_alasan_keluar_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_hari_libur` ADD CONSTRAINT `kehadiran_hari_libur_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_jam_kerja` ADD CONSTRAINT `kehadiran_jam_kerja_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `kehadiran_alasan_keluar_village_idx` ON `kehadiran_alasan_keluar` (`village_id`);
--> statement-breakpoint
-- ===== 0004_hari_libur_rute.sql =====
-- Halaman Hari Libur sudah tersedia di /kehadiran/hari-libur.
-- Baris modul tenant lama dibuat saat provisioning dari template sehingga masih
-- menyimpan URL placeholder /segera/hari-libur; arahkan ke rute sebenarnya.
-- Perubahan hanya pada kolom `url`, tanpa menyentuh izin, status, atau urutan.
UPDATE `modules`
SET `url` = '/kehadiran/hari-libur'
WHERE `slug` = 'hari-libur' AND `url` = '/segera/hari-libur';

--> statement-breakpoint
-- ===== 0005_jam_kerja_rute.sql =====
-- Halaman Jam Kerja sudah tersedia di /kehadiran/jam-kerja.
-- Baris modul tenant lama dibuat saat provisioning dari template sehingga masih
-- menyimpan URL placeholder /segera/jam-kerja; arahkan ke rute sebenarnya.
-- Perubahan hanya pada kolom `url`, tanpa menyentuh izin, status, atau urutan.
UPDATE `modules`
SET `url` = '/kehadiran/jam-kerja'
WHERE `slug` = 'jam-kerja' AND `url` = '/segera/jam-kerja';

--> statement-breakpoint
-- ===== 0006_pengajuan_izin_modul.sql =====
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

--> statement-breakpoint
-- ===== 0007_kehadiran_fitur_paket.sql =====
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

--> statement-breakpoint
-- ===== 0008_alasan_keluar_rute.sql =====
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

--> statement-breakpoint
-- ===== 0009_cetak_surat_rute.sql =====
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

--> statement-breakpoint
-- ===== 0010_pengaturan_surat_rute.sql =====
-- Menu Layanan Surat → Pengaturan Surat kini menuju halaman nyata
-- (`/persuratan/jenis-surat`) dan diletakkan paling atas seperti OpenSID.
UPDATE `modules`
SET `url` = '/persuratan/jenis-surat', `sort_order` = 1
WHERE `slug` = 'pengaturan-surat'
  AND `url` <> '/persuratan/jenis-surat';

--> statement-breakpoint
-- ===== 0011_permohonan_di_bawah_cetak.sql =====
-- Permohonan Surat dipindah tepat di bawah Cetak Surat pada grup Layanan Surat,
-- dan Arsip Layanan digeser satu langkah agar tidak bertabrakan urutannya.
UPDATE `modules`
SET `sort_order` = 14
WHERE `slug` = 'permohonan-surat' AND `sort_order` = 2;
--> statement-breakpoint
UPDATE `modules`
SET `sort_order` = 15
WHERE `slug` = 'arsip-layanan' AND `sort_order` = 14;

--> statement-breakpoint
-- ===== 0012_pengaturan_surat_fitur.sql =====
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

--> statement-breakpoint
-- ===== 0013_permohonan_surat_akses_operator.sql =====
-- Operator dan sekretaris dapat memproses Permohonan Surat (periksa, kembalikan,
-- batalkan, tandai siap/sudah diambil) seperti hak `u` di OpenSID.
-- Hak hapus (`h`) tetap khusus administrator, jadi `can_delete` tidak diubah.
UPDATE `role_permissions` rp
JOIN `modules` m ON m.`id` = rp.`module_id`
JOIN `roles` r ON r.`id` = rp.`role_id`
SET rp.`access` = 'write',
    rp.`can_read` = 1,
    rp.`can_create` = 1,
    rp.`can_update` = 1
WHERE m.`slug` = 'permohonan-surat'
  AND r.`slug` IN ('operator', 'sekretaris');

--> statement-breakpoint
-- ===== 0014_modul_surat.sql =====
-- Resource `surat` belum pernah terdaftar sebagai modul tenant, sehingga seluruh
-- alur persuratan (/persuratan/surat) tertutup izinnya dan operator tidak bisa
-- membuat konsep surat. Tambahkan baris modul "Daftar Surat" di grup Layanan
-- Surat untuk tenant yang belum memilikinya.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT g.`village_id`, 'surat', 'Daftar Surat', '/persuratan/surat', NULL, 0, 0, 1, 2, g.`id`
FROM `modules` g
WHERE g.`slug` = 'layanan-surat'
  AND NOT EXISTS (
    SELECT 1 FROM `modules` x WHERE x.`village_id` = g.`village_id` AND x.`slug` = 'surat'
  );
--> statement-breakpoint
-- Administrator mengelola (termasuk hapus); operator membuat konsep, sekretaris
-- dan kepala desa memverifikasi/menandatangani — setara hak `u` di OpenSID.
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`,
       CASE WHEN r.`slug` = 'administrator' THEN 'manage' ELSE 'write' END,
       1,
       1,
       1,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` = 'surat'
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
-- Fitur `surat` juga harus aktif pada paket yang menyediakan layanan surat,
-- karena modul yang tidak ada di paket akan tersaring dari izin efektif.
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, 'surat'
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` f
    WHERE f.`plan_version_id` = v.`id` AND f.`module_slug` = 'surat'
  );

--> statement-breakpoint
-- ===== 0016_modul_surat_tersembunyi.sql =====
-- Modul `surat` adalah modul izin, bukan submenu: halaman /persuratan/surat
-- dibuka lewat Cetak Surat/Dashboard Surat. Rapikan baris yang sempat dibuat
-- sebagai menu biasa agar tidak muncul di sidebar.
UPDATE `modules`
SET `url` = NULL,
    `is_hidden` = 1,
    `parent_id` = 0,
    `sort_order` = 27
WHERE `slug` = 'surat';

--> statement-breakpoint
-- ===== 0017_letter_types_lampiran_mandiri.sql =====
-- Parity Pengaturan Surat OpenSID: daftar lampiran surat dan opsi
-- "Sediakan di Layanan Mandiri" pada setiap jenis surat.
ALTER TABLE `letter_types`
  ADD COLUMN `lampiran` text,
  ADD COLUMN `mandiri` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
-- Jenis surat yang sudah ada selama ini tampil di katalog layanan publik;
-- pertahankan perilaku itu dengan menandainya tersedia di layanan mandiri.
UPDATE `letter_types` SET `mandiri` = true;

--> statement-breakpoint
-- ===== 0018_modul_surat_master.sql =====
-- Resource `jenis-surat`, `surat-masuk`, `surat-keluar`, dan `surat-dinas`
-- dipakai use case persuratan tetapi belum pernah terdaftar sebagai modul,
-- sehingga halaman /persuratan/jenis-surat (dan buku agenda/surat dinas)
-- melempar 403 untuk semua role tenant. Daftarkan sebagai modul izin
-- tersembunyi tanpa menu, sama seperti modul `surat`.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'jenis-surat', 'Jenis Surat', NULL, NULL, 0, 1, 1, 28, 0
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'jenis-surat'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'surat-masuk', 'Surat Masuk', NULL, NULL, 0, 1, 1, 29, 0
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'surat-masuk'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'surat-keluar', 'Surat Keluar', NULL, NULL, 0, 1, 1, 30, 0
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'surat-keluar'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'surat-dinas', 'Surat Dinas', NULL, NULL, 0, 1, 1, 31, 0
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'surat-dinas'
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
WHERE m.`slug` IN ('jenis-surat', 'surat-masuk', 'surat-keluar', 'surat-dinas')
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
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
  SELECT 'jenis-surat' AS slug UNION ALL
  SELECT 'surat-masuk' UNION ALL
  SELECT 'surat-keluar' UNION ALL
  SELECT 'surat-dinas'
) f
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` x
    WHERE x.`plan_version_id` = v.`id` AND x.`module_slug` = f.`slug`
  );

--> statement-breakpoint
-- ===== 0019_syarat_surat_rute.sql =====
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

--> statement-breakpoint
-- ===== 0020_klasifikasi_surat_paritas.sql =====
-- Parity `klasifikasi_surat` OpenSID: kode sampai 50 karakter dan status
-- aktif/nonaktif (`enabled`). Uraian sudah memakai kolom description.
ALTER TABLE `letter_classifications`
  ADD COLUMN `is_active` boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE `letter_classifications`
  MODIFY `code` varchar(50) NOT NULL;
--> statement-breakpoint
-- Menu Layanan Surat → Klasifikasi Surat kini menuju halaman nyata.
UPDATE `modules`
SET `url` = '/persuratan/klasifikasi-surat'
WHERE `slug` = 'klasifikasi-surat'
  AND (`url` IS NULL OR `url` <> '/persuratan/klasifikasi-surat');
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'klasifikasi-surat', 'Klasifikasi Surat', '/persuratan/klasifikasi-surat', NULL, 0, 0, 1, 9,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'layanan-surat' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'klasifikasi-surat'
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
WHERE m.`slug` = 'klasifikasi-surat'
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint
INSERT INTO `subscription_plan_features` (`plan_version_id`, `module_slug`)
SELECT v.`id`, 'klasifikasi-surat'
FROM `subscription_plan_versions` v
JOIN `subscription_plans` p ON p.`id` = v.`plan_id`
WHERE p.`slug` IN ('minimum', 'standar', 'premium')
  AND v.`status` = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM `subscription_plan_features` f
    WHERE f.`plan_version_id` = v.`id` AND f.`module_slug` = 'klasifikasi-surat'
  );

--> statement-breakpoint
-- ===== 0021_penataan_menu.sql =====
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
UPDATE `modules` SET `url` = '/satu-data/bantuan', `is_hidden` = 0, `sort_order` = 2 WHERE `slug` = 'bantuan';
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
SELECT v.`id`, 'lapak', 'Lapak', '/pelayanan-publik/lapak', NULL, 0, 0, 1, 4,
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

--> statement-breakpoint
-- ===== 0022_hapus_modul_covid.sql =====
-- Hapus modul Covid (Pendataan Covid & Pemantauan Covid) sesuai keputusan
-- pengguna: fitur Covid tidak diperlukan lagi di Appdes.
-- Baris modul dihapus pada semua desa; grant role_permissions ikut terhapus
-- lewat ON DELETE CASCADE pada `role_permissions.module_id`.
-- Template tenant baru sudah tidak memuat kedua modul ini.
DELETE rp FROM `role_permissions` rp
JOIN `modules` m ON m.`id` = rp.`module_id`
WHERE m.`slug` IN ('covid-pendataan', 'covid-pemantauan');
--> statement-breakpoint
DELETE FROM `modules`
WHERE `slug` IN ('covid-pendataan', 'covid-pemantauan');

--> statement-breakpoint
-- ===== 0023_hapus_modul_vaksin.sql =====
-- Hapus modul Vaksin, bagian dari fitur Kesehatan Covid OpenSID
-- (`vaksin_covid`), mengikuti penghapusan Pendataan & Pemantauan Covid.
-- Baris modul dihapus pada semua desa; grant role_permissions ikut terhapus
-- lewat ON DELETE CASCADE pada `role_permissions.module_id`.
-- Template tenant baru sudah tidak memuat modul ini.
DELETE rp FROM `role_permissions` rp
JOIN `modules` m ON m.`id` = rp.`module_id`
WHERE m.`slug` = 'vaksin';
--> statement-breakpoint
DELETE FROM `modules`
WHERE `slug` = 'vaksin';

--> statement-breakpoint
-- ===== 0024_hapus_pengguna_shortcut.sql =====
-- Hapus tabel pintasan beranda (`pengguna_shortcut`).
-- Fitur Pintasan Saya sudah dihapus dari beranda beserta use case, repository,
-- dan skema Drizzle-nya, sehingga tabel ini tidak dipakai lagi. Indeks unik
-- dan foreign key ke `users` ikut terhapus bersama tabel.
DROP TABLE IF EXISTS `pengguna_shortcut`;

--> statement-breakpoint
-- ===== 0025_kepala_dusun_wilayah.sql =====
-- Hubungkan aparat desa dengan wilayah yang dipimpinnya (kepala dusun).
-- Sinkronisasi aplikasi mengisi `wilayah_id` saat kepala dusun diangkat pada
-- halaman Wilayah Administratif; satu aparat per wilayah dijaga indeks unik.
ALTER TABLE `perangkat_desa` ADD `wilayah_id` int;--> statement-breakpoint
ALTER TABLE `perangkat_desa` ADD CONSTRAINT `perangkat_desa_village_wilayah_uq` UNIQUE(`village_id`,`wilayah_id`);

--> statement-breakpoint
-- ===== 0026_menu_dua_belas_grup.sql =====
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
  UNION ALL SELECT 'buku-administrasi-pembangunan', 'Buku Administrasi Pembangunan', '/pembangunan/buku', 'sekretariat', 3
  UNION ALL SELECT 'buku-administrasi-lainnya', 'Buku Administrasi Lainnya', '/bumindes/buku-administrasi?golongan=E', 'sekretariat', 4
  UNION ALL SELECT 'agenda-kegiatan', 'Agenda Kegiatan', '/segera/agenda-kegiatan', 'sekretariat', 5
  UNION ALL SELECT 'apbdes', 'APBDes', '/keuangan/apbdes', 'keuangan', 1
  UNION ALL SELECT 'pendapatan', 'Pendapatan', '/keuangan/pendapatan', 'keuangan', 2
  UNION ALL SELECT 'belanja', 'Belanja', '/keuangan/belanja', 'keuangan', 3
  UNION ALL SELECT 'pembiayaan', 'Pembiayaan', '/keuangan/pembiayaan', 'keuangan', 4
  UNION ALL SELECT 'penatausahaan', 'Penatausahaan', '/keuangan/penatausahaan', 'keuangan', 5
  UNION ALL SELECT 'buku-kas-umum', 'Buku Kas Umum', '/keuangan/buku-kas-umum', 'keuangan', 6
  UNION ALL SELECT 'realisasi', 'Realisasi Anggaran', '/keuangan/realisasi', 'keuangan', 7
  UNION ALL SELECT 'perencanaan-pembangunan', 'Perencanaan Pembangunan', NULL, 'pembangunan-aset', 1
  UNION ALL SELECT 'proyek-desa', 'Proyek Desa', NULL, 'pembangunan-aset', 3
  UNION ALL SELECT 'aset-desa', 'Aset Desa', NULL, 'pembangunan-aset', 5
  UNION ALL SELECT 'mutasi-aset', 'Mutasi Aset', '/inventaris/mutasi', 'pembangunan-aset', 6
  UNION ALL SELECT 'laporan-aset', 'Laporan Aset', '/inventaris/laporan', 'pembangunan-aset', 7
  UNION ALL SELECT 'peta-wilayah', 'Peta Wilayah', NULL, 'pertanahan', 2
  UNION ALL SELECT 'data-pertanahan', 'Data Pertanahan', '/pemetaan/data-pertanahan', 'pertanahan', 3
  UNION ALL SELECT 'batas-wilayah', 'Batas Wilayah', NULL, 'pertanahan', 4
  UNION ALL SELECT 'peta-penduduk', 'Peta Penduduk', '/pemetaan/peta-penduduk', 'pertanahan', 5
  UNION ALL SELECT 'data-penerima-bantuan', 'Data Penerima Bantuan', NULL, 'satu-data', 2
  UNION ALL SELECT 'potensi', 'Data Potensi Desa', '/konten/potensi', 'satu-data', 4
  UNION ALL SELECT 'statistik-program-desa', 'Statistik Program Desa', '/satu-data/statistik-program', 'satu-data', 5
  UNION ALL SELECT 'aspirasi-warga', 'Aspirasi Warga', NULL, 'layanan-mandiri', 2
  UNION ALL SELECT 'informasi-pelayanan', 'Informasi Pelayanan', '/pelayanan-publik/layanan', 'layanan-mandiri', 4
  UNION ALL SELECT 'grup-akses', 'Role & Hak Akses', '/pengaturan/grup-akses', 'pengaturan', 2
  UNION ALL SELECT 'pengaturan-sistem', 'Pengaturan Sistem', '/pengaturan/desa', 'pengaturan', 3
  UNION ALL SELECT 'integrasi', 'Integrasi', '/pengaturan/desa?bagian=integrasi', 'pengaturan', 4
  UNION ALL SELECT 'template-website', 'Template Website', '/pengaturan/desa?bagian=tampilan', 'pengaturan', 5
  UNION ALL SELECT 'log-aktivitas', 'Log Aktivitas', '/pengaturan/pengguna/aktivitas', 'pengaturan', 6
) s
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = s.`slug`
);
--> statement-breakpoint
-- Modul yang fungsinya sudah tercakup halaman lain disimpan sebagai modul izin
-- saja: grant tetap ada, tetapi tidak tampil di sidebar agar tidak ada dua menu
-- yang membuka halaman yang sama.
UPDATE `modules` SET `url` = NULL, `is_hidden` = 1
WHERE `slug` IN ('peta-wilayah', 'batas-wilayah', 'proyek-desa', 'aset-desa', 'data-penerima-bantuan', 'perencanaan-pembangunan', 'aspirasi-warga');
--> statement-breakpoint
UPDATE `modules` SET `url` = '/pemetaan/data-pertanahan', `is_hidden` = 0
WHERE `slug` = 'data-pertanahan';
--> statement-breakpoint
UPDATE `modules` SET `url` = '/satu-data/statistik-program', `is_hidden` = 0
WHERE `slug` = 'statistik-program-desa';
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
--> statement-breakpoint
-- Pindah kelompok bertipe `lembaga` ke modul Lembaga Desa.
-- Lembaga Desa kini satu-satunya sumber data lembaga (BPD/LPM/PKK dll);
-- kelompok hanya untuk kelompok masyarakat. Data yang sudah ada di
-- lembaga_desa dengan nama yang sama tidak ditimpa.
INSERT INTO `lembaga_master` (`village_id`, `nama`, `deskripsi`, `urut`)
SELECT `village_id`, `name`, `description`, 0 FROM `kelompok_master`
WHERE `type` = 'lembaga'
  AND NOT EXISTS (
    SELECT 1 FROM `lembaga_master` lm
    WHERE lm.`village_id` = `kelompok_master`.`village_id` AND lm.`nama` = `kelompok_master`.`name`
  );--> statement-breakpoint
INSERT INTO `lembaga_desa` (`village_id`, `nama`, `kode`, `jenis`, `master_id`, `deskripsi`, `no_sk_pendirian`, `ketua_resident_id`, `status`)
SELECT k.`village_id`, k.`name`,
  CASE WHEN k.`code` IS NULL OR k.`code` = '' OR EXISTS (
    SELECT 1 FROM `lembaga_desa` ld WHERE ld.`village_id` = k.`village_id` AND ld.`kode` = LEFT(k.`code`, 16)
  ) THEN NULL ELSE LEFT(k.`code`, 16) END,
  'lainnya',
  (SELECT lm.`id` FROM `lembaga_master` lm WHERE lm.`village_id` = k.`village_id` AND lm.`nama` = km.`name`),
  k.`description`, k.`decree_number`,
  (SELECT ka.`resident_id` FROM `kelompok_anggota` ka WHERE ka.`kelompok_id` = k.`id` AND ka.`village_id` = k.`village_id` AND ka.`position` = 1 LIMIT 1),
  'aktif'
FROM `kelompok` k
LEFT JOIN `kelompok_master` km ON km.`id` = k.`category_id` AND km.`type` = 'lembaga'
WHERE k.`type` = 'lembaga'
  AND NOT EXISTS (
    SELECT 1 FROM `lembaga_desa` ld2 WHERE ld2.`village_id` = k.`village_id` AND ld2.`nama` = k.`name`
  );--> statement-breakpoint
INSERT INTO `lembaga_anggota` (`village_id`, `lembaga_id`, `resident_id`, `nama`, `nomor_anggota`, `jabatan`, `nomor_sk_jabatan`, `keterangan`, `tampil_publik`, `aktif`)
SELECT ka.`village_id`, ld.`id`, ka.`resident_id`, r.`name`, ka.`member_number`,
  CASE ka.`position` WHEN 1 THEN 'Ketua' WHEN 2 THEN 'Wakil Ketua' WHEN 3 THEN 'Sekretaris' WHEN 4 THEN 'Bendahara' ELSE 'Anggota' END,
  ka.`decree_number`, ka.`keterangan`, ka.`tampil_publik`, 1
FROM `kelompok_anggota` ka
JOIN `kelompok` k ON k.`id` = ka.`kelompok_id` AND k.`village_id` = ka.`village_id` AND k.`type` = 'lembaga'
JOIN `lembaga_desa` ld ON ld.`village_id` = k.`village_id` AND ld.`nama` = k.`name`
JOIN `residents` r ON r.`id` = ka.`resident_id` AND r.`village_id` = ka.`village_id`
WHERE NOT EXISTS (
  SELECT 1 FROM `lembaga_anggota` la WHERE la.`village_id` = ka.`village_id` AND la.`lembaga_id` = ld.`id` AND la.`resident_id` = ka.`resident_id`
);--> statement-breakpoint
DELETE FROM `kelompok_anggota` WHERE `kelompok_id` IN (SELECT `id` FROM `kelompok` WHERE `type` = 'lembaga');--> statement-breakpoint
DELETE FROM `kelompok` WHERE `type` = 'lembaga';--> statement-breakpoint
DELETE FROM `kelompok_master` WHERE `type` = 'lembaga';
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE `profil_desa` ADD `tujuan_pembangunan` text;--> statement-breakpoint
ALTER TABLE `profil_desa` ADD `nilai_dasar` text;--> statement-breakpoint
ALTER TABLE `profil_desa` ADD `arah_kebijakan` text;
--> statement-breakpoint
ALTER TABLE `regions` ADD `luas_ha` decimal(12,2);
--> statement-breakpoint
-- ===== 0006_rbac_batas_tenant_dan_slug_global.sql =====
-- Dua aturan yang tidak dapat dinyatakan sebagai unique index biasa:
--
-- 1. `role_permissions` boleh menautkan role & modul bila keduanya milik tenant
--    yang sama, atau salah satunya global (`village_id IS NULL`). Kombinasi dua
--    tenant berbeda ditolak database, bukan hanya repository.
-- 2. Slug role/modul global (`village_id IS NULL`) wajib unik. Unique index
--    `(village_id, slug)` tidak menegakkan ini karena MySQL/MariaDB menganggap
--    NULL berbeda satu sama lain.
--
-- Keputusan produk: entity global boleh dipakai tenant mana pun (template
-- memberi grant modul global ke role desa), sedangkan dua entity desa berbeda
-- tidak boleh bertemu dalam satu grant.
CREATE TRIGGER role_permissions_tenant_bi BEFORE INSERT ON role_permissions
FOR EACH ROW
BEGIN
  DECLARE role_village INT DEFAULT NULL;
  DECLARE module_village INT DEFAULT NULL;
  SELECT village_id INTO role_village FROM roles WHERE id = NEW.role_id;
  SELECT village_id INTO module_village FROM modules WHERE id = NEW.module_id;
  IF role_village IS NOT NULL AND module_village IS NOT NULL
     AND role_village <> module_village THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modul tidak sesuai tenant role.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER role_permissions_tenant_bu BEFORE UPDATE ON role_permissions
FOR EACH ROW
BEGIN
  DECLARE role_village INT DEFAULT NULL;
  DECLARE module_village INT DEFAULT NULL;
  SELECT village_id INTO role_village FROM roles WHERE id = NEW.role_id;
  SELECT village_id INTO module_village FROM modules WHERE id = NEW.module_id;
  IF role_village IS NOT NULL AND module_village IS NOT NULL
     AND role_village <> module_village THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modul tidak sesuai tenant role.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER roles_global_slug_bi BEFORE INSERT ON roles
FOR EACH ROW
BEGIN
  IF NEW.village_id IS NULL
     AND EXISTS (SELECT 1 FROM roles WHERE village_id IS NULL AND slug = NEW.slug) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slug role global sudah dipakai.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER roles_global_slug_bu BEFORE UPDATE ON roles
FOR EACH ROW
BEGIN
  IF NEW.village_id IS NULL
     AND EXISTS (
       SELECT 1 FROM roles
       WHERE village_id IS NULL AND slug = NEW.slug AND id <> NEW.id
     ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slug role global sudah dipakai.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER modules_global_slug_bi BEFORE INSERT ON modules
FOR EACH ROW
BEGIN
  IF NEW.village_id IS NULL
     AND EXISTS (SELECT 1 FROM modules WHERE village_id IS NULL AND slug = NEW.slug) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slug modul global sudah dipakai.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER modules_global_slug_bu BEFORE UPDATE ON modules
FOR EACH ROW
BEGIN
  IF NEW.village_id IS NULL
     AND EXISTS (
       SELECT 1 FROM modules
       WHERE village_id IS NULL AND slug = NEW.slug AND id <> NEW.id
     ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slug modul global sudah dipakai.';
  END IF;
END;
--> statement-breakpoint
-- Melengkapi sidebar desa dan menghapus sisa fitur OpenDK.

-- 1. Halaman yang sudah ada tetapi menunya masih menunjuk placeholder.
UPDATE `modules` SET `url` = '/profil-desa/website/agenda', `sort_order` = 5
WHERE `slug` = 'agenda-kegiatan' AND `url` = '/segera/agenda-kegiatan';
--> statement-breakpoint
UPDATE `modules` SET `url` = '/layanan-surat/persuratan/arsip'
WHERE `slug` = 'arsip' AND `url` = '/segera/arsip';
--> statement-breakpoint
UPDATE `modules` SET `sort_order` = 11
WHERE `slug` = 'website-pengaturan' AND `sort_order` = 9;
--> statement-breakpoint

-- 2a. Baris modul lama (tersembunyi/placeholder) diarahkan ke halaman nyata.
UPDATE `modules` m
JOIN `modules` g ON g.`village_id` = m.`village_id` AND g.`slug` = 'profil-desa'
SET m.`url` = '/profil-desa/website/konten', m.`parent_id` = g.`id`,
    m.`sort_order` = 9, m.`is_hidden` = 0, m.`is_active` = 1
WHERE m.`slug` = 'website-konten';
--> statement-breakpoint
UPDATE `modules` m
JOIN `modules` g ON g.`village_id` = m.`village_id` AND g.`slug` = 'profil-desa'
SET m.`url` = '/profil-desa/website/halaman', m.`parent_id` = g.`id`,
    m.`sort_order` = 10, m.`is_hidden` = 0, m.`is_active` = 1
WHERE m.`slug` = 'website-halaman';
--> statement-breakpoint
UPDATE `modules` m
JOIN `modules` g ON g.`village_id` = m.`village_id` AND g.`slug` = 'kependudukan'
SET m.`url` = '/kependudukan/mutasi-penduduk', m.`parent_id` = g.`id`,
    m.`sort_order` = 12, m.`is_hidden` = 0, m.`is_active` = 1
WHERE m.`slug` = 'mutasi-penduduk';
--> statement-breakpoint
UPDATE `modules` m
JOIN `modules` g ON g.`village_id` = m.`village_id` AND g.`slug` = 'keuangan'
SET m.`url` = '/keuangan/dokumen', m.`parent_id` = g.`id`,
    m.`sort_order` = 9, m.`is_hidden` = 0, m.`is_active` = 1
WHERE m.`slug` = 'dokumen-keuangan';
--> statement-breakpoint
UPDATE `modules` m
JOIN `modules` g ON g.`village_id` = m.`village_id` AND g.`slug` = 'layanan-mandiri'
SET m.`url` = '/pelayanan-publik/pengajuan', m.`parent_id` = g.`id`,
    m.`sort_order` = 5, m.`is_hidden` = 0, m.`is_active` = 1
WHERE m.`slug` = 'pengajuan-layanan';
--> statement-breakpoint
UPDATE `modules` m
JOIN `modules` g ON g.`village_id` = m.`village_id` AND g.`slug` = 'layanan-mandiri'
SET m.`url` = '/pelayanan-publik/survei', m.`parent_id` = g.`id`,
    m.`sort_order` = 6, m.`is_hidden` = 0, m.`is_active` = 1
WHERE m.`slug` = 'analisis-survei';
--> statement-breakpoint
UPDATE `modules` m
JOIN `modules` g ON g.`village_id` = m.`village_id` AND g.`slug` = 'kehadiran'
SET m.`url` = '/kehadiran/cuti-izin', m.`parent_id` = g.`id`,
    m.`sort_order` = 9, m.`is_hidden` = 0, m.`is_active` = 1
WHERE m.`slug` = 'cuti-izin';
--> statement-breakpoint

-- 2b. Verifikasi dan master referensi persuratan (sudah punya halaman).
UPDATE `modules` m
JOIN (SELECT `id`, `village_id` FROM `modules` WHERE `slug` = 'layanan-surat') g
  ON g.`village_id` = m.`village_id`
SET m.`url` = '/layanan-surat/persuratan/verifikasi', m.`parent_id` = g.`id`,
    m.`sort_order` = 10, m.`is_hidden` = 0, m.`is_active` = 1
WHERE m.`slug` = 'verifikasi-surat';
--> statement-breakpoint
UPDATE `modules` m
JOIN (SELECT `id`, `village_id` FROM `modules` WHERE `slug` = 'layanan-surat') g
  ON g.`village_id` = m.`village_id`
SET m.`url` = '/layanan-surat/persuratan/master', m.`parent_id` = g.`id`,
    m.`sort_order` = 11, m.`is_hidden` = 0, m.`is_active` = 1
WHERE m.`slug` = 'master-surat';
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'verifikasi-surat', 'Verifikasi Surat', '/layanan-surat/persuratan/verifikasi', NULL, 0, 0, 1, 10,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'layanan-surat' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'verifikasi-surat'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'master-surat', 'Master Referensi', '/layanan-surat/persuratan/master', NULL, 0, 0, 1, 11,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'layanan-surat' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'master-surat'
);
--> statement-breakpoint

-- 2c. Menu baru untuk tenant yang belum punya barisnya.
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'website-konten', 'Konten Website', '/profil-desa/website/konten', NULL, 0, 0, 1, 9,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'profil-desa' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'website-konten'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'website-halaman', 'Halaman Website', '/profil-desa/website/halaman', NULL, 0, 0, 1, 10,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'profil-desa' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'website-halaman'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'mutasi-penduduk', 'Mutasi Penduduk', '/kependudukan/mutasi-penduduk', NULL, 0, 0, 1, 12,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'kependudukan' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'mutasi-penduduk'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'dokumen-keuangan', 'Dokumen Keuangan', '/keuangan/dokumen', NULL, 0, 0, 1, 9,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'keuangan' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'dokumen-keuangan'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'pengajuan-layanan', 'Pengajuan Layanan', '/pelayanan-publik/pengajuan', NULL, 0, 0, 1, 5,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'layanan-mandiri' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'pengajuan-layanan'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'analisis-survei', 'Survei Kepuasan', '/pelayanan-publik/survei', NULL, 0, 0, 1, 6,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'layanan-mandiri' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'analisis-survei'
);
--> statement-breakpoint
INSERT INTO `modules` (`village_id`, `slug`, `name`, `url`, `icon`, `is_group`, `is_hidden`, `is_active`, `sort_order`, `parent_id`)
SELECT v.`id`, 'cuti-izin', 'Cuti & Izin', '/kehadiran/cuti-izin', NULL, 0, 0, 1, 9,
       COALESCE((SELECT g.`id` FROM `modules` g WHERE g.`village_id` = v.`id` AND g.`slug` = 'kehadiran' LIMIT 1), 0)
FROM `villages` v
WHERE NOT EXISTS (
  SELECT 1 FROM `modules` x WHERE x.`village_id` = v.`id` AND x.`slug` = 'cuti-izin'
);
--> statement-breakpoint

-- 3. Grant untuk menu baru: administrator penuh, role lain hanya baca.
INSERT INTO `role_permissions` (`role_id`, `module_id`, `access`, `can_read`, `can_create`, `can_update`, `can_delete`)
SELECT r.`id`, m.`id`,
       CASE WHEN r.`slug` = 'administrator' THEN 'manage' ELSE 'read' END,
       1,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END,
       CASE WHEN r.`slug` = 'administrator' THEN 1 ELSE 0 END
FROM `modules` m
JOIN `roles` r ON r.`village_id` = m.`village_id`
WHERE m.`slug` IN (
    'website-konten', 'website-halaman', 'mutasi-penduduk',
    'dokumen-keuangan', 'pengajuan-layanan', 'analisis-survei', 'cuti-izin',
    'verifikasi-surat', 'master-surat'
  )
  AND r.`slug` IN ('administrator', 'sekretaris', 'operator', 'kepala-desa')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = r.`id` AND rp.`module_id` = m.`id`
  );
--> statement-breakpoint

-- 4. Hapus modul OpenDK beserta grant dan modul turunannya.
DELETE rp FROM `role_permissions` rp
JOIN `modules` m ON m.`id` = rp.`module_id`
WHERE m.`slug` IN ('opendk-pesan', 'opendk-sinkronisasi');
--> statement-breakpoint
DELETE FROM `modules` WHERE `slug` IN ('opendk-pesan', 'opendk-sinkronisasi');
--> statement-breakpoint

-- 5. Kolom kirim laporan penduduk hanya dipakai untuk pengiriman OpenDK.
ALTER TABLE `laporan_penduduk` DROP COLUMN `kirim`;
