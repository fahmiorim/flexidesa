import "server-only";

import { requirePermission } from "@/lib/dal";

import { KEHADIRAN_RESOURCE, kehadiranStatusSchema } from "../domain/kehadiran";
import {
  getRekapKehadiran,
  listKehadiran,
  listPerangkatDesa,
} from "../infrastructure/kehadiran-repository";

export async function daftarKehadiran(
  villageId: number,
  opts?: { bulan?: number; tahun?: number; perangkatId?: number },
) {
  await requirePermission(KEHADIRAN_RESOURCE, "read");
  const [items, perangkatList] = await Promise.all([
    listKehadiran(villageId, opts),
    listPerangkatDesa(villageId),
  ]);
  const perangkatMap = new Map(perangkatList.map((perangkat) => [perangkat.id, perangkat]));

  return items.map((item) => {
    const perangkat = perangkatMap.get(item.perangkatId ?? 0);
    return {
      ...item,
      tanggal: item.tanggal,
      perangkatNama: perangkat?.nama ?? "-",
      perangkatJabatan: perangkat?.jabatanNama ?? "-",
      status: kehadiranStatusSchema.catch("hadir").parse(item.status),
    };
  });
}
/** Daftar perangkat untuk pilihan formulir kehadiran. */
export async function daftarPerangkatDesa(villageId: number) {
  await requirePermission(KEHADIRAN_RESOURCE, "read");
  return listPerangkatDesa(villageId);
}

export async function getRekapKehadiranData(villageId: number, tahun: number, bulan?: number) {
  await requirePermission(KEHADIRAN_RESOURCE, "read");
  return await getRekapKehadiran(villageId, tahun, bulan);
}

/**
 * Status perangkat hari ini.
 *
 * Aturan:
 *  - Jika ada izin atau sakit: tampilkan status itu.
 *  - Jika ada alpa: tampilkan alpa.
 *  - Jika hadir, tampilkan waktu masuk.
 */
