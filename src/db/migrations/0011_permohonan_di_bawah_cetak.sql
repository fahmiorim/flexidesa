-- Permohonan Surat dipindah tepat di bawah Cetak Surat pada grup Layanan Surat,
-- dan Arsip Layanan digeser satu langkah agar tidak bertabrakan urutannya.
UPDATE `modules`
SET `sort_order` = 14
WHERE `slug` = 'permohonan-surat' AND `sort_order` = 2;
--> statement-breakpoint
UPDATE `modules`
SET `sort_order` = 15
WHERE `slug` = 'arsip-layanan' AND `sort_order` = 14;
