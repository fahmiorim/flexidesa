/**
 * Kontrak baca keluarga untuk fitur lain.
 *
 * Penduduk memakai daftar anggota keluarga saat menyusun data/ekspor. Fitur
 * lain yang butuh ringkasan anggota keluarga juga memakai berkas ini agar
 * `keluarga-repository` tetap milik modul Keluarga.
 */
export { listKeluargaMembers } from "../infrastructure/keluarga-repository";
