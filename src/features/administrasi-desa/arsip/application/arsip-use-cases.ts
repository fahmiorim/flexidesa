import "server-only";

import {
  deleteArsip,
  listArsip,
  updateArsip,
} from "@/features/administrasi-desa/arsip/infrastructure/arsip-repository";

/**
 * Use case arsip desa.
 *
 * Lapisan tipis di atas repository: menormalkan filter, memvalidasi id, dan
 * menjaga `villageId` tetap eksplisit. Route yang memanggil wajib menentukan
 * tenant dari sesi dan memeriksa izin modul sebelum meneruskan `villageId`.
 */

/** Filter daftar arsip; nilai kosong diabaikan. */
export type FilterArsip = { kategori?: string; q?: string };

function bersihkan(nilai: string | undefined): string | undefined {
  const teks = nilai?.trim();
  return teks ? teks : undefined;
}

export async function daftarArsip(
  villageId: number,
  filter: FilterArsip = {},
): Promise<Awaited<ReturnType<typeof listArsip>>> {
  return listArsip(villageId, {
    kategori: bersihkan(filter.kategori),
    q: bersihkan(filter.q),
  });
}

export async function ubahArsip(
  villageId: number,
  id: number,
  data: Parameters<typeof updateArsip>[2],
): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) throw new Error("Id arsip tidak valid.");
  await updateArsip(id, villageId, data);
}

export async function hapusArsip(villageId: number, id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) throw new Error("Id arsip tidak valid.");
  await deleteArsip(id, villageId);
}
