import "server-only";

import { and, count, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { families } from "@/db/schema/family";
import { familyRelations, religions } from "@/db/schema/reference";
import { regions } from "@/db/schema/region";
import { residents } from "@/db/schema/resident";
import { residentMutations } from "@/db/schema/resident-mutation";
import type {
  ListRiwayatParams,
  ListRiwayatResult,
  MutationType,
  RiwayatPendudukRow,
} from "@/features/penduduk/domain/riwayat-penduduk";
import { notFound, validationError } from "@/lib/errors";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

/**
 * Identitas penduduk hanya boleh dibaca dari baris residents pada desa yang
 * sama dengan mutasinya. Tanpa syarat `villageId`, relasi legacy yang salah
 * dapat menampilkan nama/NIK penduduk desa lain pada riwayat tenant aktif.
 */
function joinResidentTenant(villageId: number) {
  return and(eq(residents.id, residentMutations.residentId), eq(residents.villageId, villageId));
}

const head = alias(residents, "head");
const fr = alias(familyRelations, "fr");

const riwayatColumns = {
  id: residentMutations.id,
  villageId: residentMutations.villageId,
  residentId: residentMutations.residentId,
  type: residentMutations.type,
  eventDate: residentMutations.eventDate,
  reportedAt: residentMutations.reportedAt,
  actorId: residentMutations.actorId,
  reason: residentMutations.reason,
  notes: residentMutations.notes,
  referenceNo: residentMutations.referenceNo,
  fromRegionId: residentMutations.fromRegionId,
  toRegionId: residentMutations.toRegionId,
  fromAddress: residentMutations.fromAddress,
  toAddress: residentMutations.toAddress,
  meta: residentMutations.meta,
  residentName: residents.name,
  residentNationalId: residents.nationalId,
  actorName: users.name,
  gender: residents.gender,
  birthDate: residents.birthDate,
  lifeStatus: residents.lifeStatus,
  religionId: residents.religionId,
  religionName: religions.name,
  familyNumber: families.number,
  familyHeadName: sql<string | null>`(select ${head.name} from ${residents} ${head}
    inner join ${familyRelations} ${fr} on ${fr.id} = ${head.familyRelationId}
    where ${head.familyId} = ${families.id} and ${fr.name} = 'KEPALA KELUARGA' limit 1)`,
  dusun: regions.dusun,
  rw: regions.rw,
  rt: regions.rt,
};

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return String(value ?? "");
}

function whereRiwayat(villageId: number, params: ListRiwayatParams) {
  const conditions = [eq(residentMutations.villageId, villageId)];

  if (params.type && params.type !== "all") {
    conditions.push(eq(residentMutations.type, params.type as MutationType));
  }
  if (params.from) {
    conditions.push(gte(residentMutations.eventDate, params.from));
  }
  if (params.to) {
    conditions.push(lte(residentMutations.eventDate, params.to));
  }
  if (params.year) {
    conditions.push(sql`YEAR(${residentMutations.eventDate}) = ${params.year}`);
  }
  if (params.month) {
    conditions.push(sql`MONTH(${residentMutations.eventDate}) = ${params.month}`);
  }
  if (params.gender) {
    conditions.push(eq(residents.gender, params.gender));
  }
  if (params.religionId) {
    conditions.push(eq(residents.religionId, params.religionId));
  }
  if (params.regionId) {
    conditions.push(eq(residents.regionId, params.regionId));
  }
  if (params.q && params.q.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(
      or(
        like(residents.name, term),
        like(residents.nationalId, term),
        like(residentMutations.referenceNo, term),
      )!,
    );
  }

  return and(...conditions);
}

/** Join pendukung kolom paritas `penduduk_log` OpenSID (agama, KK, wilayah). */
function joinParitas<T>(query: T, villageId: number): T {
  let hasil = query;
  const joins: Array<[unknown, unknown]> = [
    [religions, eq(residents.religionId, religions.id)],
    [families, and(eq(residents.familyId, families.id), eq(families.villageId, villageId))],
    [regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId))],
  ];
  for (const [table, on] of joins) {
    hasil = (hasil as { leftJoin: (t: unknown, o: unknown) => T }).leftJoin(table, on);
  }
  return hasil;
}

