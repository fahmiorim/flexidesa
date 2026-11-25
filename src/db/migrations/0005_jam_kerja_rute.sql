-- Halaman Jam Kerja sudah tersedia di /kehadiran/jam-kerja.
-- Baris modul tenant lama dibuat saat provisioning dari template sehingga masih
-- menyimpan URL placeholder /segera/jam-kerja; arahkan ke rute sebenarnya.
-- Perubahan hanya pada kolom `url`, tanpa menyentuh izin, status, atau urutan.
UPDATE `modules`
SET `url` = '/kehadiran/jam-kerja'
WHERE `slug` = 'jam-kerja' AND `url` = '/segera/jam-kerja';
