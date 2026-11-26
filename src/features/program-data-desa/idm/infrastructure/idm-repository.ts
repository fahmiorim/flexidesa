import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { idmIndikator, idmRingkasan, idmSdgs } from "@/db/schema";
import { bandingKodeIdm } from "@/features/program-data-desa/idm/domain/idm";

/**
 * Indikator satu tahun, terurut alami per dimensi dan nomor.
 *
 * Pengurutan dilakukan di sini (bukan `ORDER BY kode`) karena kolom kode
 * berupa teks: pengurutan SQL menempatkan `I.10` sebelum `I.2`.
 */
export async function listIdm(villageId: number, tahun?: number) {
  const where = tahun
    ? and(eq(idmIndikator.villageId, villageId), eq(idmIndikator.tahun, tahun))
    : eq(idmIndikator.villageId, villageId);
  const rows = await db.select().from(idmIndikator).where(where);
  return [...rows].sort((a, b) => bandingKodeIdm(a.kode, b.kode));
}

export async function createIdm(data: typeof idmIndikator.$inferInsert) {
  const result = await db.insert(idmIndikator).values(data).$returningId();
  return result[0]?.id ?? 0;
}

export async function updateIdm(
  id: number,
  villageId: number,
  data: Partial<typeof idmIndikator.$inferInsert>,
) {
  await db
    .update(idmIndikator)
    .set(data)
    .where(and(eq(idmIndikator.id, id), eq(idmIndikator.villageId, villageId)));
}

export async function deleteIdm(id: number, villageId: number) {
  await db
    .delete(idmIndikator)
    .where(and(eq(idmIndikator.id, id), eq(idmIndikator.villageId, villageId)));
}

/** Ganti seluruh indikator satu tahun dengan hasil sinkronisasi API. */
export async function gantiIdmTahun(
  villageId: number,
  tahun: number,
  rows: Array<{
    kode: string;
    nama: string;
    skor: number;
    kategori: string | null;
    keterangan: string | null;
  }>,
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(idmIndikator)
      .where(and(eq(idmIndikator.villageId, villageId), eq(idmIndikator.tahun, tahun)));
    if (rows.length) {
      await tx.insert(idmIndikator).values(rows.map((row) => ({ ...row, villageId, tahun })));
    }
  });
}

export async function getRingkasanIdm(villageId: number, tahun: number) {
  const [row] = await db
    .select()
    .from(idmRingkasan)
    .where(and(eq(idmRingkasan.villageId, villageId), eq(idmRingkasan.tahun, tahun)))
    .limit(1);
  return row ?? null;
}

/** Simpan ringkasan API untuk satu tahun; tahun yang sama diperbarui. */
export async function simpanRingkasanIdm(
  villageId: number,
  data: {
    tahun: number;
    skorMinimal: string | null;
    targetStatus: string | null;
    statusApi: string | null;
    skorApi: string | null;
    penambahan: string | null;
  },
) {
  await db
    .insert(idmRingkasan)
    .values({ villageId, ...data })
    .onDuplicateKeyUpdate({
      set: {
        skorMinimal: sql`values(skor_minimal)`,
        targetStatus: sql`values(target_status)`,
        statusApi: sql`values(status_api)`,
        skorApi: sql`values(skor_api)`,
        penambahan: sql`values(penambahan)`,
        disinkronkanPada: sql`now()`,
      },
    });
}

/** Tahun-tahun yang sudah punya indikator, terbaru lebih dulu. */
export async function listTahunIdm(villageId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ tahun: idmIndikator.tahun })
    .from(idmIndikator)
    .where(eq(idmIndikator.villageId, villageId))
    .orderBy(sql`${idmIndikator.tahun} DESC`);
  return rows.map((row) => row.tahun);
}

export async function listSdgs(villageId: number, tahun: number) {
  return db
    .select()
    .from(idmSdgs)
    .where(and(eq(idmSdgs.villageId, villageId), eq(idmSdgs.tahun, tahun)))
    .orderBy(idmSdgs.goal);
}

/** Simpan capaian satu tujuan; baris yang sudah ada diperbarui (upsert). */
export async function upsertSdgs(data: typeof idmSdgs.$inferInsert) {
  await db
    .insert(idmSdgs)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        skor: sql`values(skor)`,
        keterangan: sql`values(keterangan)`,
      },
    });
} /**
 * Simpan capaian SDGs hasil sinkronisasi API.
 *
 * Memakai upsert dan hanya memperbarui skor, sehingga catatan manual yang
 * sudah ada tidak terhapus bila API mengirim data sebagian.
 */
export async function simpanSdgsTahun(
  villageId: number,
  tahun: number,
  rows: Array<{ goal: number; skor: number }>,
) {
  if (!rows.length) return;
  await db
    .insert(idmSdgs)
    .values(rows.map((row) => ({ ...row, villageId, tahun, keterangan: null })))
    .onDuplicateKeyUpdate({ set: { skor: sql`values(skor)` } });
}

export async function deleteSdgs(villageId: number, tahun: number, goal: number) {
  await db
    .delete(idmSdgs)
    .where(and(eq(idmSdgs.villageId, villageId), eq(idmSdgs.tahun, tahun), eq(idmSdgs.goal, goal)));
}

export async function listTahunSdgs(villageId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ tahun: idmSdgs.tahun })
    .from(idmSdgs)
    .where(eq(idmSdgs.villageId, villageId))
    .orderBy(sql`${idmSdgs.tahun} DESC`);
  return rows.map((row) => row.tahun);
}
