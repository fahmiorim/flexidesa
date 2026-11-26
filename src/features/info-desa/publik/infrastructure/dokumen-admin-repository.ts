import "server-only";

/**
 * Query dokumen (admin).
 *
 * Seluruh fungsi wajib menerima `villageId` dari sesi sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { dokumenPublik } from "@/db/schema";

export async function listDokumenAdmin(villageId: number) {
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
    .where(eq(dokumenPublik.villageId, villageId))
    .orderBy(desc(dokumenPublik.updatedAt));
}

export async function cariDokumenById(villageId: number, id: number) {
  const [row] = await db
    .select({ berkas: dokumenPublik.berkas, tautan: dokumenPublik.tautan })
    .from(dokumenPublik)
    .where(and(eq(dokumenPublik.villageId, villageId), eq(dokumenPublik.id, id)))
    .limit(1);
  return row;
}

export async function cariDokumenBySlug(villageId: number, slug: string) {
  const [row] = await db
    .select({ id: dokumenPublik.id })
    .from(dokumenPublik)
    .where(and(eq(dokumenPublik.villageId, villageId), eq(dokumenPublik.slug, slug)))
    .limit(1);
  return row;
}

export async function ubahDokumen(
  villageId: number,
  id: number,
  data: {
    nama: string;
    slug: string;
    kategori: string;
    jenis: string | null;
    nomor: string | null;
    tahun: number | null;
    berkas: string | null;
    tautan: string | null;
    keterangan: string | null;
  },
) {
  await db
    .update(dokumenPublik)
    .set(data)
    .where(and(eq(dokumenPublik.villageId, villageId), eq(dokumenPublik.id, id)));
}
