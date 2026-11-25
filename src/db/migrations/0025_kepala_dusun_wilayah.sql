-- Hubungkan aparat desa dengan wilayah yang dipimpinnya (kepala dusun).
-- Sinkronisasi aplikasi mengisi `wilayah_id` saat kepala dusun diangkat pada
-- halaman Wilayah Administratif; satu aparat per wilayah dijaga indeks unik.
ALTER TABLE `perangkat_desa` ADD `wilayah_id` int;--> statement-breakpoint
ALTER TABLE `perangkat_desa` ADD CONSTRAINT `perangkat_desa_village_wilayah_uq` UNIQUE(`village_id`,`wilayah_id`);
