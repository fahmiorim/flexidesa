/**
 * Kontrak baca data pemerintahan (perangkat desa) untuk fitur lain.
 *
 * Dipakai laporan bulanan (mencetak daftar perangkat) dan suplemen (menandatangani
 * laporan), serta pemanggil lain yang butuh perangkat aktif tanpa mengikatkan
 * diri pada repository pemerintahan.
 */
export { getSekretarisAktif, listPerangkat } from "../infrastructure/perangkat-repository";
