import "server-only";

/**
 * Pintu application kebijakan berkas untuk fitur lain.
 *
 * Fitur pemakai (mis. layanan mandiri) memanggil fungsi di sini; query database
 * tetap di `infrastructure/pengaturan-berkas-repository.ts` dan aturan murni
 * di `domain/pengaturan-berkas.ts`.
 */
export {
  getAllMediaSettings,
  getMediaSettings,
  resetMediaSettings,
  upsertMediaSettings,
} from "@/features/kebijakan-berkas/infrastructure/pengaturan-berkas-repository";
export {
  KATEGORI_LAMPIRAN,
  validasiJumlahFile,
  validasiMediaDenganPengaturan,
  type KategoriLampiran,
  type MediaSettingsEfektif,
  type MediaSettingsInput,
} from "@/features/kebijakan-berkas/domain/pengaturan-berkas";
