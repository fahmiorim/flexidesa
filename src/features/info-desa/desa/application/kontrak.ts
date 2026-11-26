/**
 * Kontrak baca identitas desa (baris `villages`) untuk fitur lain.
 *
 * Persuratan, permohonan layanan, API publik, dan konsol platform butuh
 * identitas desa tanpa mengimpor `desa-repository` langsung. Operasi tulis
 * identitas tetap lewat use case yang memeriksa izin.
 */
export { getIdentitasDesa, getNamaDesa } from "../infrastructure/desa-repository";
export type { IdentitasDesa } from "../domain/desa";
