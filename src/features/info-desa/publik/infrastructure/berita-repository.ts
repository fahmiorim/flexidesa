import "server-only";

/**
 * Query berita dan kategori berita.
 *
 * Seluruh fungsi wajib menerima `villageId` dari host sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, asc, count, desc, eq, like, lte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { berita, beritaKategori } from "@/db/schema";
import { polaLike } from "@/features/info-desa/publik/domain/pencarian";

/** Predikat "berita sudah layak tayang": published dan jadwal terbit sudah lewat. */
export function beritaLayakTayang(villageId: number) {
  return and(
    eq(berita.villageId, villageId),
    eq(berita.status, "published"),
    or(sql`${berita.terbitPada} is null`, lte(berita.terbitPada, new Date())),
  );
}

interface BeritaRingkas {
  id: number;
  judul: string;
  slug: string;
  ringkasan: string | null;
  gambar: string | null;
  terbitPada: Date | null;
  createdAt: Date;
  kategori: string | null;
  kategoriSlug: string | null;
  headline: boolean;
  hit: number;
}

export async function listBerita(
  villageId: number,
  opsi: { limit?: number; kategoriSlug?: string; headlineSaja?: boolean; cari?: string } = {},
): Promise<BeritaRingkas[]> {
  const kondisi = [beritaLayakTayang(villageId)];

  if (opsi.kategoriSlug) {
    kondisi.push(eq(beritaKategori.slug, opsi.kategoriSlug));
  }
  if (opsi.headlineSaja) {
    kondisi.push(eq(berita.headline, true));
  }
  if (opsi.cari) {
    const pola = polaLike(opsi.cari);
    kondisi.push(
      or(like(berita.judul, pola), like(berita.ringkasan, pola), like(berita.isi, pola)),
    );
  }

  const rows = await db
    .select({
      id: berita.id,
      judul: berita.judul,
      slug: berita.slug,
      ringkasan: berita.ringkasan,
      gambar: berita.gambar,
      terbitPada: berita.terbitPada,
      createdAt: berita.createdAt,
      kategori: beritaKategori.nama,
      kategoriSlug: beritaKategori.slug,
      headline: berita.headline,
      hit: berita.hit,
    })
    .from(berita)
    .leftJoin(
      beritaKategori,
      and(eq(berita.kategoriId, beritaKategori.id), eq(beritaKategori.villageId, villageId)),
    )
    .where(and(...kondisi))
    .orderBy(desc(berita.terbitPada), desc(berita.createdAt))
    .limit(opsi.limit ?? 20);

  return rows;
}

/** Banyaknya berita tayang; untuk paginasi/arsip. */
export async function countBerita(villageId: number, kategoriSlug?: string): Promise<number> {
  const kondisi = [beritaLayakTayang(villageId)];
  if (kategoriSlug) kondisi.push(eq(beritaKategori.slug, kategoriSlug));

  const [row] = await db
    .select({ value: count() })
    .from(berita)
    .leftJoin(
      beritaKategori,
      and(eq(berita.kategoriId, beritaKategori.id), eq(beritaKategori.villageId, villageId)),
    )
    .where(and(...kondisi));

  return row?.value ?? 0;
}

interface BeritaDetail extends BeritaRingkas {
  isi: string;
  dokumen: string | null;
  hit: number;
  bolehKomentar: boolean;
}

export async function getBeritaBySlug(
  villageId: number,
  slug: string,
): Promise<BeritaDetail | null> {
  const [row] = await db
    .select({
      id: berita.id,
      judul: berita.judul,
      slug: berita.slug,
      ringkasan: berita.ringkasan,
      gambar: berita.gambar,
      dokumen: berita.dokumen,
      isi: berita.isi,
      hit: berita.hit,
      terbitPada: berita.terbitPada,
      createdAt: berita.createdAt,
      kategori: beritaKategori.nama,
      kategoriSlug: beritaKategori.slug,
      headline: berita.headline,
      bolehKomentar: berita.bolehKomentar,
    })
    .from(berita)
    .leftJoin(
      beritaKategori,
      and(eq(berita.kategoriId, beritaKategori.id), eq(beritaKategori.villageId, villageId)),
    )
    .where(and(beritaLayakTayang(villageId), eq(berita.slug, slug)))
    .limit(1);

  return row ?? null;
}

/** Naikkan penghitung kunjungan berita (best-effort, tidak menunggu hasil). */
export async function tambahHitBerita(id: number): Promise<void> {
  await db
    .update(berita)
    .set({ hit: sql`${berita.hit} + 1` })
    .where(eq(berita.id, id));
}

interface KategoriRingkas {
  id: number;
  nama: string;
  slug: string;
}

export async function listKategoriBerita(villageId: number): Promise<KategoriRingkas[]> {
  return db
    .select({ id: beritaKategori.id, nama: beritaKategori.nama, slug: beritaKategori.slug })
    .from(beritaKategori)
    .where(and(eq(beritaKategori.villageId, villageId), eq(beritaKategori.aktif, true)))
    .orderBy(asc(beritaKategori.urut));
}

/* ------------------------------------------------------------------ galeri */
