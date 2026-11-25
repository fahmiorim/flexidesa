"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hapusBeritaAdmin,
  hapusKategoriBeritaAdmin,
  slugBerita,
  tambahBeritaAdmin,
  tambahKategoriBeritaAdmin,
  ubahBeritaAdmin,
  ubahKategoriBeritaAdmin,
  ubahStatusBeritaAdmin,
  type BeritaAdminInput,
} from "@/features/publik/application/konten-admin";
import { successState, toErrorState, type ActionState } from "@/lib/action-state";

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function idDari(form: FormData, key = "id") {
  const id = Number(field(form, key));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function tanggal(nilai: string): Date | null {
  if (!nilai) return null;
  const date = new Date(`${nilai}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Susun input berita dari FormData.
 * Slug kosong diturunkan dari judul, sama seperti form di halaman Website.
 */
async function bacaInput(form: FormData): Promise<{
  input: BeritaAdminInput;
  gambar?: { nama: string; mime: string; ukuran: number; isi: Uint8Array };
}> {
  const judul = field(form, "judulBerita");
  const slug = slugBerita(field(form, "slugBerita") || judul);
  const kategori = Number(field(form, "kategoriId"));
  const status = field(form, "statusBerita") === "published" ? "published" : "draft";
  const file = form.get("gambarBerita");
  const gambar =
    file instanceof File && file.size > 0
      ? {
          nama: file.name,
          mime: file.type,
          ukuran: file.size,
          isi: new Uint8Array(await file.arrayBuffer()),
        }
      : undefined;
  return {
    input: {
      judul,
      slug,
      ringkasan: field(form, "ringkasanBerita") || null,
      isi: field(form, "isiBerita"),
      kategoriId: Number.isSafeInteger(kategori) && kategori > 0 ? kategori : null,
      status,
      terbitPada: tanggal(field(form, "terbitPada")),
      headline: form.get("headline") === "on",
      slider: form.get("tampilSlider") === "on",
    },
    gambar,
  };
}

/** Tambah berita baru atau ubah berita yang sudah ada, tergantung `id`. */
export async function simpanBeritaAction(form: FormData): Promise<void> {
  const id = idDari(form);
  const { input, gambar } = await bacaInput(form);
  if (id) {
    await ubahBeritaAdmin(id, input, gambar);
  } else {
    await tambahBeritaAdmin(input, gambar);
  }
}

export async function simpanKategoriBeritaAction(form: FormData): Promise<void> {
  const id = idDari(form);
  const nama = field(form, "namaKategori");
  const slug = field(form, "slugKategori");
  if (id) {
    await ubahKategoriBeritaAdmin(id, nama, slug);
  } else {
    await tambahKategoriBeritaAdmin(nama, slug);
  }
}

/* --------------------------------------------------------------- dialog */

/** Pembungkus agar galat validasi tampil di dalam modal, bukan halaman error. */
async function jalankan(
  formData: FormData,
  aksi: (fd: FormData) => Promise<void>,
  pesan: string,
): Promise<ActionState<null>> {
  try {
    await aksi(formData);
    revalidatePath("/konten/berita");
    return successState(pesan, null);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function simpanBeritaFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanBeritaAction, "Berita disimpan.");
}

export async function simpanKategoriBeritaFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, simpanKategoriBeritaAction, "Kategori berita disimpan.");
}

/* ------------------------------------------------------------ aksi baris */

export async function ubahStatusBeritaAction(form: FormData): Promise<void> {
  const id = idDari(form);
  if (!id) throw new Error("Berita tidak valid.");
  const status = field(form, "status") === "published" ? "published" : "draft";
  await ubahStatusBeritaAdmin(id, status);
  revalidatePath("/konten/berita");
  redirect("/konten/berita?saved=1");
}

export async function hapusBeritaAction(form: FormData): Promise<void> {
  const id = idDari(form);
  if (!id) throw new Error("Berita tidak valid.");
  await hapusBeritaAdmin(id);
  revalidatePath("/konten/berita");
  redirect("/konten/berita?deleted=1");
}

export async function hapusKategoriBeritaAction(form: FormData): Promise<void> {
  const id = idDari(form);
  if (!id) throw new Error("Kategori tidak valid.");
  await hapusKategoriBeritaAdmin(id);
  revalidatePath("/konten/berita");
}
