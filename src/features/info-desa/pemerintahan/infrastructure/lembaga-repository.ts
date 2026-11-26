import "server-only";

/**
 * Query lembaga desa, kategori, dan anggota.
 *
 * Semua fungsi dibatasi `villageId` pemilik sehingga tidak ada data yang
 * bocor antar-desa.
 */

import { and, asc, count, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { lembagaAnggota, lembagaDesa, lembagaMaster, residents } from "@/db/schema";

export type LembagaValues = Omit<
  typeof lembagaDesa.$inferInsert,
  "id" | "villageId" | "createdAt" | "updatedAt"
>;

export type MasterLembagaValues = Omit<
  typeof lembagaMaster.$inferInsert,
  "id" | "villageId" | "createdAt" | "updatedAt"
>;

export type AnggotaValues = Omit<
  typeof lembagaAnggota.$inferInsert,
  "id" | "villageId" | "createdAt" | "updatedAt"
>;

/** Nama ketua lembaga dari data penduduk, untuk tampilan cetak/unduh. */
export async function listKetuaLembaga(villageId: number) {
  return db
    .select({ lembagaId: lembagaDesa.id, nama: residents.name })
    .from(lembagaDesa)
    .innerJoin(
      residents,
      and(eq(residents.villageId, villageId), eq(residents.id, lembagaDesa.ketuaResidentId)),
    )
    .where(eq(lembagaDesa.villageId, villageId));
}

export async function listMasterLembaga(villageId: number) {
  return db
    .select()
    .from(lembagaMaster)
    .where(eq(lembagaMaster.villageId, villageId))
    .orderBy(asc(lembagaMaster.urut), asc(lembagaMaster.nama));
}

export async function getMasterLembaga(villageId: number, id: number) {
  const [row] = await db
    .select()
    .from(lembagaMaster)
    .where(and(eq(lembagaMaster.villageId, villageId), eq(lembagaMaster.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getMasterLembagaByNama(
  villageId: number,
  nama: string,
  excludeId: number | null,
) {
  const [row] = await db
    .select({ id: lembagaMaster.id })
    .from(lembagaMaster)
    .where(
      and(
        eq(lembagaMaster.villageId, villageId),
        eq(lembagaMaster.nama, nama),
        excludeId ? ne(lembagaMaster.id, excludeId) : undefined,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function insertMasterLembaga(villageId: number, values: MasterLembagaValues) {
  await db.insert(lembagaMaster).values({ ...values, villageId });
}

export async function updateMasterLembaga(
  villageId: number,
  id: number,
  values: MasterLembagaValues,
) {
  await db
    .update(lembagaMaster)
    .set(values)
    .where(and(eq(lembagaMaster.villageId, villageId), eq(lembagaMaster.id, id)));
}

export async function deleteMasterLembaga(villageId: number, id: number) {
  await db
    .delete(lembagaMaster)
    .where(and(eq(lembagaMaster.villageId, villageId), eq(lembagaMaster.id, id)));
}

export async function countLembagaByMaster(villageId: number, masterId: number) {
  const [row] = await db
    .select({ jumlah: count() })
    .from(lembagaDesa)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.masterId, masterId)));
  return row?.jumlah ?? 0;
}

export async function listLembaga(villageId: number) {
  return db
    .select()
    .from(lembagaDesa)
    .where(eq(lembagaDesa.villageId, villageId))
    .orderBy(asc(lembagaDesa.urut), asc(lembagaDesa.id));
}

export async function listAnggota(villageId: number) {
  return db
    .select()
    .from(lembagaAnggota)
    .where(eq(lembagaAnggota.villageId, villageId))
    .orderBy(asc(lembagaAnggota.urut), asc(lembagaAnggota.id));
}

export async function getLembaga(villageId: number, id: number) {
  const [row] = await db
    .select({ id: lembagaDesa.id, logo: lembagaDesa.logo })
    .from(lembagaDesa)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getLembagaByKode(villageId: number, kode: string, excludeId: number | null) {
  const [row] = await db
    .select({ id: lembagaDesa.id })
    .from(lembagaDesa)
    .where(
      and(
        eq(lembagaDesa.villageId, villageId),
        eq(lembagaDesa.kode, kode),
        ...(excludeId ? [ne(lembagaDesa.id, excludeId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Cek apakah penduduk sudah terdaftar sebagai anggota lembaga yang sama. */
export async function getAnggotaLembagaByResident(
  villageId: number,
  lembagaId: number,
  residentId: number,
  excludeId: number | null,
) {
  const [row] = await db
    .select({ id: lembagaAnggota.id })
    .from(lembagaAnggota)
    .where(
      and(
        eq(lembagaAnggota.villageId, villageId),
        eq(lembagaAnggota.lembagaId, lembagaId),
        eq(lembagaAnggota.residentId, residentId),
        ...(excludeId ? [ne(lembagaAnggota.id, excludeId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getNomorAnggotaLembaga(
  villageId: number,
  lembagaId: number,
  nomorAnggota: string,
  excludeId: number | null,
) {
  const [row] = await db
    .select({ id: lembagaAnggota.id })
    .from(lembagaAnggota)
    .where(
      and(
        eq(lembagaAnggota.villageId, villageId),
        eq(lembagaAnggota.lembagaId, lembagaId),
        eq(lembagaAnggota.nomorAnggota, nomorAnggota),
        ...(excludeId ? [ne(lembagaAnggota.id, excludeId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listPendudukLembaga(villageId: number) {
  return db
    .select({ id: residents.id, nama: residents.name, nik: residents.nationalId })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), eq(residents.lifeStatus, "alive")))
    .orderBy(asc(residents.name))
    .limit(2000);
}

export async function insertLembaga(villageId: number, values: LembagaValues) {
  await db.insert(lembagaDesa).values({ ...values, villageId });
}

export async function updateLembaga(villageId: number, id: number, values: LembagaValues) {
  await db
    .update(lembagaDesa)
    .set(values)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.id, id)));
}

export async function deleteLembaga(villageId: number, id: number) {
  await db
    .delete(lembagaDesa)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.id, id)));
}

export async function getAnggota(villageId: number, id: number) {
  const [row] = await db
    .select({ id: lembagaAnggota.id, foto: lembagaAnggota.foto })
    .from(lembagaAnggota)
    .where(and(eq(lembagaAnggota.villageId, villageId), eq(lembagaAnggota.id, id)))
    .limit(1);
  return row ?? null;
}

export async function listFotoAnggota(villageId: number, lembagaId: number) {
  return db
    .select({ foto: lembagaAnggota.foto })
    .from(lembagaAnggota)
    .where(and(eq(lembagaAnggota.villageId, villageId), eq(lembagaAnggota.lembagaId, lembagaId)));
}

export async function insertAnggota(villageId: number, values: AnggotaValues) {
  await db.insert(lembagaAnggota).values({ ...values, villageId });
}

export async function updateAnggota(villageId: number, id: number, values: AnggotaValues) {
  await db
    .update(lembagaAnggota)
    .set(values)
    .where(and(eq(lembagaAnggota.villageId, villageId), eq(lembagaAnggota.id, id)));
}

export async function deleteAnggota(villageId: number, id: number) {
  await db
    .delete(lembagaAnggota)
    .where(and(eq(lembagaAnggota.villageId, villageId), eq(lembagaAnggota.id, id)));
}

export async function getLembagaStatusPublik(villageId: number, id: number) {
  const [row] = await db
    .select({ status: lembagaDesa.status, tampilPublik: lembagaDesa.tampilPublik })
    .from(lembagaDesa)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.id, id)))
    .limit(1);
  return row ?? null;
}

export async function listLembagaPublik(villageId: number) {
  return db
    .select({
      id: lembagaDesa.id,
      nama: lembagaDesa.nama,
      kode: lembagaDesa.kode,
      jenis: lembagaDesa.jenis,
      logo: lembagaDesa.logo,
      deskripsi: lembagaDesa.deskripsi,
      tugasFungsi: lembagaDesa.tugasFungsi,
      dasarHukum: lembagaDesa.dasarHukum,
      masaBaktiMulai: lembagaDesa.masaBaktiMulai,
      masaBaktiSelesai: lembagaDesa.masaBaktiSelesai,
    })
    .from(lembagaDesa)
    .where(
      and(
        eq(lembagaDesa.villageId, villageId),
        eq(lembagaDesa.status, "aktif"),
        eq(lembagaDesa.tampilPublik, true),
      ),
    )
    .orderBy(asc(lembagaDesa.urut), asc(lembagaDesa.id));
}

export async function listAnggotaPublik(villageId: number) {
  return db
    .select({
      id: lembagaAnggota.id,
      lembagaId: lembagaAnggota.lembagaId,
      nama: lembagaAnggota.nama,
      nomorAnggota: lembagaAnggota.nomorAnggota,
      jabatan: lembagaAnggota.jabatan,
      foto: lembagaAnggota.foto,
      periode: lembagaAnggota.periode,
      periodeMulai: lembagaAnggota.periodeMulai,
      periodeSelesai: lembagaAnggota.periodeSelesai,
    })
    .from(lembagaAnggota)
    .where(
      and(
        eq(lembagaAnggota.villageId, villageId),
        eq(lembagaAnggota.aktif, true),
        eq(lembagaAnggota.tampilPublik, true),
      ),
    )
    .orderBy(asc(lembagaAnggota.urut), asc(lembagaAnggota.id));
}
