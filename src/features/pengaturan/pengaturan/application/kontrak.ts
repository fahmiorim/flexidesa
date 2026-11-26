/**
 * Kontrak baca nilai pengaturan desa untuk fitur lain.
 *
 * Konten publik (FAQ/kontak) membaca nilai `pengaturan.nilai` lewat kontrak ini
 * agar penyimpanan pengaturan tetap milik modul Pengaturan.
 */
export { bacaNilaiPengaturan } from "../infrastructure/pengaturan-nilai-repository";
