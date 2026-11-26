"use server";

import { revalidatePath } from "next/cache";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { simpanBerkasMedia } from "@/features/info-desa/publik/application/simpan-berkas-media";
import {
  hapusAreaPeta,
  hapusLayerPeta,
  simpanAreaPeta,
  simpanLayerPeta,
} from "@/features/pertanahan-gis/gis/application/use-cases";
import { requirePermission } from "@/lib/dal";
import { validationError } from "@/lib/errors";

/**
 * Server Action halaman Peta Desa.
 *
 * Berada di modul `gis` karena fitur ini satu-satunya pemilik tulis tabel
 * `areas`/`polygons`; `pemerintahan` hanya membaca geometri lewat kontrak
 * application-nya untuk editor batas wilayah.
 */

const value = (fd: FormData, key: string) => {
  const item = fd.get(key);
  return typeof item === "string" ? item.trim() : "";
};

const numberOrNull = (v: string) =>
  v && Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;

const refresh = () => {
  revalidatePath("/pemetaan/peta");
  revalidatePath("/profil-desa/wilayah-administratif");
  revalidatePath("/wilayah");
};

export async function simpanAreaPetaAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  const nama = value(fd, "nama");
  if (!nama) throw validationError("Nama area wajib diisi.");
  let foto = value(fd, "foto") || null;
  const fotoFile = fd.get("fotoFile");
  if (fotoFile instanceof File && fotoFile.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(fotoFile.type)) {
      throw validationError("Foto area harus berupa JPG, PNG, atau WEBP.");
    }
    const user = await requirePermission("peta", "update");
    const villageId = await resolveVillageId(user);
    foto = await simpanBerkasMedia(
      villageId,
      {
        nama: "foto-area",
        mime: fotoFile.type,
        ukuran: fotoFile.size,
        isi: new Uint8Array(await fotoFile.arrayBuffer()),
      },
      "umum",
      "fotoFile",
    );
  }
  await simpanAreaPeta(id, {
    nama,
    desk: value(fd, "desk") || null,
    foto,
    path: value(fd, "path") || null,
    enabled: value(fd, "enabled") === "on" ? 1 : 0,
    sortOrder: Number(value(fd, "sortOrder") || 0),
    refPolygon: numberOrNull(value(fd, "refPolygon")),
  });
  refresh();
}

export async function hapusAreaPetaAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID area tidak valid.");
  await hapusAreaPeta(id);
  refresh();
}

export async function simpanLayerPetaAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  const nama = value(fd, "nama");
  if (!nama) throw validationError("Nama layer wajib diisi.");
  await simpanLayerPeta(id, {
    nama,
    color: value(fd, "color") || "#7c3aed",
    tipe: 0,
    parrent: null,
    enabled: value(fd, "enabled") === "on",
    sortOrder: Number(value(fd, "sortOrder") || 0),
  });
  refresh();
}

export async function hapusLayerPetaAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID layer tidak valid.");
  await hapusLayerPeta(id);
  refresh();
}
