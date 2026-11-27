import { z } from "zod";

import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";

/**
 * Domain Alasan Keluar Kehadiran.
 *
 * Meniru menu Kehadiran → Alasan Keluar OpenSID
 * (`kehadiran_alasan_keluar`): alasan wajib diisi, keterangan opsional.
 */

/** Slug modul sekaligus resource izin (lihat template tenant). */
export const ALASAN_KELUAR_RESOURCE = RESOURCES.alasanKeluar;

/** Panjang maksimal keterangan; sama dengan `maxlength="300"` form OpenSID. */
export const KETERANGAN_ALASAN_MAKS = 300;

/** Batas kolom `kehadiran_alasan_keluar.alasan` (varchar 255). */
export const PANJANG_ALASAN_MAKS = 255;

export const alasanKeluarFormSchema = z.object({
  alasan: z
    .string()
    .trim()
    .min(1, "Alasan wajib diisi.")
    .max(PANJANG_ALASAN_MAKS, `Alasan maksimal ${PANJANG_ALASAN_MAKS} karakter.`),
  keterangan: z
    .string()
    .trim()
    .max(KETERANGAN_ALASAN_MAKS, `Keterangan maksimal ${KETERANGAN_ALASAN_MAKS} karakter.`)
    .transform((nilai) => (nilai === "" ? null : nilai)),
});

export interface AlasanKeluarRow {
  id: number;
  alasan: string;
  keterangan: string | null;
}
