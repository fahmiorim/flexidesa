import "server-only";

import { listBukuTamu } from "@/features/layanan-warga/buku-tamu/infrastructure/buku-tamu-repository";

/**
 * Use case buku tamu desa.
 *
 * Lapisan tipis di atas repository: memvalidasi rentang tanggal (format
 * `YYYY-MM-DD`, mulai ≤ akhir) sebelum query dijalankan. Route yang memanggil
 * wajib menentukan tenant dari sesi dan memeriksa izin modul.
 */

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

export type FilterBukuTamu = { tanggalMulai?: string; tanggalAkhir?: string };

function tanggalValid(nilai: string | undefined): string | undefined {
  const teks = nilai?.trim();
  if (!teks) return undefined;
  if (!POLA_TANGGAL.test(teks)) throw new Error("Format tanggal buku tamu tidak valid.");
  return teks;
}

export async function daftarBukuTamu(
  villageId: number,
  filter: FilterBukuTamu = {},
): Promise<Awaited<ReturnType<typeof listBukuTamu>>> {
  const tanggalMulai = tanggalValid(filter.tanggalMulai);
  const tanggalAkhir = tanggalValid(filter.tanggalAkhir);
  if (tanggalMulai && tanggalAkhir && tanggalMulai > tanggalAkhir) {
    throw new Error("Tanggal mulai tidak boleh melewati tanggal akhir.");
  }
  return listBukuTamu(villageId, { tanggalMulai, tanggalAkhir });
}
