"use server";

import { revalidatePath } from "next/cache";

import {
  geserUrutanWilayah,
  hapusWilayah,
  simpanBatasWilayah,
  simpanPetaKantor,
  simpanWilayah,
  ubahWilayah,
} from "@/features/info-desa/wilayah/application/use-cases";
import {
  createIdleActionState,
  successState,
  toErrorState,
  type ActionState,
} from "@/lib/action-state";
import { validationError } from "@/lib/errors";

const value = (fd: FormData, key: string) => {
  const item = fd.get(key);
  return typeof item === "string" ? item.trim() : "";
};

const numberOrNull = (v: string) =>
  v && Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;

function refresh() {
  revalidatePath("/profil-desa/wilayah-administratif");
  revalidatePath("/pemerintahan");
}

export async function simpanWilayahAction(
  _state: ActionState<null> = createIdleActionState<null>(),
  fd: FormData,
): Promise<ActionState<null>> {
  try {
    await simpanWilayah({
      dusun: value(fd, "dusun"),
      rw: value(fd, "rw"),
      rt: value(fd, "rt"),
      kepala: value(fd, "kepala"),
      kepalaResidentId: numberOrNull(value(fd, "kepalaResidentId")),
      luasHa: value(fd, "luasHa") || null,
      urut: value(fd, "urut") || 0,
    });
    refresh();
    return successState("Wilayah berhasil ditambahkan.");
  } catch (error) {
    return toErrorState(error);
  }
}

export async function ubahWilayahAction(
  _state: ActionState<null> = createIdleActionState<null>(),
  fd: FormData,
): Promise<ActionState<null>> {
  try {
    const id = numberOrNull(value(fd, "id"));
    if (!id) throw validationError("ID wilayah tidak valid.");
    await ubahWilayah(id, {
      dusun: value(fd, "dusun"),
      rw: value(fd, "rw"),
      rt: value(fd, "rt"),
      kepala: value(fd, "kepala"),
      kepalaResidentId: numberOrNull(value(fd, "kepalaResidentId")),
      luasHa: value(fd, "luasHa") || null,
      urut: value(fd, "urut") || 0,
    });
    refresh();
    return successState("Perubahan wilayah disimpan.");
  } catch (error) {
    return toErrorState(error);
  }
}

export async function hapusWilayahAction(
  _state: ActionState<null> = createIdleActionState<null>(),
  fd: FormData,
): Promise<ActionState<null>> {
  try {
    const id = numberOrNull(value(fd, "id"));
    if (!id) throw validationError("ID wilayah tidak valid.");
    await hapusWilayah(id);
    refresh();
    return successState("Wilayah dihapus.");
  } catch (error) {
    return toErrorState(error);
  }
}

/** Menggeser urutan wilayah satu langkah ke atas/bawah. */
export async function geserUrutanWilayahAction(fd: FormData): Promise<void> {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID wilayah tidak valid.");
  const arah = value(fd, "arah");
  if (arah !== "naik" && arah !== "turun") throw validationError("Arah urutan tidak valid.");
  await geserUrutanWilayah(id, arah);
  refresh();
}

export async function simpanPetaKantorAction(
  _state: ActionState<null> = createIdleActionState<null>(),
  fd: FormData,
): Promise<ActionState<null>> {
  try {
    const id = numberOrNull(value(fd, "id"));
    if (!id) throw validationError("ID wilayah tidak valid.");
    await simpanPetaKantor(id, {
      koordinat: value(fd, "koordinat"),
      zoom: value(fd, "zoom") || null,
      mapTipe: value(fd, "mapTipe") || null,
    });
    refresh();
    return successState("Peta kantor wilayah disimpan.");
  } catch (error) {
    return toErrorState(error);
  }
}

export async function simpanBatasWilayahAction(
  _state: ActionState<null> = createIdleActionState<null>(),
  fd: FormData,
): Promise<ActionState<null>> {
  try {
    const id = numberOrNull(value(fd, "id"));
    if (!id) throw validationError("ID wilayah tidak valid.");
    await simpanBatasWilayah(id, {
      path: value(fd, "path"),
      zoom: value(fd, "zoom") || null,
      warna: value(fd, "warna") || null,
      border: value(fd, "border") || null,
    });
    refresh();
    return successState("Batas wilayah disimpan.");
  } catch (error) {
    return toErrorState(error);
  }
}
