/**
 * Kontrak baca indikator/kategori analisis untuk fitur lain.
 *
 * Survey menyusun pertanyaan berdasarkan indikator dan kategori analisis, jadi
 * ia memakai kontrak ini alih-alih mengimpor repository analisis langsung.
 */
export { listAnalisisIndikator, listAnalisisKategori } from "../infrastructure/analisis-repository";
