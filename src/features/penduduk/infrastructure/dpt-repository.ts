import "server-only";

import { and, asc, count, desc, eq, isNotNull, isNull, like, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

import { db } from "@/db";
import {
  educations,
  elections,
  families,
  familyRelations,
  maritalStatuses,
  occupations,
  regions,
  religions,
  residents,
} from "@/db/schema";
import {
  DEFAULT_DPT_PAGE,
  DEFAULT_DPT_PER_PAGE,
  MAX_DPT_PER_PAGE,
  type DptFilter,
  type DptReferenceData,
  type DptRow,
  type ElectionDTO,
  type ListDptParams,
  type ListDptResult,
} from "@/features/penduduk/domain/dpt";

const familyRegions = alias(regions, "dpt_family_regions");
const educationsSedang = alias(educations, "dpt_educations_sedang");

/** Ambil pemilihan aktif untuk desa. */
export async function getActiveElection(villageId: number): Promise<ElectionDTO | null> {
  const row = await db
    .select()
    .from(elections)
    .where(and(eq(elections.villageId, villageId), eq(elections.status, "aktif")))
    .limit(1);

  if (!row[0]) return null;

  return {
    id: row[0].id,
    villageId: row[0].villageId,
    judul: row[0].judul,
    status: row[0].status,
    tanggal: row[0].tanggal,
    keterangan: row[0].keterangan,
    createdAt: row[0].createdAt.toISOString(),
    updatedAt: row[0].updatedAt.toISOString(),
  };
}

/** Katalog dan wilayah yang dipakai filter lanjutan DPT. */
export async function getDptReferenceData(villageId: number): Promise<DptReferenceData> {
  const [religionsRows, educationsRows, occupationsRows, maritalRows, regionRows] =
    await Promise.all([
      db
        .select({ id: religions.id, name: religions.name })
        .from(religions)
        .orderBy(asc(religions.id)),
      db
        .select({ id: educations.id, name: educations.name })
        .from(educations)
        .orderBy(asc(educations.id)),
      db
        .select({ id: occupations.id, name: occupations.name })
        .from(occupations)
        .orderBy(asc(occupations.id)),
      db
        .select({ id: maritalStatuses.id, name: maritalStatuses.name })
        .from(maritalStatuses)
        .orderBy(asc(maritalStatuses.id)),
      db
        .select({ dusun: regions.dusun, rw: regions.rw, rt: regions.rt })
        .from(regions)
        .where(eq(regions.villageId, villageId)),
    ]);

  const unik = (nilai: (string | null)[]): string[] =>
    [...new Set(nilai.filter((item): item is string => item !== null && item !== ""))].sort(
      (a, b) => a.localeCompare(b, "id"),
    );

  return {
    religions: religionsRows,
    educations: educationsRows,
    occupations: occupationsRows,
    maritalStatuses: maritalRows,
    dusun: unik(regionRows.map((row) => row.dusun)),
    rw: unik(regionRows.map((row) => row.rw)),
    rt: unik(regionRows.map((row) => row.rt)),
  };
}

/** Bangun klausa WHERE untuk filter DPT. */
function whereDpt(
  villageId: number,
  params: DptFilter,
  tanggalPemilihan: string,
  opsi: { cariNamaSaja?: boolean } = {},
) {
  const conditions = [
    eq(residents.villageId, villageId),
    eq(residents.lifeStatus, "alive"),
    // Umur minimal 17 tahun PADA tanggal pemilihan ATAU sudah kawin/cerai.
    or(
      sql`TIMESTAMPDIFF(YEAR, ${residents.birthDate}, ${tanggalPemilihan}) >= 17`,
      and(isNotNull(residents.maritalStatusId), ne(maritalStatuses.name, "Belum Kawin")),
    ),
  ];

  if (params.search) {
    // Halaman publik hanya boleh mencocokkan nama: NIK tidak dipakai sebagai
    // kata kunci agar nomor identitas tidak bisa ditebak lewat pencarian.
    conditions.push(
      opsi.cariNamaSaja
        ? like(residents.name, `%${params.search}%`)
        : or(
            like(residents.name, `%${params.search}%`),
            like(residents.nationalId, `%${params.search}%`),
          ),
    );
  }

  if (params.dusun) {
    conditions.push(eq(regions.dusun, params.dusun));
  }
  if (params.rw) {
    conditions.push(eq(regions.rw, params.rw));
  }
  if (params.rt) {
    conditions.push(eq(regions.rt, params.rt));
  }
  if (params.gender) {
    conditions.push(eq(residents.gender, params.gender));
  }
  if (params.agamaId) {
    conditions.push(eq(residents.religionId, params.agamaId));
  }
  if (params.pendidikanId) {
    conditions.push(eq(residents.educationId, params.pendidikanId));
  }
  if (params.pendidikanSedangId) {
    conditions.push(eq(residents.educationSedangId, params.pendidikanSedangId));
  }
  if (params.pekerjaanId) {
    conditions.push(eq(residents.occupationId, params.pekerjaanId));
  }
  if (params.statusKawinId) {
    conditions.push(eq(residents.maritalStatusId, params.statusKawinId));
  }
  if (params.tagIdCard === "ada") {
    conditions.push(isNotNull(residents.idCardTag));
  } else if (params.tagIdCard === "tidak") {
    conditions.push(isNull(residents.idCardTag));
  }
  // Umur filter tambahan (di atas umur minimal pemilu).
  const satuanUmur = params.umurSatuan === "bulan" ? "MONTH" : "YEAR";
  if (params.umurMin) {
    conditions.push(
      sql`TIMESTAMPDIFF(${sql.raw(satuanUmur)}, ${residents.birthDate}, ${tanggalPemilihan}) >= ${params.umurMin}`,
    );
  }
  if (params.umurMax) {
    conditions.push(
      sql`TIMESTAMPDIFF(${sql.raw(satuanUmur)}, ${residents.birthDate}, ${tanggalPemilihan}) <= ${params.umurMax}`,
    );
  }

  return and(...conditions);
}

/** Daftar DPT dengan pagination. */
export async function listDpt(
  villageId: number,
  params: ListDptParams,
  opsi: { cariNamaSaja?: boolean } = {},
): Promise<ListDptResult> {
  const election = await getActiveElection(villageId);
  if (!election) {
    return {
      rows: [],
      total: 0,
      page: 1,
      perPage: DEFAULT_DPT_PER_PAGE,
      pageCount: 1,
    };
  }

  const page = Math.max(1, params.page ?? DEFAULT_DPT_PAGE);
  const perPage = Math.min(MAX_DPT_PER_PAGE, Math.max(1, params.perPage ?? DEFAULT_DPT_PER_PAGE));
  const offset = (page - 1) * perPage;

  const whereClause = whereDpt(villageId, params, election.tanggal, opsi);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: residents.id,
        nationalId: residents.nationalId,
        idCardTag: residents.idCardTag,
        name: residents.name,
        gender: residents.gender,
        birthPlace: residents.birthPlace,
        birthDate: residents.birthDate,
        familyId: residents.familyId,
        familyNumber: families.number,
        address: sql<
          string | null
        >`COALESCE(${families.address}, ${residents.currentAddress}, ${residents.address})`,
        dusun: sql<string | null>`COALESCE(${familyRegions.dusun}, ${regions.dusun})`,
        rw: sql<string | null>`COALESCE(${familyRegions.rw}, ${regions.rw})`,
        rt: sql<string | null>`COALESCE(${familyRegions.rt}, ${regions.rt})`,
        agama: religions.name,
        pendidikan: educations.name,
        pendidikanSedang: educationsSedang.name,
        pekerjaan: occupations.name,
        statusKawin: maritalStatuses.name,
        familyRelation: familyRelations.name,
        fatherName: residents.fatherName,
        motherName: residents.motherName,
        // hitung umur di SQL
        umurPemilihan: sql<number>`TIMESTAMPDIFF(YEAR, ${residents.birthDate}, ${election.tanggal})`,
      })
      .from(residents)
      .leftJoin(regions, and(eq(regions.id, residents.regionId), eq(regions.villageId, villageId)))
      .leftJoin(
        families,
        and(eq(families.id, residents.familyId), eq(families.villageId, villageId)),
      )
      .leftJoin(
        familyRegions,
        and(eq(familyRegions.id, families.regionId), eq(familyRegions.villageId, villageId)),
      )
      .leftJoin(religions, eq(religions.id, residents.religionId))
      .leftJoin(educations, eq(educations.id, residents.educationId))
      .leftJoin(educationsSedang, eq(educationsSedang.id, residents.educationSedangId))
      .leftJoin(occupations, eq(occupations.id, residents.occupationId))
      .leftJoin(maritalStatuses, eq(maritalStatuses.id, residents.maritalStatusId))
      .leftJoin(familyRelations, eq(familyRelations.id, residents.familyRelationId))
      .where(whereClause)
      .orderBy(regions.dusun, regions.rw, regions.rt, residents.name)
      .limit(perPage)
      .offset(offset),

    db
      .select({ count: count() })
      .from(residents)
      .leftJoin(regions, and(eq(regions.id, residents.regionId), eq(regions.villageId, villageId)))
      .leftJoin(maritalStatuses, eq(maritalStatuses.id, residents.maritalStatusId))
      .where(whereClause),
  ]);

  const mapped: DptRow[] = rows.map((r) => ({
    id: r.id,
    nationalId: r.nationalId,
    idCardTag: r.idCardTag,
    name: r.name,
    gender: r.gender,
    birthPlace: r.birthPlace,
    birthDate: r.birthDate,
    familyId: r.familyId,
    familyNumber: r.familyNumber,
    address: r.address,
    dusun: r.dusun,
    rw: r.rw,
    rt: r.rt,
    agama: r.agama,
    pendidikan: r.pendidikan,
    pendidikanSedang: r.pendidikanSedang,
    pekerjaan: r.pekerjaan,
    statusKawin: r.statusKawin,
    familyRelation: r.familyRelation,
    fatherName: r.fatherName,
    motherName: r.motherName,
    umurPemilihan: r.umurPemilihan ?? null,
  }));

  return {
    rows: mapped,
    total: Number(totalRow[0]?.count ?? 0),
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(Number(totalRow[0]?.count ?? 0) / perPage)),
  };
}

