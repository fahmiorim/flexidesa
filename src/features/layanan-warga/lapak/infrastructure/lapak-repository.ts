import "server-only";

import { and, count, desc, eq, like, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { lapak, type NewLapak } from "@/db/schema/lapak";
import { lapakProduk, type NewLapakProduk } from "@/db/schema/lapak-produk";
import { residents } from "@/db/schema/resident";
import type { LapakProdukRow } from "@/features/layanan-warga/lapak/domain/lapak-produk";

export const LAPAK_PAGE_SIZE = 20;

export interface LapakPage {
  rows: Array<{
    id: number;
    villageId: number;
    residentId: number | null;
    nama: string;
    pemilik: string | null;
    kategori: string | null;
    alamat: string | null;
    keterangan: string | null;
    produkCount: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function listLapak(
  villageId: number,
  opts?: { kategori?: string; q?: string; page?: number; pageSize?: number },
): Promise<LapakPage> {
  const where = [eq(lapak.villageId, villageId)];
  if (opts?.kategori) where.push(eq(lapak.kategori, opts.kategori));
  if (opts?.q) {
    where.push(
      or(
        like(lapak.nama, `%${opts.q}%`),
        like(lapak.pemilik ?? "", `%${opts.q}%`),
        like(lapak.alamat ?? "", `%${opts.q}%`),
        like(lapak.keterangan ?? "", `%${opts.q}%`),
      )!,
    );
  }
  const pageSize = Math.min(Math.max(opts?.pageSize ?? LAPAK_PAGE_SIZE, 1), 100);
  const [totalRows] = await db
    .select({ value: count() })
    .from(lapak)
    .where(and(...where));
  const total = totalRows?.value ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(opts?.page ?? 1, 1), pageCount);
  const rows = await db
    .select({
      id: lapak.id,
      villageId: lapak.villageId,
      residentId: lapak.residentId,
      nama: lapak.nama,
      pemilik: lapak.pemilik,
      kategori: lapak.kategori,
      alamat: lapak.alamat,
      keterangan: lapak.keterangan,
      produkCount: sql<number>`(
        SELECT COUNT(*) FROM ${lapakProduk}
        WHERE ${lapakProduk}.lapak_id = ${lapak}.id
          AND ${lapakProduk}.village_id = ${lapak}.village_id
          AND ${lapakProduk}.aktif = 1 )`.as("produkCount"),
    })
    .from(lapak)
    .where(and(...where))
    .orderBy(desc(lapak.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { rows, total, page, pageSize, pageCount };
}

/** Satu lapak milik desa; `null` bila tidak ada atau milik desa lain. */
export async function findLapakById(
  villageId: number,
  id: number,
): Promise<LapakPage["rows"][number] | null> {
  const [row] = await db
    .select({
      id: lapak.id,
      villageId: lapak.villageId,
      residentId: lapak.residentId,
      nama: lapak.nama,
      pemilik: lapak.pemilik,
      kategori: lapak.kategori,
      alamat: lapak.alamat,
      keterangan: lapak.keterangan,
      produkCount: sql<number>`(
        SELECT COUNT(*) FROM ${lapakProduk}
        WHERE ${lapakProduk}.lapak_id = ${lapak}.id
          AND ${lapakProduk}.village_id = ${lapak}.village_id
          AND ${lapakProduk}.aktif = 1 )`.as("produkCount"),
    })
    .from(lapak)
    .where(and(eq(lapak.villageId, villageId), eq(lapak.id, id)))
    .limit(1);
  return row ?? null;
}

/** Simpan lapak baru; id hasil insert dikembalikan untuk pengalihan halaman. */
export async function insertLapak(
  villageId: number,
  data: Omit<NewLapak, "villageId">,
): Promise<number> {
  const [inserted] = await db
    .insert(lapak)
    .values({ ...data, villageId })
    .$returningId();
  if (!inserted) throw new Error("Gagal menyimpan lapak.");
  return inserted.id;
}

export async function updateLapak(
  id: number,
  villageId: number,
  data: Partial<NewLapak>,
): Promise<void> {
  await db
    .update(lapak)
    .set(data)
    .where(and(eq(lapak.id, id), eq(lapak.villageId, villageId)));
}

export async function deleteLapak(id: number, villageId: number): Promise<void> {
  await db.delete(lapak).where(and(eq(lapak.id, id), eq(lapak.villageId, villageId)));
}

/** Nama penduduk untuk kolom pemilik lapak. */
export async function namaPenduduk(villageId: number, residentId: number): Promise<string | null> {
  const [row] = await db
    .select({ nama: residents.name })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), eq(residents.id, residentId)))
    .limit(1);
  return row?.nama ?? null;
}

export async function listKategoriLapak(villageId: number): Promise<string[]> {
  const rows = await db
    .selectDistinct({ kategori: lapak.kategori })
    .from(lapak)
    .where(and(eq(lapak.villageId, villageId)));
  return rows.map((r) => r.kategori).filter((k): k is string => k !== null && k !== "");
}

/** Produk sebuah lapak, urut dari yang terbaru. */
export async function listProdukLapak(
  villageId: number,
  lapakId: number,
): Promise<LapakProdukRow[]> {
  const rows = await db
    .select({
      id: lapakProduk.id,
      lapakId: lapakProduk.lapakId,
      nama: lapakProduk.nama,
      deskripsi: lapakProduk.deskripsi,
      harga: lapakProduk.harga,
      stok: lapakProduk.stok,
      gambar: lapakProduk.gambar,
      aktif: lapakProduk.aktif,
      latitude: lapakProduk.latitude,
      longitude: lapakProduk.longitude,
    })
    .from(lapakProduk)
    .where(and(eq(lapakProduk.villageId, villageId), eq(lapakProduk.lapakId, lapakId)))
    .orderBy(desc(lapakProduk.id));
  return rows;
}

/** Simpan produk baru pada lapak desa sendiri. */
export async function insertProdukLapak(
  villageId: number,
  lapakId: number,
  data: Omit<NewLapakProduk, "villageId" | "lapakId">,
): Promise<number> {
  const [inserted] = await db
    .insert(lapakProduk)
    .values({ ...data, villageId, lapakId })
    .$returningId();
  if (!inserted) throw new Error("Gagal menyimpan produk lapak.");
  return inserted.id;
}

/** Perbarui produk milik lapak desa sendiri; `false` bila tidak ada. */
export async function updateProdukLapak(
  villageId: number,
  lapakId: number,
  id: number,
  data: Partial<NewLapakProduk>,
): Promise<boolean> {
  const res = await db
    .update(lapakProduk)
    .set(data)
    .where(
      and(
        eq(lapakProduk.villageId, villageId),
        eq(lapakProduk.lapakId, lapakId),
        eq(lapakProduk.id, id),
      ),
    );
  return Number((res as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

/** Hapus produk milik lapak desa sendiri; `false` bila tidak ada. */
export async function deleteProdukLapak(
  villageId: number,
  lapakId: number,
  id: number,
): Promise<boolean> {
  const res = await db
    .delete(lapakProduk)
    .where(
      and(
        eq(lapakProduk.villageId, villageId),
        eq(lapakProduk.lapakId, lapakId),
        eq(lapakProduk.id, id),
      ),
    );
  return Number((res as { affectedRows?: number }).affectedRows ?? 0) > 0;
}
