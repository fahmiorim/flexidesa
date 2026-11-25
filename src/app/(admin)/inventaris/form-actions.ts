"use server";

import { successState, toErrorState, type ActionState } from "@/lib/action-state";

import { simpanInventarisAction, simpanKategoriInventarisAction } from "./actions";

/** Server Action inventaris mengakhiri alurnya dengan `redirect()`. */
function isRedirect(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/**
 * Pembungkus aksi inventaris untuk dialog: penyimpanan berhasil tidak
 * mengalihkan halaman, cukup menutup dialog dan memuat ulang daftar.
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
    if (isRedirect(error)) return successState(pesan, null);
    return toErrorState(error);
  }
}

export async function simpanInventarisFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanInventarisAction, "Inventaris disimpan.");
}

export async function simpanKategoriInventarisFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanKategoriInventarisAction, "Kategori inventaris disimpan.");
}
