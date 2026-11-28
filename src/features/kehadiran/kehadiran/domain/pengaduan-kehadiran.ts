import { z } from "zod";

/**
 * Domain Pengaduan Kehadiran.
 *
 * Baris dibuat warga dari layanan mandiri ketika melaporkan perangkat,
 * lalu operator hanya dapat menyunting keterangannya. Tidak ada
 * tombol tambah di admin.
 */

/** Slug modul sekaligus resource izin (lihat template tenant). */
export const PENGADUAN_KEHADIRAN_RESOURCE = "pengaduan-kehadiran";

/** Panjang maksimal keterangan (300 karakter). */
export const KETERANGAN_MAKS = 300;

export const pengaduanKehadiranFormSchema = z.object({
  keterangan: z
    .string()
    .trim()
    .max(KETERANGAN_MAKS, `Keterangan maksimal ${KETERANGAN_MAKS} karakter.`)
    .transform((value) => (value === "" ? null : value)),
});

/** Satu baris pengaduan untuk UI. */
export interface PengaduanKehadiranRow {
  id: number;
  /** Waktu dilaporkan (ISO); ditampilkan sebagai tanggal lengkap. */
  waktu: string;
  /** Nama pelapor (penduduk layanan mandiri), `null` bila tidak tercatat. */
  pelapor: string | null;
  /** Nama perangkat yang dilaporkan, `null` bila pegawai sudah dihapus. */
  terlapor: string | null;
  keterangan: string | null;
  /** `true` bila sudah ditindaklanjuti. */
  selesai: boolean;
}
