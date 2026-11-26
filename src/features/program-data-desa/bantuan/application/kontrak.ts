/**
 * Kontrak baca bantuan sosial untuk fitur lain.
 *
 * Statistik publik desa dan pilihan penerima rumah tangga memakai ringkasan
 * bantuan tanpa mengimpor repository bantuan secara langsung.
 */
export {
  getRingkasanBantuanPublik,
  listProgramBantuanRtm,
} from "../infrastructure/bantuan-repository";
