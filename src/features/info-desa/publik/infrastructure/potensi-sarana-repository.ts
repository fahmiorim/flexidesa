import "server-only";

/**
 * Query potensi desa dan sarana prasarana.
 *
 * Seluruh fungsi wajib menerima `villageId` dari host sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { potensiDesa, potensiIndikator, saranaPrasarana } from "@/db/schema";

export interface PotensiDesaRingkas {
  id: number;
  kategori: string;
  judul: string;
  slug: string;
  ringkasan: string | null;
  deskripsi: string | null;
  gambar: string | null;
  lokasi: string | null;
  kontak: string | null;
  unggulan: boolean;
  aktif: boolean;
  indikator: { id: number; label: string; nilai: string }[];
}

export async function listPotensiDesa(
  villageId: number,
  includeInactive = false,
): Promise<PotensiDesaRingkas[]> {
  const conditions = [eq(potensiDesa.villageId, villageId)];
  if (!includeInactive) conditions.push(eq(potensiDesa.aktif, true));
  const rows = await db
    .select({
      id: potensiDesa.id,
      kategori: potensiDesa.kategori,
      judul: potensiDesa.judul,
      slug: potensiDesa.slug,
      ringkasan: potensiDesa.ringkasan,
      deskripsi: potensiDesa.deskripsi,
      gambar: potensiDesa.gambar,
      lokasi: potensiDesa.lokasi,
      kontak: potensiDesa.kontak,
      unggulan: potensiDesa.unggulan,
      aktif: potensiDesa.aktif,
      urut: potensiDesa.urut,
    })
    .from(potensiDesa)
    .where(and(...conditions))
    .orderBy(asc(potensiDesa.urut), asc(potensiDesa.id));
  const ids = rows.map((row) => row.id);
  const indicators = ids.length
    ? await db
        .select({
          id: potensiIndikator.id,
          potensiId: potensiIndikator.potensiId,
          label: potensiIndikator.label,
          nilai: potensiIndikator.nilai,
        })
        .from(potensiIndikator)
        .where(
          and(eq(potensiIndikator.villageId, villageId), inArray(potensiIndikator.potensiId, ids)),
        )
        .orderBy(asc(potensiIndikator.urut), asc(potensiIndikator.id))
    : [];
  const byPotensi = new Map<number, { id: number; label: string; nilai: string }[]>();
  for (const item of indicators)
    byPotensi.set(item.potensiId, [
      ...(byPotensi.get(item.potensiId) ?? []),
      { id: item.id, label: item.label, nilai: item.nilai },
    ]);
  return rows.map(({ urut: _urut, ...row }) => ({
    ...row,
    indikator: byPotensi.get(row.id) ?? [],
  }));
}

/* ------------------------------------------------------- kelola galeri admin */

export interface PotensiAdminInput {
  id: number;
  kategori: string;
  judul: string;
  slug: string;
  ringkasan: string | null;
  deskripsi: string | null;
  gambar: string | null;
  lokasi: string | null;
  kontak: string | null;
  unggulan: boolean;
  aktif: boolean;
  indikator: { label: string; nilai: string; urut: number }[];
}

export async function simpanPotensiAdmin(
  villageId: number,
  data: PotensiAdminInput,
): Promise<void> {
  await db.transaction(async (tx) => {
    if (data.id > 0) {
      await tx
        .update(potensiDesa)
        .set({
          kategori: data.kategori,
          judul: data.judul,
          slug: data.slug,
          ringkasan: data.ringkasan,
          deskripsi: data.deskripsi,
          gambar: data.gambar,
          lokasi: data.lokasi,
          kontak: data.kontak,
          unggulan: data.unggulan,
          aktif: data.aktif,
        })
        .where(and(eq(potensiDesa.id, data.id), eq(potensiDesa.villageId, villageId)));
      await tx
        .delete(potensiIndikator)
        .where(
          and(eq(potensiIndikator.villageId, villageId), eq(potensiIndikator.potensiId, data.id)),
        );
      if (data.indikator.length) {
        await tx
          .insert(potensiIndikator)
          .values(data.indikator.map((item) => ({ ...item, villageId, potensiId: data.id })));
      }
      return;
    }

    const [created] = await tx
      .insert(potensiDesa)
      .values({
        villageId,
        kategori: data.kategori,
        judul: data.judul,
        slug: data.slug,
        ringkasan: data.ringkasan,
        deskripsi: data.deskripsi,
        gambar: data.gambar,
        lokasi: data.lokasi,
        kontak: data.kontak,
        unggulan: data.unggulan,
        aktif: data.aktif,
      })
      .$returningId();
    if (created?.id && data.indikator.length) {
      await tx
        .insert(potensiIndikator)
        .values(data.indikator.map((item) => ({ ...item, villageId, potensiId: created.id })));
    }
  });
}

export async function hapusPotensiAdmin(villageId: number, id: number): Promise<void> {
  await db
    .delete(potensiDesa)
    .where(and(eq(potensiDesa.id, id), eq(potensiDesa.villageId, villageId)));
}

/* ----------------------------------------------------------- sarana & prasarana */

export interface SaranaPrasaranaRingkas {
  id: number;
  nama: string;
  kategori: string;
  lokasi: string | null;
  keterangan: string | null;
  aktif: boolean;
}

export async function listSaranaPrasarana(
  villageId: number,
  includeInactive = false,
): Promise<SaranaPrasaranaRingkas[]> {
  const conditions = [eq(saranaPrasarana.villageId, villageId)];
  if (!includeInactive) conditions.push(eq(saranaPrasarana.aktif, true));
  const rows = await db
    .select({
      id: saranaPrasarana.id,
      nama: saranaPrasarana.nama,
      kategori: saranaPrasarana.kategori,
      lokasi: saranaPrasarana.lokasi,
      keterangan: saranaPrasarana.keterangan,
      aktif: saranaPrasarana.aktif,
      urut: saranaPrasarana.urut,
    })
    .from(saranaPrasarana)
    .where(and(...conditions))
    .orderBy(asc(saranaPrasarana.urut), asc(saranaPrasarana.id));
  return rows.map(({ urut: _urut, ...row }) => row);
}

export interface SaranaAdminInput {
  id: number;
  nama: string;
  kategori: string;
  lokasi: string | null;
  keterangan: string | null;
  aktif: boolean;
}

export async function simpanSaranaAdmin(villageId: number, data: SaranaAdminInput): Promise<void> {
  const nilai = {
    nama: data.nama,
    kategori: data.kategori,
    lokasi: data.lokasi,
    keterangan: data.keterangan,
    aktif: data.aktif,
  };
  if (data.id > 0) {
    await db
      .update(saranaPrasarana)
      .set(nilai)
      .where(and(eq(saranaPrasarana.id, data.id), eq(saranaPrasarana.villageId, villageId)));
    return;
  }
  await db.insert(saranaPrasarana).values({ villageId, ...nilai });
}

export async function hapusSaranaAdmin(villageId: number, id: number): Promise<void> {
  await db
    .delete(saranaPrasarana)
    .where(and(eq(saranaPrasarana.id, id), eq(saranaPrasarana.villageId, villageId)));
}
