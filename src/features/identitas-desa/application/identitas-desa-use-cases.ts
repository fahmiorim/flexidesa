import "server-only";

import { getIdentitasFromRequest } from "@/features/desa/application/resolve-village";
import {
  profilDesaSchema,
  sebutanDesaSchema,
} from "@/features/identitas-desa/domain/identitas-desa";
import {
  bacaDokumenRegulasiAdat,
  bacaFaviconDesa,
  bacaFotoKantorDesa,
  bacaIdentitasDesa,
  bacaLogoDesa,
  bacaProfilDesa,
  bacaSebutanDesa,
  bacaStrukturAdat,
  simpanDokumenRegulasiAdat,
  simpanFaviconDesa,
  simpanFotoKantorDesa,
  simpanLogoDesa,
  simpanProfilDesa as simpanProfilDesaRepo,
  simpanSebutanDesa as simpanSebutanDesaRepo,
  simpanStrukturAdat,
} from "@/features/identitas-desa/infrastructure/identitas-desa-repository";
import { hapusMedia } from "@/features/publik/infrastructure/media-storage";
import { validationError } from "@/lib/errors";

/** Data yang dimiliki halaman Identitas Desa. */
export async function getDataIdentitasDesa(villageId: number) {
  const [desa, profil, sebutan] = await Promise.all([
    bacaIdentitasDesa(villageId),
    bacaProfilDesa(villageId),
    bacaSebutanDesa(villageId),
  ]);
  return { desa, profil, sebutan };
}

export async function simpanProfilDesa(villageId: number, input: unknown): Promise<void> {
  const parsed = profilDesaSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message ?? "Profil tidak valid.");
  }
  await simpanProfilDesaRepo(villageId, parsed.data);
}

export async function simpanSebutanDesa(villageId: number, input: unknown): Promise<void> {
  const parsed = sebutanDesaSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message ?? "Sebutan wilayah tidak valid.");
  }
  await simpanSebutanDesaRepo(villageId, parsed.data);
}

export type MediaIdentitas = "logo" | "favicon" | "foto-kantor" | "struktur-adat" | "dokumen-adat";

function bacaMediaIdentitas(villageId: number, field: MediaIdentitas) {
  if (field === "logo") return bacaLogoDesa(villageId);
  if (field === "foto-kantor") return bacaFotoKantorDesa(villageId);
  if (field === "struktur-adat") return bacaStrukturAdat(villageId);
  if (field === "dokumen-adat") return bacaDokumenRegulasiAdat(villageId);
  return bacaFaviconDesa(villageId);
}

function tulisMediaIdentitas(villageId: number, field: MediaIdentitas, path: string | null) {
  if (field === "logo") return simpanLogoDesa(villageId, path);
  if (field === "foto-kantor") return simpanFotoKantorDesa(villageId, path);
  if (field === "struktur-adat") return simpanStrukturAdat(villageId, path);
  if (field === "dokumen-adat") return simpanDokumenRegulasiAdat(villageId, path);
  return simpanFaviconDesa(villageId, path);
}

/** Simpan path media identitas baru dan hapus path lama yang tidak dipakai. */
export async function simpanMediaIdentitas(
  villageId: number,
  field: MediaIdentitas,
  path: string,
): Promise<void> {
  const lama = await bacaMediaIdentitas(villageId, field);
  await tulisMediaIdentitas(villageId, field, path);
  if (lama && lama !== path) await hapusMedia(lama);
}

/** Hapus referensi media identitas dan kembalikan path lama. */
export async function hapusMediaIdentitas(villageId: number, field: MediaIdentitas): Promise<void> {
  const lama = await bacaMediaIdentitas(villageId, field);
  await tulisMediaIdentitas(villageId, field, null);
  if (lama) await hapusMedia(lama);
}

/**
 * Path favicon tenant bila valid dan masih di folder tenant tersebut.
 *
 * Favicon khusus didahulukan; bila belum diisi, logo desa dipakai sebagai
 * favicon agar unggahan logo langsung tampil di tab browser. Bila keduanya
 * kosong, route favicon menyajikan ikon default aplikasi.
 */
export async function getPathFaviconDesa(villageId: number): Promise<string | null> {
  const valid = (path: string | null) =>
    path && path.startsWith(`${villageId}/umum/`) && !path.includes("..") ? path : null;
  return valid(await bacaFaviconDesa(villageId)) ?? valid(await bacaLogoDesa(villageId));
}

/** Tenant publik dan path favicon-nya, keduanya ditentukan server-side. */
export async function getFaviconPublik() {
  const desa = await getIdentitasFromRequest();
  return { villageId: desa.id, path: await getPathFaviconDesa(desa.id) };
}
