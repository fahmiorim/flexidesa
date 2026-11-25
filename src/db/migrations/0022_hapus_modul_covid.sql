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