/**
 * Baris ringkas seluruh pemilih pada pemilihan aktif (dusun + jenis kelamin).
 *
 * Dipakai rekapitulasi agar tidak perlu memuat kolom yang tidak ditampilkan.
 */
export async function listDptRingkas(
  villageId: number,
  params: DptFilter = {},
): Promise<{ dusun: string | null; gender: "male" | "female" }[]> {
  const election = await getActiveElection(villageId);
  if (!election) return [];

  const whereClause = whereDpt(villageId, params, election.tanggal);

  return db
    .select({ dusun: regions.dusun, gender: residents.gender })
    .from(residents)
    .leftJoin(regions, and(eq(regions.id, residents.regionId), eq(regions.villageId, villageId)))
    .leftJoin(maritalStatuses, eq(maritalStatuses.id, residents.maritalStatusId))
    .where(whereClause)
    .orderBy(regions.dusun, residents.name);
}

/** Semua baris DPT (tanpa pagination) untuk ekspor CSV. */
export async function listDptExport(villageId: number, params: ListDptParams): Promise<DptRow[]> {
  const election = await getActiveElection(villageId);
  if (!election) return [];

  const whereClause = whereDpt(villageId, params, election.tanggal);

  const rows = await db
    .select({
      id: residents.id,
      nationalId: residents.nationalId,
      idCardTag: residents.idCardTag,
      name: residents.name,
      gender: residents.gender,
      birthPlace: residents.birthPlace,
      birthDate: residents.birthDate,
      familyId: residents.familyId,
      familyNumber: families.number,
      address: sql<
        string | null
      >`COALESCE(${families.address}, ${residents.currentAddress}, ${residents.address})`,
      dusun: sql<string | null>`COALESCE(${familyRegions.dusun}, ${regions.dusun})`,
      rw: sql<string | null>`COALESCE(${familyRegions.rw}, ${regions.rw})`,
      rt: sql<string | null>`COALESCE(${familyRegions.rt}, ${regions.rt})`,
      agama: religions.name,
      pendidikan: educations.name,
      pendidikanSedang: educationsSedang.name,
      pekerjaan: occupations.name,
      statusKawin: maritalStatuses.name,
      familyRelation: familyRelations.name,
      fatherName: residents.fatherName,
      motherName: residents.motherName,
      umurPemilihan: sql<number>`TIMESTAMPDIFF(YEAR, ${residents.birthDate}, ${election.tanggal})`,
    })
    .from(residents)
    .leftJoin(regions, and(eq(regions.id, residents.regionId), eq(regions.villageId, villageId)))
    .leftJoin(families, and(eq(families.id, residents.familyId), eq(families.villageId, villageId)))
    .leftJoin(
      familyRegions,
      and(eq(familyRegions.id, families.regionId), eq(familyRegions.villageId, villageId)),
    )
    .leftJoin(religions, eq(religions.id, residents.religionId))
    .leftJoin(educations, eq(educations.id, residents.educationId))
    .leftJoin(educationsSedang, eq(educationsSedang.id, residents.educationSedangId))
    .leftJoin(occupations, eq(occupations.id, residents.occupationId))
    .leftJoin(maritalStatuses, eq(maritalStatuses.id, residents.maritalStatusId))
    .leftJoin(familyRelations, eq(familyRelations.id, residents.familyRelationId))
    .where(whereClause)
    .orderBy(regions.dusun, regions.rw, regions.rt, residents.name);

  return rows.map((r) => ({
    id: r.id,
    nationalId: r.nationalId,
    idCardTag: r.idCardTag,
    name: r.name,
    gender: r.gender,
    birthPlace: r.birthPlace,
    birthDate: r.birthDate,
    familyId: r.familyId,
    familyNumber: r.familyNumber,
    address: r.address,
    dusun: r.dusun,
    rw: r.rw,
    rt: r.rt,
    agama: r.agama,
    pendidikan: r.pendidikan,
    pendidikanSedang: r.pendidikanSedang,
    pekerjaan: r.pekerjaan,
    statusKawin: r.statusKawin,
    familyRelation: r.familyRelation,
    fatherName: r.fatherName,
    motherName: r.motherName,
    umurPemilihan: r.umurPemilihan ?? null,
  }));
}

