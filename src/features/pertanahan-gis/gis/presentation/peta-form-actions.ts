"use server";

import { successState, toErrorState, type ActionState } from "@/lib/action-state";

import { simpanAreaPetaAction, simpanLayerPetaAction } from "./peta-actions";

/**
 * Pembungkus Server Action peta agar hasilnya bisa ditampilkan di dialog form
 * (sukses/galat) tanpa memindahkan halaman.
 */
async function jalankan(
  formData: FormData,
  aksi: (fd: FormData) => Promise<void>,
  pesan: string,
): Promise<ActionState<null>> {
  try {
    await aksi(formData);
    return successState(pesan, null);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function simpanLayerPetaFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanLayerPetaAction, "Layer peta disimpan.");
}

export async function simpanAreaPetaFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanAreaPetaAction, "Area GIS disimpan.");
}
