import "server-only";

import { requirePermission } from "@/lib/dal";

import { IDM_RESOURCE, SDGS_RESOURCE } from "../domain/idm";
import {
  getRingkasanIdm,
  listIdm,
  listSdgs,
  listTahunIdm,
  listTahunSdgs,
} from "../infrastructure/idm-repository";

export async function daftarIdm(villageId: number, tahun?: number) {
  await requirePermission(IDM_RESOURCE, "read");
  return listIdm(villageId, tahun);
}

export async function daftarTahunIdm(villageId: number) {
  await requirePermission(IDM_RESOURCE, "read");
  return listTahunIdm(villageId);
}

/** Tambah indikator baru atau perbarui indikator yang sudah ada. */

export async function daftarSdgs(villageId: number, tahun: number) {
  await requirePermission(SDGS_RESOURCE, "read");
  return listSdgs(villageId, tahun);
}

/**
 * Data untuk halaman publik.
 *
 * Tanpa RBAC karena tidak ada sesi; `villageId` berasal dari host (tenant),
 * dan tahun mengikuti data terbaru yang tersedia agar situs tidak kosong pada
 * awal tahun anggaran.
 */
export async function ringkasanIdmPublik(villageId: number, tahunDiminta?: number) {
  const [tahunIdm, tahunSdgs] = await Promise.all([
    listTahunIdm(villageId),
    listTahunSdgs(villageId),
  ]);

  // Admin yang membuka tahun tertentu (dari tautan IDM) harus melihat tahun itu,
  // bukan selalu tahun terbaru. Tanpa pilihan tahun, publik memakai data terbaru.
  const tahun =
    ((tahunDiminta && tahunDiminta > 2000 ? tahunDiminta : undefined) ??
      Math.max(tahunIdm[0] ?? 0, tahunSdgs[0] ?? 0)) ||
    new Date().getFullYear();
  const [indikator, sdgs, ringkasan] = await Promise.all([
    listIdm(villageId, tahun),
    listSdgs(villageId, tahun),
    getRingkasanIdm(villageId, tahun),
  ]);
  const tahunTersedia = [...new Set([...tahunIdm, ...tahunSdgs])].sort((a, b) => b - a);

  return { tahun, tahunTersedia, indikator, sdgs, ringkasan };
}
