"use server";

import { errorState, successState, type ActionState } from "@/lib/action-state";
import { isRedirectError } from "@/lib/form-action-state";

import {
  tambahAgendaWebsiteAction,
  tambahAlbumWebsiteAction,
  tambahBeritaWebsiteAction,
  tambahHalamanWebsiteAction,
  tambahKategoriBeritaWebsiteAction,
  tambahMenuWebsiteAction,
  tambahSliderWebsiteAction,
  tambahWidgetWebsiteAction,
  ubahAgendaWebsiteAction,
  ubahAlbumWebsiteAction,
  ubahBeritaWebsiteAction,
  ubahFotoGaleriWebsiteAction,
  ubahHalamanWebsiteAction,
  ubahKategoriBeritaWebsiteAction,
  ubahMenuWebsiteDetailAction,
  ubahSliderWebsiteAction,
  ubahWidgetWebsiteAction,
  unggahFotoWebsiteAction,
} from "./actions";

/**
 * Bungkus aksi redirect Website untuk `FormDialog`.
 * Pesan galat use case (Error biasa) ditampilkan di dialog apa adanya;
 * redirect dianggap berhasil agar dialog menutup dan daftar dimuat ulang.
 */
async function bungkus(
  fd: FormData,
  aksi: (formData: FormData) => Promise<void>,
  pesan: string,
): Promise<ActionState<null>> {
  try {
    await aksi(fd);
    return successState(pesan, null);
  } catch (error) {
    if (isRedirectError(error)) return successState(pesan, null);
    return errorState(error instanceof Error ? error.message : "Data tidak dapat disimpan.");
  }
}

export async function tambahAgendaFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, tambahAgendaWebsiteAction, "Agenda disimpan.");
}

export async function ubahAgendaFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, ubahAgendaWebsiteAction, "Agenda disimpan.");
}

export async function tambahBeritaFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, tambahBeritaWebsiteAction, "Berita disimpan.");
}

export async function ubahBeritaFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, ubahBeritaWebsiteAction, "Berita disimpan.");
}

export async function tambahKategoriBeritaFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, tambahKategoriBeritaWebsiteAction, "Kategori disimpan.");
}

export async function ubahKategoriBeritaFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, ubahKategoriBeritaWebsiteAction, "Kategori disimpan.");
}

export async function tambahAlbumWebsiteFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, tambahAlbumWebsiteAction, "Album disimpan.");
}

export async function ubahAlbumWebsiteFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, ubahAlbumWebsiteAction, "Album disimpan.");
}

export async function ubahFotoGaleriWebsiteFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, ubahFotoGaleriWebsiteAction, "Foto disimpan.");
}

export async function unggahFotoWebsiteFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, unggahFotoWebsiteAction, "Foto diunggah.");
}

export async function tambahSliderWebsiteFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, tambahSliderWebsiteAction, "Slider disimpan.");
}

export async function ubahSliderWebsiteFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, ubahSliderWebsiteAction, "Slider disimpan.");
}

export async function tambahHalamanFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, tambahHalamanWebsiteAction, "Halaman disimpan.");
}

export async function ubahHalamanFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, ubahHalamanWebsiteAction, "Halaman disimpan.");
}

export async function tambahMenuFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, tambahMenuWebsiteAction, "Menu disimpan.");
}

export async function ubahMenuFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, ubahMenuWebsiteDetailAction, "Menu disimpan.");
}

export async function tambahWidgetFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, tambahWidgetWebsiteAction, "Widget disimpan.");
}

export async function ubahWidgetFormAction(_state: ActionState<null>, fd: FormData) {
  return bungkus(fd, ubahWidgetWebsiteAction, "Widget disimpan.");
}
