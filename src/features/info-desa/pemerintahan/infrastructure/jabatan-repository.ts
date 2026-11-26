import "server-only";

/**
 * Query jabatan dan riwayat jabatan perangkat.
 *
 * Semua fungsi dibatasi `villageId` pemilik sehingga tidak ada data yang
 * bocor antar-desa.
 */

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { jabatanPerangkat, perangkatDesa, perangkatRiwayatJabatan } from "@/db/schema";

export type JabatanValues = {
  nama: string;
  slug: string;
  jenis: string;
  tupoksi: string | null;
  urut: number;
};

export type RiwayatValues = Omit<
  typeof perangkatRiwayatJabatan.$inferInsert,
  "id" | "villageId" | "createdAt"
>;

export async function listRiwayatJabatan(villageId: number) {
  return db
    .select()
    .from(perangkatRiwayatJabatan)
    .where(eq(perangkatRiwayatJabatan.villageId, villageId))
    .orderBy(asc(perangkatRiwayatJabatan.mulai));
}

export async function getJabatan(villageId: number, id: number) {
  const [row] = await db
    .select({ id: jabatanPerangkat.id })
    .from(jabatanPerangkat)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getJabatanBySlug(villageId: number, slug: string) {
  const [row] = await db
    .select({ id: jabatanPerangkat.id })
    .from(jabatanPerangkat)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.slug, slug)))
    .limit(1);
  return row ?? null;
}

export async function insertJabatan(villageId: number, values: JabatanValues) {
  const [row] = await db
    .insert(jabatanPerangkat)
    .values({ ...values, villageId })
    .$returningId();
  return row?.id ?? 0;
}

export async function updateJabatan(villageId: number, id: number, values: JabatanValues) {
  await db
    .update(jabatanPerangkat)
    .set(values)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.id, id)));
}

export async function getJabatanDetail(villageId: number, id: number) {
  const [row] = await db
    .select({ id: jabatanPerangkat.id, jenis: jabatanPerangkat.jenis })
    .from(jabatanPerangkat)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.id, id)))
    .limit(1);
  return row ?? null;
}

export async function deleteJabatan(villageId: number, id: number) {
  await db
    .delete(jabatanPerangkat)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.id, id)));
}

export async function countPerangkatByJabatan(villageId: number, jabatanId: number) {
  const [row] = await db
    .select({ id: perangkatDesa.id })
    .from(perangkatDesa)
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.jabatanId, jabatanId)))
    .limit(1);
  return row ?? null;
}

export async function getRiwayat(villageId: number, id: number) {
  const [row] = await db
    .select({ id: perangkatRiwayatJabatan.id })
    .from(perangkatRiwayatJabatan)
    .where(
      and(eq(perangkatRiwayatJabatan.villageId, villageId), eq(perangkatRiwayatJabatan.id, id)),
    )
    .limit(1);
  return row ?? null;
}

export async function insertRiwayat(villageId: number, values: RiwayatValues) {
  await db.insert(perangkatRiwayatJabatan).values({ ...values, villageId });
}

export async function updateRiwayat(villageId: number, id: number, values: RiwayatValues) {
  await db
    .update(perangkatRiwayatJabatan)
    .set(values)
    .where(
      and(eq(perangkatRiwayatJabatan.villageId, villageId), eq(perangkatRiwayatJabatan.id, id)),
    );
}

export async function deleteRiwayat(villageId: number, id: number) {
  await db
    .delete(perangkatRiwayatJabatan)
    .where(
      and(eq(perangkatRiwayatJabatan.villageId, villageId), eq(perangkatRiwayatJabatan.id, id)),
    );
}

export async function listRiwayatPublikByPerangkat(villageId: number, perangkatId: number) {
  return db
    .select({
      id: perangkatRiwayatJabatan.id,
      jabatan: perangkatRiwayatJabatan.jabatan,
      nomorSk: perangkatRiwayatJabatan.nomorSk,
      mulai: perangkatRiwayatJabatan.mulai,
      selesai: perangkatRiwayatJabatan.selesai,
      keterangan: perangkatRiwayatJabatan.keterangan,
    })
    .from(perangkatRiwayatJabatan)
    .where(
      and(
        eq(perangkatRiwayatJabatan.villageId, villageId),
        eq(perangkatRiwayatJabatan.perangkatId, perangkatId),
        eq(perangkatRiwayatJabatan.tampilPublik, true),
      ),
    );
}
