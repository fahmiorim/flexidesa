import { z } from "zod";

/**
 * Domain Jam Kerja Kehadiran.
 *
 * Meniru menu Kehadiran → Jam Kerja OpenSID (`kehadiran_jam_kerja`): satu
 * baris per nama hari dengan jam masuk/keluar, status hari kerja atau libur,
 * dan keterangan. Operator hanya menyunting baris yang sudah ada; tidak ada
 * tambah/hapus, sama seperti OpenSID.
 */

/** Slug modul sekaligus resource izin (lihat template tenant). */
export const JAM_KERJA_RESOURCE = "jam-kerja";

/** Urutan hari yang dipakai OpenSID (Carbon `dayName`). */
export const NAMA_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;

export type NamaHari = (typeof NAMA_HARI)[number];

/** Panjang maksimal keterangan; sama dengan `maxlength="300"` form OpenSID. */
export const KETERANGAN_JAM_KERJA_MAKS = 300;

const jamSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam harus berformat HH:MM (00:00–23:59).");

export const jamKerjaFormSchema = z
  .object({
    jamMasuk: jamSchema,
    jamKeluar: jamSchema,
    status: z
      .union([z.boolean(), z.enum(["0", "1"])])
      .transform((nilai) => nilai === true || nilai === "1"),
    keterangan: z
      .string()
      .trim()
      .max(KETERANGAN_JAM_KERJA_MAKS, `Keterangan maksimal ${KETERANGAN_JAM_KERJA_MAKS} karakter.`)
      .transform((nilai) => (nilai === "" ? null : nilai)),
  })
  .refine((nilai) => nilai.jamKeluar >= nilai.jamMasuk, {
    message: "Jam keluar tidak boleh lebih kecil dari jam masuk.",
    path: ["jamKeluar"],
  });

export type JamKerjaFormInput = z.input<typeof jamKerjaFormSchema>;
export type JamKerjaFormValues = z.infer<typeof jamKerjaFormSchema>;

/** Satu baris jam kerja untuk UI. */
export interface JamKerjaRow {
  id: number;
  namaHari: string;
  /** `HH:MM` untuk ditampilkan pada input. */
  jamMasuk: string;
  jamKeluar: string;
  /** `true` = hari kerja, `false` = hari libur. */
  status: boolean;
  keterangan: string | null;
}

/** Jadwal bawaan saat desa belum punya baris jam kerja. */
export const JAM_KERJA_BAWAAN: readonly Omit<JamKerjaRow, "id">[] = NAMA_HARI.map((namaHari) => ({
  namaHari,
  jamMasuk: "08:00",
  jamKeluar: namaHari === "Sabtu" ? "12:00" : "16:00",
  status: namaHari !== "Minggu",
  keterangan: namaHari === "Minggu" ? "Hari libur mingguan" : null,
}));

/** Potong `HH:MM:SS` dari kolom `time` menjadi `HH:MM`. */
export function jamPendek(nilai: string | null | undefined): string {
  if (!nilai) return "";
  return nilai.slice(0, 5);
}