export async function listRiwayatPenduduk(
  villageId: number,
  params: ListRiwayatParams,
): Promise<ListRiwayatResult> {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? DEFAULT_PER_PAGE));
  const offset = (page - 1) * perPage;
  const whereClause = whereRiwayat(villageId, params);

  const rows = await joinParitas(
    db
      .select(riwayatColumns)
      .from(residentMutations)
      .leftJoin(residents, joinResidentTenant(villageId))
      .leftJoin(users, eq(users.id, residentMutations.actorId)),
    villageId,
  )
    .where(whereClause)
    .orderBy(desc(residentMutations.eventDate), desc(residentMutations.id))
    .limit(perPage)
    .offset(offset);

  const [totalRow] = await joinParitas(
    db
      .select({ count: count() })
      .from(residentMutations)
      .leftJoin(residents, joinResidentTenant(villageId)),
    villageId,
  ).where(whereClause);

  return {
    rows: rows.map((row) => ({
      ...row,
      eventDate: toDateString(row.eventDate),
      birthDate: row.birthDate ? toDateString(row.birthDate) : null,
      meta: row.meta ?? null,
    })),
    total: Number(totalRow?.count ?? 0),
    page,
    perPage,
  };
}

/** Semua baris yang cocok filter, tanpa pagination — untuk ekspor CSV. */
export async function listRiwayatPendudukExport(
  villageId: number,
  params: ListRiwayatParams,
): Promise<RiwayatPendudukRow[]> {
  const rows = await joinParitas(
    db
      .select(riwayatColumns)
      .from(residentMutations)
      .leftJoin(residents, joinResidentTenant(villageId))
      .leftJoin(users, eq(users.id, residentMutations.actorId)),
    villageId,
  )
    .where(whereRiwayat(villageId, params))
    .orderBy(desc(residentMutations.eventDate), desc(residentMutations.id));

  return rows.map((row) => ({
    ...row,
    eventDate: toDateString(row.eventDate),
    birthDate: row.birthDate ? toDateString(row.birthDate) : null,
    meta: row.meta ?? null,
  }));
}

export async function getRiwayatByResident(
  villageId: number,
  residentId: number,
  limit = 10,
): Promise<RiwayatPendudukRow[]> {
  const rows = await joinParitas(
    db
      .select(riwayatColumns)
      .from(residentMutations)
      // Riwayat per penduduk memakai inner join: ID penduduk tenant lain tidak
      // boleh membuka baris mutasi desa ini, termasuk baris legacy.
      .innerJoin(residents, joinResidentTenant(villageId))
      .leftJoin(users, eq(users.id, residentMutations.actorId)),
    villageId,
  )
    .where(
      and(eq(residentMutations.villageId, villageId), eq(residentMutations.residentId, residentId)),
    )
    .orderBy(desc(residentMutations.eventDate), desc(residentMutations.id))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    eventDate: toDateString(row.eventDate),
    birthDate: row.birthDate ? toDateString(row.birthDate) : null,
    meta: row.meta ?? null,
  }));
}

export async function getRiwayatById(
  villageId: number,
  id: number,
): Promise<RiwayatPendudukRow | null> {
  const rows = await joinParitas(
    db
      .select(riwayatColumns)
      .from(residentMutations)
      .leftJoin(residents, joinResidentTenant(villageId))
      .leftJoin(users, eq(users.id, residentMutations.actorId)),
    villageId,
  )
    .where(and(eq(residentMutations.villageId, villageId), eq(residentMutations.id, id)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    eventDate: toDateString(row.eventDate),
    birthDate: row.birthDate ? toDateString(row.birthDate) : null,
    meta: row.meta ?? null,
  };
}

/** Perbarui catatan riwayat (paritas `penduduk_log/edit`). */
export async function ubahRiwayatPenduduk(
  villageId: number,
  id: number,
  patch: {
    eventDate: string;
    reportedAt: Date;
    notes: string | null;
    toAddress: string | null;
    meta: unknown;
  },
): Promise<void> {
  const [hasil] = await db
    .update(residentMutations)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(residentMutations.villageId, villageId), eq(residentMutations.id, id)));
  if (hasil.affectedRows === 0) throw notFound("Catatan riwayat tidak ditemukan.");
}

