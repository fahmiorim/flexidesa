-- Parity Pengaturan Surat OpenSID: daftar lampiran surat dan opsi
-- "Sediakan di Layanan Mandiri" pada setiap jenis surat.
ALTER TABLE `letter_types`
  ADD COLUMN `lampiran` text,
  ADD COLUMN `mandiri` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
-- Jenis surat yang sudah ada selama ini tampil di katalog layanan publik;
-- pertahankan perilaku itu dengan menandainya tersedia di layanan mandiri.
UPDATE `letter_types` SET `mandiri` = true;
