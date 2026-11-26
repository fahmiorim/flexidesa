import "server-only";

/**
 * Query dokumen publik, halaman statis, dan slug konten.
 *
 * Seluruh fungsi wajib menerima `villageId` dari host sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, asc, count, desc, eq, isNotNull, like, ne, or } from "drizzle-orm";

import { db } from "@/db";
import { berita, dokumenPublik, halamanStatis } from "@/db/schema";
import {
  susunPaginasiDokumen,
  type DokumenKategoriFilter,
} from "@/features/info-desa/publik/domain/dokumen";
import { polaLike } from "@/features/info-desa/publik/domain/pencarian";

import { beritaLayakTayang } from "./berita-repository";

export interface DokumenRingkas {
  id: number;
  nama: string;
  slug: string;
  kategori: string;
  jenis: string | null;
  nomor: string | null;
  tahun: number | null;
  berkas: string | null;
  tautan: string | null;
  keterangan: string | null;
  aktif: boolean;
}

export interface DokumenPublikInput {
  nama: string;
  slug: string;
  kategori: string;
  jenis: string | null;
  nomor: string | null;
  tahun: number | null;
  berkas: string | null;
  tautan: string | null;
  keterangan: string | null;
  aktif: boolean;
}

export async function listDokumenPublik(
  villageId: number,
  kategori?: string,
  includeInactive = false,
): Promise<DokumenRingkas[]> {
  const kondisi = [eq(dokumenPublik.villageId, villageId)];
  if (!includeInactive) kondisi.push(eq(dokumenPublik.aktif, true));
  if (kategori) kondisi.push(eq(dokumenPublik.kategori, kategori));

  return db
    .select({
      id: dokumenPublik.id,
      nama: dokumenPublik.nama,
      slug: dokumenPublik.slug,
      kategori: dokumenPublik.kategori,
      jenis: dokumenPublik.jenis,
      nomor: dokumenPublik.nomor,
      tahun: dokumenPublik.tahun,
      berkas: dokumenPublik.berkas,
      tautan: dokumenPublik.tautan,
      keterangan: dokumenPublik.keterangan,
      aktif: dokumenPublik.aktif,
    })
    .from(dokumenPublik)
    .where(and(...kondisi))
    .orderBy(desc(dokumenPublik.tahun), asc(dokumenPublik.nama));
}

export interface CariDokumenPublikFilter {
  search: string;
  category: DokumenKategoriFilter;
  year?: number;
  /** Jenis produk hukum; kosong berarti semua jenis. */
  jenis?: string;
  page: number;
  /** Batas opsional; default 20, maksimum 100. */
  pageSize?: number;
}

export interface DokumenPublikPage {
  rows: DokumenRingkas[];
  total: number;
  page: number;
  pageSize: number;
}

/** Cari dan paginasi dokumen aktif; seluruh hasil dibatasi pada tenant host. */
export async function cariDokumenPublik(
  villageId: number,
  filter: CariDokumenPublikFilter,
): Promise<DokumenPublikPage> {
  const conditions = [eq(dokumenPublik.villageId, villageId), eq(dokumenPublik.aktif, true)];
  if (filter.category !== "semua") {
    conditions.push(eq(dokumenPublik.kategori, filter.category));
  }
  if (filter.year !== undefined) {
    conditions.push(eq(dokumenPublik.tahun, filter.year));
  }
  if (filter.jenis) {
    conditions.push(eq(dokumenPublik.jenis, filter.jenis));
  }
  const query = filter.search.trim().slice(0, 100);
  if (query) {
    const search = polaLike(query);
    const textFilter = or(
      like(dokumenPublik.nama, search),
      like(dokumenPublik.jenis, search),
      like(dokumenPublik.nomor, search),
      like(dokumenPublik.keterangan, search),
    );
    if (textFilter) conditions.push(textFilter);
  }

  const where = and(...conditions) ?? eq(dokumenPublik.villageId, -1);
  const [totalRow] = await db.select({ value: count() }).from(dokumenPublik).where(where);
  const total = totalRow?.value ?? 0;
  const { page, pageSize, offset } = susunPaginasiDokumen(total, filter.page, filter.pageSize);
  const rows = await db
    .select({
      id: dokumenPublik.id,
      nama: dokumenPublik.nama,
      slug: dokumenPublik.slug,
      kategori: dokumenPublik.kategori,
      jenis: dokumenPublik.jenis,
      nomor: dokumenPublik.nomor,
      tahun: dokumenPublik.tahun,
      berkas: dokumenPublik.berkas,
      tautan: dokumenPublik.tautan,
      keterangan: dokumenPublik.keterangan,
      aktif: dokumenPublik.aktif,
    })
    .from(dokumenPublik)
    .where(where)
    .orderBy(desc(dokumenPublik.tahun), asc(dokumenPublik.nama), asc(dokumenPublik.id))
    .limit(pageSize)
    .offset(offset);

  return {
    rows,
    total,
    page,
    pageSize,
  };
}

