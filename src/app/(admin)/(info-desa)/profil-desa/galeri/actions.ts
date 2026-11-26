"use server";

import { revalidatePath } from "next/cache";

import {
  hapusAlbumGaleriAdmin,
  hapusFotoGaleriAdmin,
  hapusVideoGaleriAdmin,
  jadikanSampulGaleriAdmin,
  simpanMetadataAlbumAdmin,
  tambahAlbumGaleriAdmin,
  tambahVideoGaleriAdmin,
  ubahAlbumGaleriAdmin,
  ubahFotoGaleriAdmin,
  ubahStatusAlbumGaleriAdmin,
  unggahFotoGaleriAdmin,
} from "@/features/info-desa/publik/application/konten-admin";
import { successState, toErrorState, type ActionState } from "@/lib/action-state";

function field(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function tanggal(form: FormData, key: string): Date | null {
  const raw = field(form, key);
  if (!raw) return null;
  const parsed = new Date(raw + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) throw new Error("Tanggal tidak valid.");
  return parsed;
}

function revalidasi() {
  revalidatePath("/profil-desa/galeri", "layout");
  revalidatePath("/galeri");
}

/* --------------------------------------------------------------- dialog */

/** Pembungkus agar galat validasi tampil di dalam modal. */
async function jalankan(
  formData: FormData,
  aksi: (fd: FormData) => Promise<void>,
  pesan: string,
): Promise<ActionState<null>> {
  try {
    await aksi(formData);
    revalidasi();
    return successState(pesan, null);
  } catch (error) {
    return toErrorState(error);
  }
}

/** Simpan album dari modal: tambah bila tanpa id, ubah bila ada id. */
export async function simpanAlbumFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(
    fd,
    async (form) => {
      const id = Number(field(form, "id"));
      const data = {
        nama: field(form, "nama"),
        keterangan: field(form, "keterangan"),
        kategori: field(form, "kategori") || null,
        publishedAt: tanggal(form, "publishedAt"),
        urut: Number(field(form, "urut") || "0"),
      };
      if (Number.isSafeInteger(id) && id > 0) {
        await ubahAlbumGaleriAdmin(id, { ...data, aktif: form.get("aktif") === "on" });
      } else {
        await tambahAlbumGaleriAdmin(data);
      }
    },
    "Album disimpan.",
  );
}

/** Simpan foto dari modal ubah foto. */
export async function simpanFotoFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(
    fd,
    async (form) => {
      const id = Number(field(form, "id"));
      if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID foto tidak valid.");
      await ubahFotoGaleriAdmin(id, {
        judul: field(form, "judul"),
        keterangan: field(form, "keterangan"),
        urut: Number(field(form, "urut") || "0"),
        aktif: form.get("aktif") === "on",
        slider: form.get("slider") === "on",
      });
    },
    "Foto disimpan.",
  );
}

export async function ubahStatusAlbum(form: FormData) {
  const id = Number(field(form, "albumId"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID album tidak valid.");
  await ubahStatusAlbumGaleriAdmin(id, field(form, "aktif") === "true");
  revalidasi();
}

function videoProvider(value: string): { url: string; provider: "youtube" | "vimeo" } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      const id =
        url.searchParams.get("v") ||
        url.pathname.match(/^\/embed\/([\w-]+)/)?.[1] ||
        url.pathname.match(/^\/shorts\/([\w-]+)/)?.[1];
      if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
      return { url: "https://www.youtube-nocookie.com/embed/" + id, provider: "youtube" };
    }
    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
      return { url: "https://www.youtube-nocookie.com/embed/" + id, provider: "youtube" };
    }
    if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname)) {
      const id = url.pathname
        .split("/")
        .filter(Boolean)
        .find((part) => /^\d{5,12}$/.test(part));
      if (!id) return null;
      return { url: "https://player.vimeo.com/video/" + id, provider: "vimeo" };
    }
    return null;
  } catch {
    return null;
  }
}

export async function simpanMetadataAlbum(form: FormData) {
  const id = Number(field(form, "albumId"));
  const kategori = field(form, "kategori").slice(0, 80) || null;
  const publishedAt = tanggal(form, "publishedAt");
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error("Data album atau tanggal publikasi tidak valid.");
  }
  await simpanMetadataAlbumAdmin(id, kategori, publishedAt);
  revalidasi();
}

