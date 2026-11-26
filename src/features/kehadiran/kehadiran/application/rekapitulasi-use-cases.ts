import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  REKAPITULASI_KEHADIRAN_RESOURCE,
  type BarisRekapitulasi,
  type FilterRekapitulasi,
} from "@/features/kehadiran/kehadiran/domain/rekapitulasi";
import {
  listPerangkatDesa,
  listRekapitulasiKehadiran,
  listStatusKehadiran,
} from "@/features/kehadiran/kehadiran/infrastructure/kehadiran-repository";
import { requirePermission } from "@/lib/dal";

export interface RekapitulasiKehadiranData {
  rows: BarisRekapitulasi[];
  perangkat: { id: number; nama: string | null; jabatan: string | null }[];
  statusOptions: string[];
  filter: FilterRekapitulasi;
}

/** Data halaman Kehadiran → Rekapitulasi. */
export async function getRekapitulasiKehadiranData(
  filter: FilterRekapitulasi,
): Promise<RekapitulasiKehadiranData> {
  const user = await requirePermission(REKAPITULASI_KEHADIRAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const [rows, perangkat, statusOptions] = await Promise.all([
    listRekapitulasiKehadiran(villageId, filter),
    listPerangkatDesa(villageId),
    listStatusKehadiran(villageId),
  ]);

  return {
    rows,
    perangkat: perangkat.map((item) => ({
      id: item.id,
      nama: item.nama,
      jabatan: item.jabatanNama,
    })),
    statusOptions,
    filter,
  };
}

/** Baris rekapitulasi untuk ekspor; memakai filter yang sama dengan layar. */
export async function getRekapitulasiKehadiranEkspor(filter: FilterRekapitulasi) {
  const user = await requirePermission(REKAPITULASI_KEHADIRAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return listRekapitulasiKehadiran(villageId, filter);
}
