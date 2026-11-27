/**
 * Operasi tulis dan pemeriksaan izin Potensi & Sarana Prasarana.
 *
 * Menu Program & Data Desa adalah pemilik data tulis; halaman publik hanya
 * membaca lewat `application/kontrak.ts` agar tidak ada repository ganda.
 */

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

import {
  hapusPotensiAdmin as hapusPotensiRepo,
  hapusSaranaAdmin as hapusSaranaRepo,
  simpanPotensiAdmin as simpanPotensiRepo,
  simpanSaranaAdmin as simpanSaranaRepo,
  type PotensiAdminInput,
  type SaranaAdminInput,
} from "../infrastructure/potensi-sarana-repository";

export type { PotensiAdminInput, SaranaAdminInput };

/** Hak kelola potensi untuk halaman admin; menentukan tombol yang tampil. */
export async function aksesPotensiAdmin() {
  const user = await requirePermission(RESOURCES.potensi, "read");
  return {
    bolehTambah: hasPermission(user.permissions, RESOURCES.potensi, "create"),
    bolehUbah: hasPermission(user.permissions, RESOURCES.potensi, "update"),
    bolehHapus: hasPermission(user.permissions, RESOURCES.potensi, "delete"),
  };
}

/** Hak kelola sarana/prasarana untuk halaman admin; menentukan tombol yang tampil. */
export async function aksesSaranaAdmin() {
  const user = await requirePermission(RESOURCES.saranaPrasarana, "read");
  return {
    bolehTambah: hasPermission(user.permissions, RESOURCES.saranaPrasarana, "create"),
    bolehUbah: hasPermission(user.permissions, RESOURCES.saranaPrasarana, "update"),
    bolehHapus: hasPermission(user.permissions, RESOURCES.saranaPrasarana, "delete"),
  };
}

export async function simpanPotensiAdmin(data: PotensiAdminInput) {
  const user = await requirePermission(RESOURCES.potensi, data.id > 0 ? "update" : "create");
  const villageId = await resolveVillageId(user);
  return simpanPotensiRepo(villageId, data);
}

export async function hapusPotensiAdmin(id: number) {
  const user = await requirePermission(RESOURCES.potensi, "delete");
  const villageId = await resolveVillageId(user);
  return hapusPotensiRepo(villageId, id);
}

export async function simpanSaranaAdmin(data: SaranaAdminInput) {
  const user = await requirePermission(
    RESOURCES.saranaPrasarana,
    data.id > 0 ? "update" : "create",
  );
  const villageId = await resolveVillageId(user);
  return simpanSaranaRepo(villageId, data);
}

export async function hapusSaranaAdmin(id: number) {
  const user = await requirePermission(RESOURCES.saranaPrasarana, "delete");
  const villageId = await resolveVillageId(user);
  return hapusSaranaRepo(villageId, id);
}
