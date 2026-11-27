import { z } from "zod";

import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";

/**
 * Domain Hari Libur Kehadiran.
 *
 * Meniru menu Kehadiran → Hari Libur OpenSID (`kehadiran_hari_libur`):
 * satu tanggal hanya boleh tercatat sekali per desa dan keterangan wajib
 * diisi. Tanggal disimpan sebagai `YYYY-MM-DD` agar konsisten dengan kolom
 * `date` di database.
 */

/** Slug modul sekaligus resource izin (lihat template tenant). */
export const HARI_LIBUR_RESOURCE = RESOURCES.hariLibur;

/** Panjang maksimal keterangan; sama dengan `maxlength="300"` form OpenSID. */
export const KETERANGAN_HARI_LIBUR_MAKS = 300;

/** Apakah string berupa tanggal ISO `YYYY-MM-DD` yang benar-benar ada. */
export function tanggalIsoValid(nilai: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nilai)) return false;
  // Dipisah per variabel agar `Number()` menerima `undefined` dari destructuring
  // (kompilasi `noUncheckedIndexedAccess`) tanpa error tipe.
  const [teksTahun, teksBulan, teksHari] = nilai.split("-");
  const tahun = Number(teksTahun);
  const bulan = Number(teksBulan);
  const hari = Number(teksHari);
  const tanggal = new Date(Date.UTC(tahun, bulan - 1, hari));
  return (
    tanggal.getUTCFullYear() === tahun &&
    tanggal.getUTCMonth() === bulan - 1 &&
    tanggal.getUTCDate() === hari
  );
}

export const hariLiburFormSchema = z.object({
  tanggal: z
    .string()
    .trim()
    .refine((nilai) => tanggalIsoValid(nilai), "Tanggal hari libur tidak valid."),
  keterangan: z
    .string()
    .trim()
    .min(1, "Keterangan wajib diisi.")
    .max(KETERANGAN_HARI_LIBUR_MAKS, `Keterangan maksimal ${KETERANGAN_HARI_LIBUR_MAKS} karakter.`),
});

/** Satu baris hari libur untuk UI. */
export interface HariLiburRow {
  id: number;
  /** Tanggal ISO `YYYY-MM-DD`. */
  tanggal: string;
  keterangan: string | null;
}

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const FORMAT_HARI = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  timeZone: "UTC",
});

/** Ubah `YYYY-MM-DD` menjadi "25 Desember 2026" tanpa bergeser zona waktu. */
export function formatTanggalIndonesia(tanggal: string): string {
  if (!tanggalIsoValid(tanggal)) return tanggal;
  return FORMAT_TANGGAL.format(new Date(`${tanggal}T00:00:00.000Z`));
}

/** Nama hari dari tanggal ISO, mis. "Jumat". */
export function namaHariIndonesia(tanggal: string): string {
  if (!tanggalIsoValid(tanggal)) return "";
  return FORMAT_HARI.format(new Date(`${tanggal}T00:00:00.000Z`));
}
