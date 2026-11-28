import { z } from "zod";

/**
 * Domain Laporan Penduduk.
 *
 * Arsip dokumen PDF
 * resmi per **bulan** dan tahun yang diunggah operator. Angka laporan tidak
 * diturunkan dari dokumen ini.
 */

/** Bulan 1–12 dengan label Indonesia. */
export const BULAN_LAPORAN: readonly { value: number; label: string }[] = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export function bulanLabel(bulan: number): string {
  return BULAN_LAPORAN.find((item) => item.value === bulan)?.label ?? `Bulan ${bulan}`;
}

/** Tahun paling awal yang masuk akal untuk arsip laporan. */
export const TAHUN_MIN = 1945;
export const TAHUN_MAX = 2030;

/**
 * Skema metadata laporan penduduk.
 *
 * Berkas dipilih terpisah karena `File` tidak dapat diparse ulang setelah
 * dibaca; validasi berkas memakai aturan PDF yang sudah dipakai arsip lain.
 */
export const laporanPendudukFormSchema = z.object({
  judul: z.string().trim().min(1, "Judul wajib diisi.").max(255, "Maksimal 255 karakter."),
  tahun: z.coerce
    .number()
    .int("Tahun harus bilangan bulat.")
    .min(TAHUN_MIN, `Tahun minimal ${TAHUN_MIN}.`)
    .max(TAHUN_MAX, `Tahun maksimal ${TAHUN_MAX}.`),
  bulan: z.coerce
    .number()
    .int("Bulan harus bilangan bulat.")
    .min(1, "Bulan tidak valid.")
    .max(12, "Bulan tidak valid."),
});

export type LaporanPendudukInput = z.infer<typeof laporanPendudukFormSchema>;

/** Satu baris arsip untuk UI. */
export interface LaporanPendudukRow {
  id: number;
  judul: string;
  tahun: number;
  bulan: number;
  bulanLabel: string;
  namaFile: string;
  /** Tanggal unggah/ubah terakhir (ISO); ditampilkan sebagai "Tanggal Upload". */
  diunggahPada: string;
}
