"use server";

import { successState, toErrorState, type ActionState } from "@/lib/action-state";

import {
  simpanBaganAction,
  simpanJabatanAction,
  simpanLembagaAction,
  simpanMasterLembagaAction,
  simpanPerangkatAction,
  simpanRiwayatAction,
  ubahDokumenPemerintahanAction,
  unggahDokumenPemerintahanAction,
} from "./actions";

/**
 * Pembungkus Server Action pemerintahan agar hasilnya bisa ditampilkan di
 * dialog form (sukses/galat) tanpa memindahkan halaman.
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

export async function simpanPerangkatFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanPerangkatAction, "Data perangkat desa disimpan.");
}

export async function simpanJabatanFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanJabatanAction, "Jabatan disimpan.");
}

export async function simpanBaganFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanBaganAction, "Susunan bagan disimpan.");
}

export async function simpanRiwayatFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanRiwayatAction, "Riwayat jabatan disimpan.");
}

export async function unggahDokumenFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, unggahDokumenPemerintahanAction, "Dokumen diunggah.");
}

export async function ubahDokumenFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, ubahDokumenPemerintahanAction, "Dokumen diperbarui.");
}

export async function simpanLembagaFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanLembagaAction, "Lembaga desa disimpan.");
}

export async function simpanMasterLembagaFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanMasterLembagaAction, "Kategori lembaga disimpan.");
}
