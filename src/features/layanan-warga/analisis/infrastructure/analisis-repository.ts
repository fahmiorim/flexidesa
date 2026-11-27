import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { analisisIndikator, analisisKategori, surveySoal } from "@/db/schema";

export async function listAnalisisKategori(villageId: number) {
  return db
    .select()
    .from(analisisKategori)
    .where(eq(analisisKategori.villageId, villageId))
    .orderBy(analisisKategori.nama);
}

/**
 * Composite RESTRICT mencegah referensi lintas desa; lepaskan indikator
 * sewilayah secara atomik sebelum kategori dihapus.
 */
export async function deleteAnalisisKategori(id: number, villageId: number) {
  await db.transaction(async (tx) => {
    await tx
      .update(analisisIndikator)
      .set({ kategoriId: null })
      .where(and(eq(analisisIndikator.villageId, villageId), eq(analisisIndikator.kategoriId, id)));
    await tx
      .delete(analisisKategori)
      .where(and(eq(analisisKategori.id, id), eq(analisisKategori.villageId, villageId)));
  });
}

export async function listAnalisisIndikator(villageId: number, kategoriId?: number) {
  const where = kategoriId
    ? and(eq(analisisIndikator.villageId, villageId), eq(analisisIndikator.kategoriId, kategoriId))
    : eq(analisisIndikator.villageId, villageId);
  return db.select().from(analisisIndikator).where(where).orderBy(analisisIndikator.kode);
}

/**
 * Composite RESTRICT pada `survey_soal.indikator_id` mencegah referensi
 * lintas desa; lepaskan soal sewilayah secara atomik sebelum indikator dihapus.
 */
export async function deleteAnalisisIndikator(id: number, villageId: number) {
  await db.transaction(async (tx) => {
    await tx
      .update(surveySoal)
      .set({ indikatorId: null })
      .where(and(eq(surveySoal.villageId, villageId), eq(surveySoal.indikatorId, id)));
    await tx
      .delete(analisisIndikator)
      .where(and(eq(analisisIndikator.id, id), eq(analisisIndikator.villageId, villageId)));
  });
}