/**
 * Baris ringkas (tahun + jenis) seluruh dokumen aktif untuk navigasi arsip
 * publik. Pengelompokan dilakukan di domain agar dapat diuji.
 */
export async function listArsipDokumen(
  villageId: number,
  category: DokumenKategoriFilter,
): Promise<{ tahun: number | null; jenis: string | null }[]> {
  const conditions = [eq(dokumenPublik.villageId, villageId), eq(dokumenPublik.aktif, true)];
  if (category !== "semua") {
    conditions.push(eq(dokumenPublik.kategori, category));
  }

  return db
    .select({ tahun: dokumenPublik.tahun, jenis: dokumenPublik.jenis })
    .from(dokumenPublik)
    .where(and(...conditions));
}

/** Cek slug dokumen unik per desa (kecuali baris yang sedang diubah). */
export async function dokumenSlugExists(
  villageId: number,
  slug: string,
  exceptId?: number,
): Promise<boolean> {
  const kondisi = [
    eq(dokumenPublik.villageId, villageId),
    eq(dokumenPublik.slug, slug),
    exceptId === undefined ? undefined : ne(dokumenPublik.id, exceptId),
  ];

  const [row] = await db
    .select({ id: dokumenPublik.id })
    .from(dokumenPublik)
    .where(and(...kondisi))
    .limit(1);

  return Boolean(row);
}

/* ------------------------------------------------------------------ menu */

/** Menambahkan baris dokumen publik. */
export async function createDokumenPublik(
  villageId: number,
  data: DokumenPublikInput,
): Promise<void> {
  await db.insert(dokumenPublik).values({ villageId, ...data });
}

/** Mengubah satu baris dokumen publik; selalu dibatasi desa pemilik. */
export async function updateDokumenPublik(
  villageId: number,
  id: number,
  data: Partial<DokumenPublikInput>,
): Promise<void> {
  await db
    .update(dokumenPublik)
    .set(data)
    .where(and(eq(dokumenPublik.villageId, villageId), eq(dokumenPublik.id, id)));
}

/** Menghapus satu baris dokumen publik; selalu dibatasi desa pemilik. */
export async function deleteDokumenPublik(villageId: number, id: number): Promise<void> {
  await db
    .delete(dokumenPublik)
    .where(and(eq(dokumenPublik.villageId, villageId), eq(dokumenPublik.id, id)));
}

/* -------------------------------------------------------- halaman statis */

export interface HalamanRingkas {
  judul: string;
  slug: string;
  isi: string;
}

export async function getHalamanBySlug(
  villageId: number,
  slug: string,
): Promise<HalamanRingkas | null> {
  const [row] = await db
    .select({ judul: halamanStatis.judul, slug: halamanStatis.slug, isi: halamanStatis.isi })
    .from(halamanStatis)
    .where(
      and(
        eq(halamanStatis.villageId, villageId),
        eq(halamanStatis.slug, slug),
        eq(halamanStatis.aktif, true),
      ),
    )
    .limit(1);

  return row ?? null;
}

/** Daftar slug halaman statis aktif untuk `sitemap.ts`. */
export async function listSlugHalaman(villageId: number): Promise<string[]> {
  const rows = await db
    .select({ slug: halamanStatis.slug })
    .from(halamanStatis)
    .where(and(eq(halamanStatis.villageId, villageId), eq(halamanStatis.aktif, true)));
  return rows.map((row) => row.slug);
}

/** Daftar slug berita tayang untuk `sitemap.ts`. */
export async function listSlugBerita(villageId: number): Promise<string[]> {
  const rows = await db
    .select({ slug: berita.slug })
    .from(berita)
    .where(and(beritaLayakTayang(villageId), isNotNull(berita.slug)));
  return rows.map((row) => row.slug);
}
