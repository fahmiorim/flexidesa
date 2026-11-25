-- Hapus tabel pintasan beranda (`pengguna_shortcut`).
-- Fitur Pintasan Saya sudah dihapus dari beranda beserta use case, repository,
-- dan skema Drizzle-nya, sehingga tabel ini tidak dipakai lagi. Indeks unik
-- dan foreign key ke `users` ikut terhapus bersama tabel.
DROP TABLE IF EXISTS `pengguna_shortcut`;
