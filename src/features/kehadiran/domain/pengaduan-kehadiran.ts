import { z } from "zod";

/**
 * Domain Pengaduan Kehadiran.
 *
 * Meniru menu Kehadiran → Pengaduan OpenSID (`kehadiran_pengaduan`): baris
 * dibuat warga dari layanan mandiri ketika melaporkan perangkat, lalu operator
 * hanya dapat menyunting keterangannya. Tidak ada tombol tambah di admin,
 * sama seperti OpenSID.
 */

/** Slug modul sekaligus resource izin (lihat template tenant). */
export const PENGADUAN_KEHADIRAN_RESOURCE = "pengaduan-kehadiran";

/** Panjang maksimal keterangan; sama dengan `maxlength="300"` form OpenSID. */
export const KETERANGAN_MAKS = 300;

export const pengaduanKehadiranFormSchema = z.object({
  keterangan: z
    .string()
    .trim()
    .max(KETERANGAN_MAKS, `Keterangan maksimal ${KETERANGAN_MAKS} karakter.`)
    .transform((value) => (value === "" ? null : value)),
});

export type PengaduanKehadiranInput = z.infer<typeof pengaduanKehadiranFormSchema>;

/** Satu baris pengaduan untuk UI. */
export interface PengaduanKehadiranRow {
  id: number;
  /** Waktu dilaporkan (ISO); ditampilkan seperti `tgl_indo2` OpenSID. */
  waktu: string;
  /** Nama pelapor (penduduk layanan mandiri), `null` bila tidak tercatat. */
  pelapor: string | null;
  /** Nama perangkat yang dilaporkan, `null` bila pegawai sudah dihapus. */
  terlapor: string | null;
  keterangan: string | null;
  /** `true` bila sudah ditindaklanjuti. */
  selesai: boolean;
}
