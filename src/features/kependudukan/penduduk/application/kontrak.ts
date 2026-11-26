/**
 * Kontrak data penduduk untuk fitur lain.
 *
 * Persuratan merakit isi surat, dan tampilan penduduk lintas menu memakai
 * pilihan/potongan data yang disediakan di sini. `penduduk-repository` tetap
 * milik modul penduduk.
 */
export {
  getPendudukSuratData,
  listAnggotaKeluargaSurat,
  listPendudukOptions,
  listPendudukSuratByIds,
  type AnggotaKeluargaSuratRow,
  type PendudukSuratData,
} from "../infrastructure/penduduk-repository";
