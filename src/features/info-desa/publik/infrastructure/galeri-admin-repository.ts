import "server-only";

/**
 * Query album, foto, dan slider (admin).
 *
 * Seluruh fungsi wajib menerima `villageId` dari sesi sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, asc, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { galeriAlbum, galeriFoto, slider } from "@/db/schema";

export async function listAlbumAdmin(villageId: number) {
  return db
    .select({
      id: galeriAlbum.id,
      nama: galeriAlbum.nama,
      slug: galeriAlbum.slug,
      keterangan: galeriAlbum.keterangan,
      sampul: galeriAlbum.sampul,
      aktif: galeriAlbum.aktif,
      urut: galeriAlbum.urut,
    })
    .from(galeriAlbum)
    .where(eq(galeriAlbum.villageId, villageId));
}

/** Album lengkap untuk admin galeri: semua album (termasuk nonaktif). */
export async function listAlbumAdminLengkap(villageId: number) {
  const rows = await db
    .select({
      id: galeriAlbum.id,
      nama: galeriAlbum.nama,
      slug: galeriAlbum.slug,
      keterangan: galeriAlbum.keterangan,
      kategori: galeriAlbum.kategori,
      publishedAt: galeriAlbum.publishedAt,
      sampul: galeriAlbum.sampul,
      aktif: galeriAlbum.aktif,
      urut: galeriAlbum.urut,
    })
    .from(galeriAlbum)
    .where(eq(galeriAlbum.villageId, villageId))
    .orderBy(asc(galeriAlbum.urut), desc(galeriAlbum.id));
  const hitung = await hitungFotoPerAlbum(villageId);
  const fotoByAlbum = new Map(hitung.map((row) => [row.albumId, Number(row.jumlah ?? 0)]));
  return rows.map((row) => ({ ...row, jumlahFoto: fotoByAlbum.get(row.id) ?? 0 }));
}

/** Satu album lengkap (semua kolom) untuk edit/hapus admin. */
export async function cariAlbumByIdLengkap(villageId: number, id: number) {
  const [row] = await db
    .select({
      id: galeriAlbum.id,
      nama: galeriAlbum.nama,
      slug: galeriAlbum.slug,
      keterangan: galeriAlbum.keterangan,
      kategori: galeriAlbum.kategori,
      publishedAt: galeriAlbum.publishedAt,
      sampul: galeriAlbum.sampul,
      aktif: galeriAlbum.aktif,
      urut: galeriAlbum.urut,
    })
    .from(galeriAlbum)
    .where(and(eq(galeriAlbum.villageId, villageId), eq(galeriAlbum.id, id)))
    .limit(1);
  return row;
}

/** Foto satu album (semua status) untuk halaman kelola foto admin. */
export async function listFotoByAlbumAdmin(villageId: number, albumId: number) {
  return db
    .select({
      id: galeriFoto.id,
      albumId: galeriFoto.albumId,
      gambar: galeriFoto.gambar,
      judul: galeriFoto.judul,
      keterangan: galeriFoto.keterangan,
      aktif: galeriFoto.aktif,
      slider: galeriFoto.slider,
      urut: galeriFoto.urut,
    })
    .from(galeriFoto)
    .where(and(eq(galeriFoto.villageId, villageId), eq(galeriFoto.albumId, albumId)))
    .orderBy(asc(galeriFoto.urut), desc(galeriFoto.id));
}

/** Satu foto lengkap (semua kolom) milik desa, untuk edit/hapus admin. */
export async function cariFotoByIdLengkap(villageId: number, id: number) {
  const [row] = await db
    .select({
      id: galeriFoto.id,
      albumId: galeriFoto.albumId,
      gambar: galeriFoto.gambar,
      judul: galeriFoto.judul,
      keterangan: galeriFoto.keterangan,
      aktif: galeriFoto.aktif,
      slider: galeriFoto.slider,
      urut: galeriFoto.urut,
    })
    .from(galeriFoto)
    .where(and(eq(galeriFoto.villageId, villageId), eq(galeriFoto.id, id)))
    .limit(1);
  return row;
}