/** Baris tabel pemilihan (bentuk penyimpanan, belum dipetakan ke DTO). */
export type BarisPemilihan = typeof elections.$inferSelect;
type StatusPemilihan = BarisPemilihan["status"];

/** Seluruh pemilihan desa, terbaru lebih dahulu. */
export async function queryElections(villageId: number): Promise<BarisPemilihan[]> {
  return db
    .select()
    .from(elections)
    .where(eq(elections.villageId, villageId))
    .orderBy(desc(elections.tanggal));
}

export async function queryElectionById(
  villageId: number,
  id: number,
): Promise<BarisPemilihan | null> {
  const [row] = await db
    .select()
    .from(elections)
    .where(and(eq(elections.id, id), eq(elections.villageId, villageId)))
    .limit(1);

  return row ?? null;
}

/** Apakah sudah ada pemilihan aktif lain di desa ini. */
export async function adaPemilihanAktifLain(
  villageId: number,
  kecualiId?: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: elections.id })
    .from(elections)
    .where(
      and(
        eq(elections.villageId, villageId),
        eq(elections.status, "aktif"),
        kecualiId ? sql`${elections.id} != ${kecualiId}` : undefined,
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function insertElection(
  villageId: number,
  input: {
    judul: string;
    status: StatusPemilihan;
    tanggal: string;
    keterangan: string | null;
  },
): Promise<number> {
  const [inserted] = await db
    .insert(elections)
    .values({ villageId, ...input })
    .$returningId();

  return inserted?.id ?? 0;
}

export async function updateElection(
  villageId: number,
  id: number,
  input: {
    judul: string;
    status: StatusPemilihan;
    tanggal: string;
    keterangan: string | null;
  },
): Promise<void> {
  await db
    .update(elections)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(elections.id, id), eq(elections.villageId, villageId)));
}

export async function deleteElection(villageId: number, id: number): Promise<void> {
  await db.delete(elections).where(and(eq(elections.id, id), eq(elections.villageId, villageId)));
}
