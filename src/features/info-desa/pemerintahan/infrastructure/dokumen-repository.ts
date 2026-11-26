import "server-only";

/**
 * Query dokumen pemerintahan.
 *
 * Semua fungsi dibatasi `villageId` pemilik sehingga tidak ada data yang
 * bocor antar-desa.
 */

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { pemerintahanDokumen } from "@/db/schema";

export type DokumenValues = Omit<
  typeof pemerintahanDokumen.$inferInsert,
  "id" | "villageId" | "createdAt"
>;

export async function listDokumenPemerintahan(villageId: number) {
  return db
    .select()
    .from(pemerintahanDokumen)
    .where(eq(pemerintahanDokumen.villageId, villageId))
    .orderBy(asc(pemerintahanDokumen.tanggal));
}

export async function listBerkasDokumen(
  villageId: number,
  owner: { perangkatId: number } | { lembagaId: number },
) {
  const condition =
    "perangkatId" in owner
      ? eq(pemerintahanDokumen.perangkatId, owner.perangkatId)
      : eq(pemerintahanDokumen.lembagaId, owner.lembagaId);
  return db
    .select({ berkas: pemerintahanDokumen.berkas })
    .from(pemerintahanDokumen)
    .where(and(eq(pemerintahanDokumen.villageId, villageId), condition));
}

/** Semua berkas dokumen milik aparat yang akan dihapus, untuk pembersihan media. */
export async function listBerkasDokumenPerangkatBanyak(villageId: number, perangkatIds: number[]) {
  if (!perangkatIds.length) return [];
  return db
    .select({ berkas: pemerintahanDokumen.berkas })
    .from(pemerintahanDokumen)
    .where(
      and(
        eq(pemerintahanDokumen.villageId, villageId),
        inArray(pemerintahanDokumen.perangkatId, perangkatIds),
      ),
    );
}

export async function getDokumen(villageId: number, id: number) {
  const [row] = await db
    .select()
    .from(pemerintahanDokumen)
    .where(and(eq(pemerintahanDokumen.villageId, villageId), eq(pemerintahanDokumen.id, id)))
    .limit(1);
  return row ?? null;
}

export async function insertDokumen(villageId: number, values: DokumenValues) {
  await db.insert(pemerintahanDokumen).values({ ...values, villageId });
}

export async function updateDokumen(villageId: number, id: number, values: DokumenValues) {
  await db
    .update(pemerintahanDokumen)
    .set(values)
    .where(and(eq(pemerintahanDokumen.villageId, villageId), eq(pemerintahanDokumen.id, id)));
}

export async function deleteDokumen(villageId: number, id: number) {
  await db
    .delete(pemerintahanDokumen)
    .where(and(eq(pemerintahanDokumen.villageId, villageId), eq(pemerintahanDokumen.id, id)));
}

export async function listDokumenPublikByLembaga(villageId: number) {
  return db
    .select({
      id: pemerintahanDokumen.id,
      lembagaId: pemerintahanDokumen.lembagaId,
      judul: pemerintahanDokumen.judul,
      nomor: pemerintahanDokumen.nomor,
      tanggal: pemerintahanDokumen.tanggal,
    })
    .from(pemerintahanDokumen)
    .where(
      and(eq(pemerintahanDokumen.villageId, villageId), eq(pemerintahanDokumen.tampilPublik, true)),
    );
}

export async function listDokumenPublikByPerangkat(villageId: number, perangkatId: number) {
  return db
    .select({
      id: pemerintahanDokumen.id,
      judul: pemerintahanDokumen.judul,
      nomor: pemerintahanDokumen.nomor,
      tanggal: pemerintahanDokumen.tanggal,
    })
    .from(pemerintahanDokumen)
    .where(
      and(
        eq(pemerintahanDokumen.villageId, villageId),
        eq(pemerintahanDokumen.perangkatId, perangkatId),
        eq(pemerintahanDokumen.tampilPublik, true),
      ),
    );
}
