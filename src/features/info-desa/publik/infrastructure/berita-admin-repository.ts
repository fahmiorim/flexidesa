import "server-only";

/**
 * Query berita dan kategori (admin).
 *
 * Seluruh fungsi wajib menerima `villageId` dari sesi sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { berita, beritaKategori } from "@/db/schema";

export async function listBeritaAdmin(villageId: number, limit = 100) {
  return db
    .select({
      id: berita.id,
      judul: berita.judul,
      slug: berita.slug,
      gambar: berita.gambar,
      status: berita.status,
      terbitPada: berita.terbitPada,
      kategori: beritaKategori.nama,
      hit: berita.hit,
    })
    .from(berita)
    .leftJoin(
      beritaKategori,
      and(eq(berita.kategoriId, beritaKategori.id), eq(beritaKategori.villageId, villageId)),
    )
    .where(eq(berita.villageId, villageId))
    .orderBy(desc(berita.updatedAt))
    .limit(limit);
}

export async function listBeritaKontenAdmin(villageId: number, limit = 100) {
  return db
    .select({
      id: berita.id,
      judul: berita.judul,
      slug: berita.slug,
      ringkasan: berita.ringkasan,
      isi: berita.isi,
      gambar: berita.gambar,
      status: berita.status,
      terbitPada: berita.terbitPada,
      kategoriId: berita.kategoriId,
      kategori: beritaKategori.nama,
      hit: berita.hit,
      headline: berita.headline,
      slider: berita.slider,
    })
    .from(berita)
    .leftJoin(
      beritaKategori,
      and(eq(berita.kategoriId, beritaKategori.id), eq(beritaKategori.villageId, villageId)),
    )
    .where(eq(berita.villageId, villageId))
    .orderBy(desc(berita.updatedAt))
    .limit(limit);
}

export async function listKategoriBeritaAdmin(villageId: number) {
  return db
    .select({ id: beritaKategori.id, nama: beritaKategori.nama, slug: beritaKategori.slug })
    .from(beritaKategori)
    .where(eq(beritaKategori.villageId, villageId))
    .orderBy(beritaKategori.nama);
}

export async function cariBeritaBySlug(villageId: number, slug: string) {
  const [row] = await db
    .select({ id: berita.id })
    .from(berita)
    .where(and(eq(berita.villageId, villageId), eq(berita.slug, slug)))
    .limit(1);
  return row;
}

export async function ambilGambarBerita(villageId: number, id: number) {
  const [row] = await db
    .select({ gambar: berita.gambar })
    .from(berita)
    .where(and(eq(berita.villageId, villageId), eq(berita.id, id)))
    .limit(1);
  return row;
}

export async function buatBerita(
  villageId: number,
  data: {
    judul: string;
    slug: string;
    ringkasan: string | null;
    isi: string;
    kategoriId: number | null;
    gambar: string | null;
    status: string;
    terbitPada: Date | null;
    headline: boolean;
    slider: boolean;
  },
) {
  await db.insert(berita).values({ villageId, ...data });
}

export async function ubahStatusBerita(villageId: number, id: number, status: string) {
  await db
    .update(berita)
    .set({ status, terbitPada: status === "published" ? new Date() : null })
    .where(and(eq(berita.villageId, villageId), eq(berita.id, id)));
}

export async function hapusBerita(villageId: number, id: number) {
  await db.delete(berita).where(and(eq(berita.villageId, villageId), eq(berita.id, id)));
}

export async function cariBeritaById(villageId: number, id: number) {
  const [row] = await db
    .select({ id: berita.id, gambar: berita.gambar, terbitPada: berita.terbitPada })
    .from(berita)
    .where(and(eq(berita.villageId, villageId), eq(berita.id, id)))
    .limit(1);
  return row;
}

export async function ubahBerita(
  villageId: number,
  id: number,
  data: {
    judul: string;
    slug: string;
    ringkasan: string | null;
    isi: string;
    kategoriId: number | null;
    gambar: string | null;
    status: string;
    terbitPada: Date | null;
    headline: boolean;
    slider: boolean;
  },
) {
  await db
    .update(berita)
    .set(data)
    .where(and(eq(berita.villageId, villageId), eq(berita.id, id)));
}

/* ----------------------------------------------------------------- menu */

export async function cariKategoriById(villageId: number, id: number) {
  const [row] = await db
    .select({ id: beritaKategori.id })
    .from(beritaKategori)
    .where(and(eq(beritaKategori.villageId, villageId), eq(beritaKategori.id, id)))
    .limit(1);
  return row;
}

export async function cariKategoriBySlug(villageId: number, slug: string) {
  const [row] = await db
    .select({ id: beritaKategori.id })
    .from(beritaKategori)
    .where(and(eq(beritaKategori.villageId, villageId), eq(beritaKategori.slug, slug)))
    .limit(1);
  return row;
}

export async function buatKategoriBerita(villageId: number, nama: string, slug: string) {
  await db.insert(beritaKategori).values({ villageId, nama, slug, aktif: true, urut: 0 });
}

export async function ubahKategoriBerita(
  villageId: number,
  id: number,
  nama: string,
  slug: string,
) {
  await db
    .update(beritaKategori)
    .set({ nama, slug })
    .where(and(eq(beritaKategori.villageId, villageId), eq(beritaKategori.id, id)));
}

/** Berita pada desa ini yang masih memakai kategori tersebut. */
export async function cariBeritaDenganKategori(villageId: number, kategoriId: number) {
  const [row] = await db
    .select({ id: berita.id })
    .from(berita)
    .where(and(eq(berita.villageId, villageId), eq(berita.kategoriId, kategoriId)))
    .limit(1);
  return row;
}

export async function hapusKategoriBerita(villageId: number, id: number) {
  await db
    .delete(beritaKategori)
    .where(and(eq(beritaKategori.villageId, villageId), eq(beritaKategori.id, id)));
}

/* --------------------------------------------------------------- agenda */