export async function listFotoAdmin(villageId: number) {
  return db
    .select({
      id: galeriFoto.id,
      albumId: galeriFoto.albumId,
      gambar: galeriFoto.gambar,
      judul: galeriFoto.judul,
      keterangan: galeriFoto.keterangan,
      aktif: galeriFoto.aktif,
      slider: galeriFoto.slider,
      urut: galeriFoto.urut,
    })
    .from(galeriFoto)
    .where(eq(galeriFoto.villageId, villageId))
    .orderBy(desc(galeriFoto.updatedAt));
}

/** Jumlah foto per album; dipetakan ke album oleh application layer. */
export async function hitungFotoPerAlbum(villageId: number) {
  return db
    .select({ albumId: galeriFoto.albumId, jumlah: count() })
    .from(galeriFoto)
    .where(eq(galeriFoto.villageId, villageId))
    .groupBy(galeriFoto.albumId);
}

export async function cariAlbumBySlug(villageId: number, slug: string) {
  const [row] = await db
    .select({ id: galeriAlbum.id })
    .from(galeriAlbum)
    .where(and(eq(galeriAlbum.villageId, villageId), eq(galeriAlbum.slug, slug)))
    .limit(1);
  return row;
}

export async function buatAlbum(
  villageId: number,
  data: {
    nama: string;
    slug: string;
    keterangan: string | null;
    kategori?: string | null;
    publishedAt?: Date | null;
    urut?: number;
  },
) {
  await db.insert(galeriAlbum).values({
    villageId,
    ...data,
    kategori: data.kategori ?? null,
    publishedAt: data.publishedAt ?? null,
    aktif: true,
    urut: data.urut ?? 0,
  });
}

export async function hapusAlbum(villageId: number, id: number) {
  await db
    .delete(galeriAlbum)
    .where(and(eq(galeriAlbum.villageId, villageId), eq(galeriAlbum.id, id)));
}

export async function ubahAlbum(
  villageId: number,
  id: number,
  data: {
    nama: string;
    slug: string;
    keterangan: string | null;
    sampul: string | null;
    aktif: boolean;
    urut: number;
  },
) {
  await db
    .update(galeriAlbum)
    .set(data)
    .where(and(eq(galeriAlbum.villageId, villageId), eq(galeriAlbum.id, id)));
}

/* ----------------------------------------------------------------- foto */

export async function listGambarFotoByAlbum(villageId: number, albumId: number) {
  return db
    .select({ gambar: galeriFoto.gambar })
    .from(galeriFoto)
    .where(and(eq(galeriFoto.villageId, villageId), eq(galeriFoto.albumId, albumId)));
}

export async function buatFoto(
  villageId: number,
  data: {
    albumId: number;
    gambar: string;
    judul: string | null;
    keterangan: string | null;
  },
) {
  await db.insert(galeriFoto).values({ villageId, ...data, aktif: true, slider: false, urut: 0 });
}

export async function hapusFoto(villageId: number, id: number) {
  await db
    .delete(galeriFoto)
    .where(and(eq(galeriFoto.villageId, villageId), eq(galeriFoto.id, id)));
}

export async function ubahFoto(
  villageId: number,
  id: number,
  data: {
    albumId: number;
    gambar: string;
    judul: string | null;
    keterangan: string | null;
    aktif: boolean;
    slider: boolean;
    urut: number;
  },
) {
  await db
    .update(galeriFoto)
    .set(data)
    .where(and(eq(galeriFoto.villageId, villageId), eq(galeriFoto.id, id)));
}

/* --------------------------------------------------------------- slider */

export async function listSliderAdmin(villageId: number) {
  return db
    .select({
      id: slider.id,
      judul: slider.judul,
      keterangan: slider.keterangan,
      gambar: slider.gambar,
      tautan: slider.tautan,
      aktif: slider.aktif,
      urut: slider.urut,
    })
    .from(slider)
    .where(eq(slider.villageId, villageId))
    .orderBy(slider.urut);
}

export async function ambilGambarSlider(villageId: number, id: number) {
  const [row] = await db
    .select({ gambar: slider.gambar })
    .from(slider)
    .where(and(eq(slider.villageId, villageId), eq(slider.id, id)))
    .limit(1);
  return row;
}

export async function ubahSlider(
  villageId: number,
  id: number,
  data: {
    gambar: string;
    judul: string | null;
    keterangan: string | null;
    tautan: string | null;
    urut: number;
  },
) {
  await db
    .update(slider)
    .set(data)
    .where(and(eq(slider.villageId, villageId), eq(slider.id, id)));
}

/* --------------------------------------------------------------- widget */
