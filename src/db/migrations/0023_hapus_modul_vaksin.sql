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
