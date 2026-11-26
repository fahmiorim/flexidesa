"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hapusAgendaWebsiteAction as useCasehapusAgendaWebsiteAction,
  hapusAlbumGaleriWebsiteAction as useCasehapusAlbumGaleriWebsiteAction,
  hapusBeritaWebsiteAction as useCasehapusBeritaWebsiteAction,
  hapusFotoGaleriWebsiteAction as useCasehapusFotoGaleriWebsiteAction,
  hapusHalamanWebsiteAction as useCasehapusHalamanWebsiteAction,
  hapusKategoriBeritaWebsiteAction as useCasehapusKategoriBeritaWebsiteAction,
  hapusMenuWebsiteAction as useCasehapusMenuWebsiteAction,
  hapusSliderWebsiteAction as useCasehapusSliderWebsiteAction,
  hapusWidgetWebsiteAction as useCasehapusWidgetWebsiteAction,
  simpanIdentitasWebsiteAction as useCasesimpanIdentitasWebsiteAction,
  tambahAgendaWebsiteAction as useCasetambahAgendaWebsiteAction,
  tambahAlbumWebsiteAction as useCasetambahAlbumWebsiteAction,
  tambahBeritaWebsiteAction as useCasetambahBeritaWebsiteAction,
  tambahHalamanWebsiteAction as useCasetambahHalamanWebsiteAction,
  tambahKategoriBeritaWebsiteAction as useCasetambahKategoriBeritaWebsiteAction,
  tambahMenuWebsiteAction as useCasetambahMenuWebsiteAction,
  tambahSliderWebsiteAction as useCasetambahSliderWebsiteAction,
  tambahWidgetWebsiteAction as useCasetambahWidgetWebsiteAction,
  ubahAgendaWebsiteAction as useCaseubahAgendaWebsiteAction,
  ubahAlbumWebsiteAction as useCaseubahAlbumWebsiteAction,
  ubahBeritaWebsiteAction as useCaseubahBeritaWebsiteAction,
  ubahFotoGaleriWebsiteAction as useCaseubahFotoGaleriWebsiteAction,
  ubahHalamanWebsiteAction as useCaseubahHalamanWebsiteAction,
  ubahKategoriBeritaWebsiteAction as useCaseubahKategoriBeritaWebsiteAction,
  ubahMenuWebsiteAction as useCaseubahMenuWebsiteAction,
  ubahMenuWebsiteDetailAction as useCaseubahMenuWebsiteDetailAction,
  ubahSliderWebsiteAction as useCaseubahSliderWebsiteAction,
  ubahStatusAgendaWebsiteAction as useCaseubahStatusAgendaWebsiteAction,
  ubahStatusBeritaWebsiteAction as useCaseubahStatusBeritaWebsiteAction,
  ubahStatusHalamanWebsiteAction as useCaseubahStatusHalamanWebsiteAction,
  ubahStatusSliderWebsiteAction as useCaseubahStatusSliderWebsiteAction,
  ubahStatusWidgetWebsiteAction as useCaseubahStatusWidgetWebsiteAction,
  ubahWidgetWebsiteAction as useCaseubahWidgetWebsiteAction,
  unggahFotoWebsiteAction as useCaseunggahFotoWebsiteAction,
} from "@/features/info-desa/publik/application/website-admin-use-cases";

/**
 * Adapter Server Action Website: menjalankan use case lalu menerapkan efek
 * Next (`revalidatePath`/`redirect`) dari hasil yang dikembalikan. Logika
 * bisnis dan izin tetap di application layer.
 */

async function jalankan(
  tugas: (fd: FormData) => Promise<{ revalidate: string[]; redirectTo: string }>,
  fd: FormData,
): Promise<void> {
  const hasil = await tugas(fd);
  for (const path of hasil.revalidate) revalidatePath(path);
  redirect(hasil.redirectTo);
}

export async function simpanIdentitasWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasesimpanIdentitasWebsiteAction, fd);
}

export async function tambahMenuWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasetambahMenuWebsiteAction, fd);
}

export async function ubahMenuWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahMenuWebsiteAction, fd);
}

export async function hapusMenuWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasehapusMenuWebsiteAction, fd);
}

export async function tambahHalamanWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasetambahHalamanWebsiteAction, fd);
}

export async function ubahStatusHalamanWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahStatusHalamanWebsiteAction, fd);
}

export async function hapusHalamanWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasehapusHalamanWebsiteAction, fd);
}

export async function tambahAlbumWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasetambahAlbumWebsiteAction, fd);
}

export async function unggahFotoWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseunggahFotoWebsiteAction, fd);
}

export async function ubahMenuWebsiteDetailAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahMenuWebsiteDetailAction, fd);
}

export async function tambahBeritaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasetambahBeritaWebsiteAction, fd);
}

export async function ubahStatusBeritaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahStatusBeritaWebsiteAction, fd);
}

export async function tambahAgendaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasetambahAgendaWebsiteAction, fd);
}

export async function ubahStatusAgendaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahStatusAgendaWebsiteAction, fd);
}

export async function tambahWidgetWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasetambahWidgetWebsiteAction, fd);
}

export async function ubahStatusWidgetWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahStatusWidgetWebsiteAction, fd);
}

export async function tambahSliderWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasetambahSliderWebsiteAction, fd);
}

export async function ubahStatusSliderWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahStatusSliderWebsiteAction, fd);
}

export async function hapusBeritaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasehapusBeritaWebsiteAction, fd);
}

export async function hapusAgendaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasehapusAgendaWebsiteAction, fd);
}

export async function hapusSliderWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasehapusSliderWebsiteAction, fd);
}

export async function ubahHalamanWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahHalamanWebsiteAction, fd);
}

export async function tambahKategoriBeritaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasetambahKategoriBeritaWebsiteAction, fd);
}

export async function hapusFotoGaleriWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasehapusFotoGaleriWebsiteAction, fd);
}

export async function hapusWidgetWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasehapusWidgetWebsiteAction, fd);
}

export async function hapusAlbumGaleriWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasehapusAlbumGaleriWebsiteAction, fd);
}

export async function ubahBeritaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahBeritaWebsiteAction, fd);
}

export async function ubahAgendaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahAgendaWebsiteAction, fd);
}

export async function ubahAlbumWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahAlbumWebsiteAction, fd);
}

export async function ubahFotoGaleriWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahFotoGaleriWebsiteAction, fd);
}

export async function ubahSliderWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahSliderWebsiteAction, fd);
}

export async function ubahKategoriBeritaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahKategoriBeritaWebsiteAction, fd);
}

export async function hapusKategoriBeritaWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCasehapusKategoriBeritaWebsiteAction, fd);
}

export async function ubahWidgetWebsiteAction(fd: FormData): Promise<void> {
  return jalankan(useCaseubahWidgetWebsiteAction, fd);
}
