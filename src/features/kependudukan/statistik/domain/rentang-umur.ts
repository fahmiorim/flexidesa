import { z } from "zod";

/**
 * Slug resource RBAC untuk pengaturan rentang umur.
 *
 * Memakai resource Penduduk karena modul `laporan-penduduk` sudah dihapus
 * beserta menunya; izin tetap mengikuti akses data kependudukan.
 */

/** Skema validasi input rentang umur. */
export const rentangUmurFormSchema = z.object({
  nama: z.string().trim().min(1, "Nama rentang wajib diisi.").max(60, "Maksimal 60 karakter."),
  dari: z.coerce.number().int().min(0, "Batas bawah minimal 0."),
  /** `sampai` opsional — `null` berarti tanpa batas atas. */
  sampai: z
    .union([z.null(), z.undefined(), z.coerce.number().int().min(0)])
    .optional()
    .nullable(),
});

export type RentangUmurFormInput = z.infer<typeof rentangUmurFormSchema>;

/** Bentuk data rentang umur untuk UI. */
export interface RentangUmurDTO {
  id: number;
  villageId: number;
  nama: string;
  dari: number;
  /** `null` = tanpa batas atas. */
  sampai: number | null;
  status: boolean;
}

/** Range yang dipakai saat mengagregasi penduduk per rentang umur. */
interface UmurRange {
  label: string;
  min: number;
  /** `null` = tanpa batas atas. */
  max: number | null;
}

/** Satu kelompok umur Data Pilah: batas atas inklusif, `max: null` tanpa batas. */
export interface KelompokUmur extends UmurRange {
  kode: string;
}

/**
 * Rentang umur bawaan Data Pilah Kependudukan.
 *
 * Dipakai bila desa belum menyimpan rentang umurnya sendiri. Rentangnya tidak
 * bertumpang sehingga satu penduduk masuk **tepat satu** kelompok.
 */
export const KELOMPOK_UMUR: readonly KelompokUmur[] = [
  { kode: "0-0", label: "Di bawah 1 Tahun", min: 0, max: 0 },
  { kode: "1-5", label: "1–5 Tahun", min: 1, max: 5 },
  { kode: "6-12", label: "6–12 Tahun", min: 6, max: 12 },
  { kode: "13-15", label: "13–15 Tahun", min: 13, max: 15 },
  { kode: "16-18", label: "16–18 Tahun", min: 16, max: 18 },
  { kode: "19-24", label: "19–24 Tahun", min: 19, max: 24 },
  { kode: "25-59", label: "25–59 Tahun", min: 25, max: 59 },
  { kode: "60+", label: "Di atas 60 Tahun", min: 60, max: null },
];

/** Batas umur maksimal (150 = tanpa batas praktis). */
export const BATAS_UMUR_MAKSIMAL = 150;

/**
 * Nama rentang yang dibentuk dari batasnya.
 *
 * `150` dan `null` diperlakukan sebagai batas terbuka sehingga labelnya
 * menjadi “Di atas X Tahun”.
 */
export function susunNamaRentang(
  dari: number,
  sampai: number | null,
  batas = BATAS_UMUR_MAKSIMAL,
): string {
  if (sampai === null || sampai >= batas) return `Di atas ${dari} Tahun`;
  if (dari === sampai) return `${dari} Tahun`;
  return `${dari} s/d ${sampai} Tahun`;
}

interface RentangUmurRingkas {
  id?: number;
  nama: string;
  dari: number;
  sampai: number | null;
}

/**
 * Cari rentang lama yang bertumpang tindih dengan rentang baru.
 *
 * Batas atas bersifat inklusif; `null` berarti tanpa batas. Rentang yang
 * sedang diubah dilewati lewat `kecualiId`.
 */
export function cariTumpangTindih(
  rows: readonly RentangUmurRingkas[],
  baru: { dari: number; sampai: number | null },
  kecualiId?: number | null,
): RentangUmurRingkas | null {
  const baruMaks = baru.sampai ?? Number.POSITIVE_INFINITY;

  return (
    rows.find((row) => {
      if (kecualiId != null && row.id === kecualiId) return false;
      const lamaMaks = row.sampai ?? Number.POSITIVE_INFINITY;
      return baru.dari <= lamaMaks && row.dari <= baruMaks;
    }) ?? null
  );
}

/** Kelompok umur yang memuat `umur`, atau `null` bila umur tidak diketahui. */
export function kelompokUmurUntuk(umur: number | null): KelompokUmur | null {
  if (umur === null || umur < 0) return null;

  return (
    KELOMPOK_UMUR.find(
      (kelompok) => umur >= kelompok.min && (kelompok.max === null || umur <= kelompok.max),
    ) ?? null
  );
}
