import "server-only";

import { tenant } from "@/features/info-desa/pemerintahan/application/konteks";
/**
 * Use case wilayah administratif dan profil wilayah.
 *
 * Data wilayah administratif untuk halaman Pemerintahan dan simpan profil
 * wilayah. Geometri peta diambil dari kontrak fitur GIS, bukan repository sendiri.
 * Izin ditegakkan di use case dan desa diambil dari sesi.
 */

import {
  getProfilDesa,
  listPerangkatWilayah,
  listWilayahAdministratif,
  upsertProfilWilayah,
} from "@/features/info-desa/pemerintahan/infrastructure/wilayah-repository";
import { getPetaGeometriTenant } from "@/features/pertanahan-gis/gis/application/use-cases";
import { validationError } from "@/lib/errors";

export async function getWilayahPemerintahanData() {
  const villageId = await tenant("wilayah");
  const [wilayah, geometri, officials, profil] = await Promise.all([
    listWilayahAdministratif(villageId),
    getPetaGeometriTenant(villageId),
    listPerangkatWilayah(villageId),
    getProfilDesa(villageId),
  ]);
  return { ...wilayah, ...geometri, officials, profil };
}

export async function simpanProfilWilayah(input: {
  luasWilayah: string | null;
  batasUtara: string | null;
  batasSelatan: string | null;
  batasTimur: string | null;
  batasBarat: string | null;
  ketinggian: string | null;
  suhuRataRata: string | null;
  curahHujan: string | null;
  topografi: string | null;
}) {
  const villageId = await tenant("wilayah", "update");
  if (
    input.luasWilayah &&
    (!Number.isFinite(Number(input.luasWilayah)) || Number(input.luasWilayah) < 0)
  ) {
    throw validationError("Luas wilayah harus berupa angka positif.");
  }
  await upsertProfilWilayah(villageId, input);
}
