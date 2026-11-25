-- Halaman Hari Libur sudah tersedia di /kehadiran/hari-libur.
-- Baris modul tenant lama dibuat saat provisioning dari template sehingga masih
-- menyimpan URL placeholder /segera/hari-libur; arahkan ke rute sebenarnya.
-- Perubahan hanya pada kolom `url`, tanpa menyentuh izin, status, atau urutan.
UPDATE `modules`
SET `url` = '/kehadiran/hari-libur'
WHERE `slug` = 'hari-libur' AND `url` = '/segera/hari-libur';