/**
 * Konteks penduduk untuk form ubah status dasar: status tinggal, peran KK,
 * dan jumlah anggota KK (untuk pengecualian kepala KK paritas OpenSID).
 */
export async function getKonteksMutasi(
  villageId: number,
  residentId: number,
): Promise<{
  residenceStatus: "permanent" | "temporary";
  lifeStatus: (typeof residents.$inferSelect)["lifeStatus"];
  kepalaKeluarga: boolean;
  jumlahAnggotaKk: number;
  familyId: number | null;
} | null> {
  const [row] = await db
    .select({
      residenceStatus: residents.residenceStatus,
      lifeStatus: residents.lifeStatus,
      familyId: residents.familyId,
      relationName: familyRelations.name,
    })
    .from(residents)
    .leftJoin(familyRelations, eq(residents.familyRelationId, familyRelations.id))
    .where(and(eq(residents.villageId, villageId), eq(residents.id, residentId)))
    .limit(1);

  if (!row) return null;

  let jumlahAnggotaKk = 0;
  if (row.familyId !== null) {
    const [hitung] = await db
      .select({ count: count() })
      .from(residents)
      .where(and(eq(residents.villageId, villageId), eq(residents.familyId, row.familyId)));
    jumlahAnggotaKk = Number(hitung?.count ?? 0);
  }

  return {
    residenceStatus: row.residenceStatus,
    lifeStatus: row.lifeStatus,
    kepalaKeluarga: row.relationName === "KEPALA KELUARGA",
    jumlahAnggotaKk,
    familyId: row.familyId,
  };
}

/**
 * Simpan penduduk baru sekaligus catatan mutasinya dalam satu transaksi.
 *
 * Dipakai pencatatan kelahiran dan kedatangan: jika salah satu gagal, tidak ada
 * penduduk tanpa riwayat (atau sebaliknya).
 */
export async function simpanPendudukBaruDanMutasi(
  penduduk: typeof residents.$inferInsert,
  mutasi: Omit<typeof residentMutations.$inferInsert, "residentId">,
): Promise<number> {
  if (mutasi.villageId !== penduduk.villageId) {
    throw validationError("Desa penduduk dan desa mutasi harus sama.");
  }

  return db.transaction(async (tx) => {
    const [inserted] = await tx.insert(residents).values(penduduk).$returningId();

    if (!inserted) throw new Error("Gagal menyimpan data penduduk.");

    await tx
      .insert(residentMutations)
      .values({ ...mutasi, villageId: penduduk.villageId, residentId: inserted.id });

    return inserted.id;
  });
}

/** Ubah status kependudukan dan catat mutasinya dalam satu transaksi. */
export async function ubahStatusPendudukDanMutasi(
  villageId: number,
  residentId: number,
  lifeStatus: (typeof residents.$inferSelect)["lifeStatus"],
  mutasi: Omit<typeof residentMutations.$inferInsert, "residentId">,
): Promise<void> {
  if (mutasi.villageId !== villageId) {
    throw validationError("Desa mutasi tidak sesuai dengan desa penduduk.");
  }

  await db.transaction(async (tx) => {
    const [hasil] = await tx
      .update(residents)
      .set({ lifeStatus, updatedAt: new Date() })
      .where(and(eq(residents.id, residentId), eq(residents.villageId, villageId)));

    // Update yang tidak mengenai baris berarti penduduk tidak ada di tenant ini.
    // Tanpa pemeriksaan ini, mutasi tetap tersimpan dengan pasangan tenant-resident
    // yang tidak konsisten.
    if (hasil.affectedRows === 0) throw notFound("Data penduduk tidak ditemukan.");

    await tx.insert(residentMutations).values({ ...mutasi, villageId, residentId });
  });
}