export async function tambahAlbum(form: FormData) {
  await tambahAlbumGaleriAdmin({
    nama: field(form, "nama"),
    keterangan: field(form, "keterangan"),
    kategori: field(form, "kategori") || null,
    publishedAt: tanggal(form, "publishedAt"),
    urut: Number(field(form, "urut") || "0"),
  });
  revalidasi();
}

export async function ubahAlbum(form: FormData) {
  const id = Number(field(form, "albumId"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID album tidak valid.");
  await ubahAlbumGaleriAdmin(id, {
    nama: field(form, "nama"),
    keterangan: field(form, "keterangan"),
    kategori: field(form, "kategori") || null,
    publishedAt: tanggal(form, "publishedAt"),
    urut: Number(field(form, "urut") || "0"),
    aktif: form.get("aktif") === "on",
  });
  revalidasi();
}

export async function hapusAlbum(form: FormData) {
  const id = Number(field(form, "albumId"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID album tidak valid.");
  await hapusAlbumGaleriAdmin(id);
  revalidasi();
}

export async function unggahFoto(form: FormData) {
  const albumId = Number(field(form, "albumId"));
  if (!Number.isSafeInteger(albumId) || albumId < 1) throw new Error("ID album tidak valid.");
  // Baca isi di sini: FormData tidak dapat diteruskan ke use case.
  const isi = await Promise.all(
    form
      .getAll("gambar")
      .filter((item): item is File => item instanceof File && item.size > 0)
      .map(async (file) => ({
        nama: file.name,
        mime: file.type,
        ukuran: file.size,
        isi: new Uint8Array(await file.arrayBuffer()),
      })),
  );
  await unggahFotoGaleriAdmin(albumId, isi);
  revalidasi();
}

export async function ubahFoto(form: FormData) {
  const id = Number(field(form, "fotoId"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID foto tidak valid.");
  await ubahFotoGaleriAdmin(id, {
    judul: field(form, "judul"),
    keterangan: field(form, "keterangan"),
    urut: Number(field(form, "urut") || "0"),
    aktif: form.get("aktif") === "on",
    slider: form.get("slider") === "on",
  });
  revalidasi();
}

export async function hapusFoto(form: FormData) {
  const id = Number(field(form, "fotoId"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID foto tidak valid.");
  await hapusFotoGaleriAdmin(id);
  revalidasi();
}

export async function jadikanSampul(form: FormData) {
  const albumId = Number(field(form, "albumId"));
  const fotoId = Number(field(form, "fotoId"));
  if (
    !Number.isSafeInteger(albumId) ||
    albumId < 1 ||
    !Number.isSafeInteger(fotoId) ||
    fotoId < 1
  ) {
    throw new Error("Data sampul tidak valid.");
  }
  await jadikanSampulGaleriAdmin(albumId, fotoId);
  revalidasi();
}

export async function tambahVideoGaleri(form: FormData) {
  const judul = field(form, "judul").slice(0, 150);
  const keterangan = field(form, "keterangan").slice(0, 2000) || null;
  const parsed = videoProvider(field(form, "url"));
  const publishedAt = tanggal(form, "publishedAt") ?? new Date();
  if (!judul || !parsed || Number.isNaN(publishedAt.getTime())) {
    throw new Error("Judul, URL YouTube/Vimeo yang valid, dan tanggal publikasi wajib benar.");
  }
  await tambahVideoGaleriAdmin({
    judul,
    keterangan,
    url: parsed.url,
    provider: parsed.provider,
    publishedAt,
  });
  revalidasi();
}

/** Simpan video dari modal tambah video. */
export async function simpanVideoFormAction(_state: ActionState<null>, fd: FormData) {
  return jalankan(fd, tambahVideoGaleri, "Video disimpan.");
}

export async function hapusVideoGaleri(form: FormData) {
  const id = Number(field(form, "videoId"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID video tidak valid.");
  await hapusVideoGaleriAdmin(id);
  revalidasi();
}
