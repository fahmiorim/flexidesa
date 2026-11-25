import "server-only";

import {
  and,
  asc,
  count,
  eq,
  inArray,
  isNotNull,
  isNull,
  like,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

import { db } from "@/db";
import {
  bloodTypes,
  citizenships,
  educations,
  families,
  familyMemberLogs,
  familyRelations,
  kontak,
  lapak,
  letters,
  maritalStatuses,
  notifikasiTerkirim,
  occupations,
  pendapat,
  regions,
  religions,
  residentMutations,
  residents,
  suplemenTerdata,
  users,
} from "@/db/schema";
import {
  HEAD_OF_FAMILY_RELATION_ID,
  type PendudukDTO,
  type PendudukFilter,
  type PendudukFormInput,
  type PendudukListRow,
} from "@/features/penduduk/domain/penduduk";
import type { PendudukEksporRow } from "@/features/penduduk/domain/penduduk-export";
import { formatWilayahLabel } from "@/features/wilayah/domain/wilayah";
import { validationError } from "@/lib/errors";

export interface ListPendudukParams {
  villageId: number;
  /** Filter lanjutan (pencarian, status, katalog, wilayah, dan rentang umur). */
  filter: PendudukFilter;
  page: number;
  pageSize: number;
}

export interface PendudukListResult {
  rows: PendudukListRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

function toDto(row: typeof residents.$inferSelect): PendudukDTO {
  return {
    id: row.id,
    nationalId: row.nationalId,
    familyId: row.familyId,
    name: row.name,
    gender: row.gender,
    birthPlace: row.birthPlace,
    birthDate: row.birthDate,
    ktpEl: row.ktpEl,
    statusRekam: row.statusRekam,
    idCardTag: row.idCardTag,
    ktpIssuedPlace: row.ktpIssuedPlace,
    ktpIssuedDate: row.ktpIssuedDate,
    previousFamilyNumber: row.previousFamilyNumber,
    arrivalPurpose: row.arrivalPurpose,
    birthTime: row.birthTime,
    birthPlaceType: row.birthPlaceType,
    birthType: row.birthType,
    birthChildNumber: row.birthChildNumber,
    birthAssistant: row.birthAssistant,
    birthWeightGram: row.birthWeightGram,
    birthLengthCm: row.birthLengthCm,
    religionId: row.religionId,
    educationId: row.educationId,
    educationSedangId: row.educationSedangId,
    occupationId: row.occupationId,
    migrantWorker: row.migrantWorker,
    maritalStatusId: row.maritalStatusId,
    familyRelationId: row.familyRelationId,
    bloodTypeId: row.bloodTypeId,
    citizenshipId: row.citizenshipId,
    originCountry: row.originCountry,
    adat: row.adat,
    marga: row.marga,
    residenceStatus: row.residenceStatus,
    lifeStatus: row.lifeStatus,
    regionId: row.regionId,
    address: row.address,
    previousAddress: row.previousAddress,
    currentAddress: row.currentAddress,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    telegram: row.telegram,
    contactMethod: row.contactMethod,
    fatherName: row.fatherName,
    motherName: row.motherName,
    fatherNationalId: row.fatherNationalId,
    motherNationalId: row.motherNationalId,
    birthCertificateNumber: row.birthCertificateNumber,
    marriageCertificateNumber: row.marriageCertificateNumber,
    marriageDate: row.marriageDate,
    divorceCertificateNumber: row.divorceCertificateNumber,
    divorceDate: row.divorceDate,
    passportNumber: row.passportNumber,
    passportExpiryDate: row.passportExpiryDate,
    kitasNumber: row.kitasNumber,
    ethnicity: row.ethnicity,
    disability: row.disability,
    chronicIllness: row.chronicIllness,
    kbMethod: row.kbMethod,
    pregnancyStatus: row.pregnancyStatus,
    insurance: row.insurance,
    insuranceNumber: row.insuranceNumber,
    insuranceStatus: row.insuranceStatus,
    bpjsEmploymentNumber: row.bpjsEmploymentNumber,
    literacy: row.literacy,
    notes: row.notes,
  };
}

function formatRegionLabel(
  regionId: number | null,
  dusun: string | null,
  rw: string | null,
  rt: string | null,
): string | null {
  if (regionId === null) return null;
  return formatWilayahLabel({ dusun: dusun ?? "", rw: rw ?? "", rt: rt ?? "" });
}

/**
 * Bangun klausa WHERE daftar penduduk.
 *
 * Wilayah disaring lewat kolom `regions` (dusun/RW/RT), sehingga pemanggil
 * wajib ikut menyertakan `leftJoin(regions, ...)` pada query-nya.
 */
function buildWhere(villageId: number, filter: PendudukFilter): SQL {
  const villageFilter = eq(residents.villageId, villageId);
  const filters: SQL[] = [villageFilter];

  if (filter.search) {
    const term = `%${filter.search}%`;
    const searchFilter = or(
      like(residents.name, term),
      like(residents.nationalId, term),
      like(families.number, term),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  if (filter.lifeStatus) filters.push(eq(residents.lifeStatus, filter.lifeStatus));
  if (filter.gender) filters.push(eq(residents.gender, filter.gender));
  if (filter.residenceStatus) {
    filters.push(eq(residents.residenceStatus, filter.residenceStatus));
  }
  if (filter.religionId !== null) filters.push(eq(residents.religionId, filter.religionId));
  if (filter.educationId !== null) filters.push(eq(residents.educationId, filter.educationId));
  if (filter.occupationId !== null) filters.push(eq(residents.occupationId, filter.occupationId));
  if (filter.maritalStatusId !== null) {
    filters.push(eq(residents.maritalStatusId, filter.maritalStatusId));
  }
  if (filter.dusun) filters.push(eq(regions.dusun, filter.dusun));
  if (filter.rw) filters.push(eq(regions.rw, filter.rw));
  if (filter.rt) filters.push(eq(regions.rt, filter.rt));
  if (filter.umurMin !== null) {
    filters.push(sql`TIMESTAMPDIFF(YEAR, ${residents.birthDate}, CURDATE()) >= ${filter.umurMin}`);
  }
  if (filter.umurMax !== null) {
    filters.push(sql`TIMESTAMPDIFF(YEAR, ${residents.birthDate}, CURDATE()) <= ${filter.umurMax}`);
  }
  if (filter.disability !== null) {
    // "Tidak cacat" pada laporan adalah sisa penduduk, termasuk yang belum diisi.
    const cacat = eq(residents.disability, filter.disability);
    const kondisi = filter.disability === "none" ? or(cacat, isNull(residents.disability)) : cacat;
    if (kondisi) filters.push(kondisi);
  }
  if (filter.chronicIllness) {
    const sakit = and(isNotNull(residents.chronicIllness), ne(residents.chronicIllness, "none"));
    if (sakit) filters.push(sakit);
  }
  if (filter.pregnancyStatus) filters.push(eq(residents.pregnancyStatus, filter.pregnancyStatus));

  return and(...filters) ?? villageFilter;
}

function blankToNull(value: string | null): string | null {
  return value === "" ? null : value;
}

/**
 * Verifikasi bahwa foreign reference tenant-scoped milik desa pemanggil.
 *
 * ID global saja tidak cukup: families dan regions masing-masing membawa
 * villageId sendiri. Pesan error sengaja generik agar tidak membocorkan
 * keberadaan record tenant lain.
 */
export async function validatePendudukTenantReferences(
  villageId: number,
  input: Pick<PendudukFormInput, "familyId" | "regionId">,
): Promise<void> {
  if (input.familyId !== null) {
    const [family] = await db
      .select({ id: families.id })
      .from(families)
      .where(and(eq(families.id, input.familyId), eq(families.villageId, villageId)))
      .limit(1);

    if (!family) {
      throw validationError("Kartu Keluarga atau wilayah tidak valid untuk desa ini.");
    }
  }

  if (input.regionId !== null) {
    const [region] = await db
      .select({ id: regions.id })
      .from(regions)
      .where(and(eq(regions.id, input.regionId), eq(regions.villageId, villageId)))
      .limit(1);

    if (!region) {
      throw validationError("Kartu Keluarga atau wilayah tidak valid untuk desa ini.");
    }
  }
}

export async function listPenduduk(params: ListPendudukParams): Promise<PendudukListResult> {
  const { villageId, filter, page, pageSize } = params;
  const where = buildWhere(villageId, filter);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        resident: residents,
        religionName: religions.name,
        educationName: educations.name,
        occupationName: occupations.name,
        maritalStatusName: maritalStatuses.name,
        familyNumber: families.number,
        joinedRegionId: regions.id,
        dusun: regions.dusun,
        rw: regions.rw,
        rt: regions.rt,
      })
      .from(residents)
      .leftJoin(religions, eq(residents.religionId, religions.id))
      .leftJoin(educations, eq(residents.educationId, educations.id))
      .leftJoin(occupations, eq(residents.occupationId, occupations.id))
      .leftJoin(maritalStatuses, eq(residents.maritalStatusId, maritalStatuses.id))
      .leftJoin(
        families,
        and(eq(residents.familyId, families.id), eq(families.villageId, villageId)),
      )
      .leftJoin(regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)))
      .where(where)
      .orderBy(asc(residents.name), asc(residents.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: count() })
      .from(residents)
      .leftJoin(
        families,
        and(eq(residents.familyId, families.id), eq(families.villageId, villageId)),
      )
      .leftJoin(regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)))
      .where(where),
  ]);

  const total = Number(totalRows[0]?.value ?? 0);

  return {
    rows: rows.map((row) => ({
      ...toDto(row.resident),
      religionName: row.religionName ?? null,
      educationName: row.educationName ?? null,
      occupationName: row.occupationName ?? null,
      maritalStatusName: row.maritalStatusName ?? null,
      familyNumber: row.familyNumber ?? null,
      regionLabel:
        row.joinedRegionId === null
          ? null
          : formatRegionLabel(row.resident.regionId, row.dusun, row.rw, row.rt),
      createdAt: row.resident.createdAt,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Baris lengkap untuk ekspor: seluruh DTO ditambah nama katalog dan wilayah.
 *
 * Query terpisah dari daftar tabel agar halaman daftar tidak menanggung join
 * katalog yang tidak ditampilkan.
 */
export async function listPendudukEksporRows(
  villageId: number,
  filter: PendudukFilter,
): Promise<PendudukEksporRow[]> {
  const educationsSedang = alias(educations, "educations_sedang");
  const rows = await db
    .select({
      resident: residents,
      religionName: religions.name,
      educationName: educations.name,
      educationSedangName: educationsSedang.name,
      occupationName: occupations.name,
      maritalStatusName: maritalStatuses.name,
      familyRelationName: familyRelations.name,
      bloodTypeName: bloodTypes.name,
      citizenshipName: citizenships.name,
      familyNumber: families.number,
      dusun: regions.dusun,
      rw: regions.rw,
      rt: regions.rt,
    })
    .from(residents)
    .leftJoin(religions, eq(residents.religionId, religions.id))
    .leftJoin(educations, eq(residents.educationId, educations.id))
    .leftJoin(educationsSedang, eq(residents.educationSedangId, educationsSedang.id))
    .leftJoin(occupations, eq(residents.occupationId, occupations.id))
    .leftJoin(maritalStatuses, eq(residents.maritalStatusId, maritalStatuses.id))
    .leftJoin(familyRelations, eq(residents.familyRelationId, familyRelations.id))
    .leftJoin(bloodTypes, eq(residents.bloodTypeId, bloodTypes.id))
    .leftJoin(citizenships, eq(residents.citizenshipId, citizenships.id))
    .leftJoin(families, and(eq(residents.familyId, families.id), eq(families.villageId, villageId)))
    .leftJoin(regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)))
    .where(buildWhere(villageId, filter))
    .orderBy(
      asc(families.number),
      asc(residents.familyRelationId),
      asc(residents.name),
      asc(residents.id),
    );

  return rows.map((row) => ({
    ...toDto(row.resident),
    religionName: row.religionName ?? null,
    educationName: row.educationName ?? null,
    educationSedangName: row.educationSedangName ?? null,
    occupationName: row.occupationName ?? null,
    maritalStatusName: row.maritalStatusName ?? null,
    familyRelationName: row.familyRelationName ?? null,
    bloodTypeName: row.bloodTypeName ?? null,
    citizenshipName: row.citizenshipName ?? null,
    familyNumber: row.familyNumber ?? null,
    dusun: row.dusun ?? null,
    rw: row.rw ?? null,
    rt: row.rt ?? null,
  }));
}

export interface RingkasanPenduduk {
  total: number;
  lakiLaki: number;
  perempuan: number;
  keluarga: number;
}

/**
 * Angka ringkas untuk kartu KPI halaman penduduk.
 *
 * Satu query agregat, bukan beberapa pemanggilan `listPenduduk`; semua hitungan
 * dibatasi desa pemanggil. `total` mencakup seluruh status agar angkanya sama
 * dengan jumlah baris tabel saat filter kosong.
 */
export async function getRingkasanPenduduk(villageId: number): Promise<RingkasanPenduduk> {
  const [row] = await db
    .select({
      total: count(),
      lakiLaki: sql<number>`COALESCE(SUM(CASE WHEN ${residents.gender} = 'male' THEN 1 ELSE 0 END), 0)`,
      perempuan: sql<number>`COALESCE(SUM(CASE WHEN ${residents.gender} = 'female' THEN 1 ELSE 0 END), 0)`,
      keluarga: sql<number>`COUNT(DISTINCT ${residents.familyId})`,
    })
    .from(residents)
    .where(eq(residents.villageId, villageId));

  return {
    total: Number(row?.total ?? 0),
    lakiLaki: Number(row?.lakiLaki ?? 0),
    perempuan: Number(row?.perempuan ?? 0),
    keluarga: Number(row?.keluarga ?? 0),
  };
}

export async function findPendudukById(villageId: number, id: number): Promise<PendudukDTO | null> {
  const [row] = await db
    .select()
    .from(residents)
    .where(and(eq(residents.villageId, villageId), eq(residents.id, id)))
    .limit(1);
  return row ? toDto(row) : null;
}

/**
 * Penduduk berstatus hidup dengan NIK tertentu di satu desa.
 *
 * Dipakai verifikasi tanpa akun pada anjungan kiosk; hanya kolom yang aman
 * untuk ditampilkan di layar publik yang dikembalikan.
 */
export async function findPendudukHidupByNik(
  villageId: number,
  nationalId: string,
): Promise<{ id: number; nama: string; nik: string | null; tanggalLahir: string | null } | null> {
  const [row] = await db
    .select({
      id: residents.id,
      nama: residents.name,
      nik: residents.nationalId,
      tanggalLahir: residents.birthDate,
    })
    .from(residents)
    .where(
      and(
        eq(residents.villageId, villageId),
        eq(residents.nationalId, nationalId),
        eq(residents.lifeStatus, "alive"),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Nilai kolom `residents` dari input formulir/import. */
function toInsertValues(villageId: number, input: PendudukFormInput) {
  return {
    villageId,
    nationalId: input.nationalId,
    familyId: input.familyId,
    name: input.name,
    gender: input.gender,
    birthPlace: blankToNull(input.birthPlace),
    birthDate: input.birthDate,
    ktpEl: input.ktpEl,
    statusRekam: input.statusRekam,
    idCardTag: blankToNull(input.idCardTag),
    ktpIssuedPlace: blankToNull(input.ktpIssuedPlace),
    ktpIssuedDate: input.ktpIssuedDate,
    previousFamilyNumber: blankToNull(input.previousFamilyNumber),
    arrivalPurpose: blankToNull(input.arrivalPurpose),
    birthTime: blankToNull(input.birthTime),
    birthPlaceType: input.birthPlaceType,
    birthType: input.birthType,
    birthChildNumber: input.birthChildNumber,
    birthAssistant: input.birthAssistant,
    birthWeightGram: input.birthWeightGram,
    birthLengthCm: input.birthLengthCm,
    religionId: input.religionId,
    educationId: input.educationId,
    educationSedangId: input.educationSedangId,
    occupationId: input.occupationId,
    migrantWorker: blankToNull(input.migrantWorker),
    maritalStatusId: input.maritalStatusId,
    familyRelationId: input.familyRelationId,
    bloodTypeId: input.bloodTypeId,
    citizenshipId: input.citizenshipId,
    originCountry: blankToNull(input.originCountry),
    adat: blankToNull(input.adat),
    marga: blankToNull(input.marga),
    residenceStatus: input.residenceStatus,
    lifeStatus: input.lifeStatus,
    regionId: input.regionId,
    address: blankToNull(input.address),
    previousAddress: blankToNull(input.previousAddress),
    currentAddress: blankToNull(input.currentAddress),
    latitude: blankToNull(input.latitude),
    longitude: blankToNull(input.longitude),
    phone: blankToNull(input.phone),
    email: blankToNull(input.email),
    telegram: blankToNull(input.telegram),
    contactMethod: input.contactMethod,
    fatherName: blankToNull(input.fatherName),
    motherName: blankToNull(input.motherName),
    fatherNationalId: input.fatherNationalId,
    motherNationalId: input.motherNationalId,
    birthCertificateNumber: blankToNull(input.birthCertificateNumber),
    marriageCertificateNumber: blankToNull(input.marriageCertificateNumber),
    marriageDate: input.marriageDate,
    divorceCertificateNumber: blankToNull(input.divorceCertificateNumber),
    divorceDate: input.divorceDate,
    passportNumber: blankToNull(input.passportNumber),
    passportExpiryDate: input.passportExpiryDate,
    kitasNumber: blankToNull(input.kitasNumber),
    ethnicity: blankToNull(input.ethnicity),
    disability: input.disability,
    chronicIllness: input.chronicIllness,
    kbMethod: input.kbMethod,
    pregnancyStatus: input.pregnancyStatus,
    insurance: input.insurance,
    insuranceNumber: blankToNull(input.insuranceNumber),
    insuranceStatus: input.insuranceStatus,
    bpjsEmploymentNumber: blankToNull(input.bpjsEmploymentNumber),
    literacy: input.literacy,
    notes: blankToNull(input.notes),
  };
}

export async function insertPenduduk(villageId: number, input: PendudukFormInput): Promise<number> {
  const [inserted] = await db
    .insert(residents)
    .values(toInsertValues(villageId, input))
    .$returningId();
  if (!inserted) throw new Error("Gagal menyimpan data penduduk.");
  return inserted.id;
}

/**
 * Simpan banyak penduduk sekaligus dalam satu transaksi.
 *
 * Dipakai impor berkas: bila satu baris gagal, seluruh proses dibatalkan agar
 * data desa tidak setengah masuk. Pemeriksaan NIK ganda dan aturan kepala
 * keluarga dilakukan use case sebelum fungsi ini dipanggil.
 */
export async function insertPendudukBatch(
  villageId: number,
  inputs: readonly PendudukFormInput[],
): Promise<number[]> {
  if (inputs.length === 0) return [];

  return db.transaction(async (tx) => {
    const ids: number[] = [];
    for (const input of inputs) {
      const [inserted] = await tx
        .insert(residents)
        .values(toInsertValues(villageId, input))
        .$returningId();
      if (!inserted) throw new Error("Gagal menyimpan data penduduk.");
      ids.push(inserted.id);
    }
    return ids;
  });
}

/** NIK pada desa ini yang sudah terpakai, dibatasi daftar NIK yang diperiksa. */
export async function findNationalIdsInVillage(
  villageId: number,
  nationalIds: readonly string[],
): Promise<Set<string>> {
  if (nationalIds.length === 0) return new Set();
  const rows = await db
    .select({ nationalId: residents.nationalId })
    .from(residents)
    .where(
      and(eq(residents.villageId, villageId), inArray(residents.nationalId, [...nationalIds])),
    );
  return new Set(rows.map((row) => row.nationalId).filter((id): id is string => id !== null));
}

/** Id KK pada desa ini, dibatasi daftar id yang diperiksa. */
export async function findFamilyIdsInVillage(
  villageId: number,
  familyIds: readonly number[],
): Promise<Set<number>> {
  if (familyIds.length === 0) return new Set();
  const rows = await db
    .select({ id: families.id })
    .from(families)
    .where(and(eq(families.villageId, villageId), inArray(families.id, [...familyIds])));
  return new Set(rows.map((row) => row.id));
}
export async function getPendudukDetailById(villageId: number, id: number) {
  const row = await db
    .select({
      resident: residents,
      family: families,
      region: regions,
      religion: religions,
      education: educations,
      occupation: occupations,
      maritalStatus: maritalStatuses,
      familyRelation: familyRelations,
      bloodType: bloodTypes,
      citizenship: citizenships,
    })
    .from(residents)
    .leftJoin(families, and(eq(residents.familyId, families.id), eq(families.villageId, villageId)))
    .leftJoin(regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)))
    .leftJoin(religions, eq(residents.religionId, religions.id))
    .leftJoin(educations, eq(residents.educationId, educations.id))
    .leftJoin(occupations, eq(residents.occupationId, occupations.id))
    .leftJoin(maritalStatuses, eq(residents.maritalStatusId, maritalStatuses.id))
    .leftJoin(familyRelations, eq(residents.familyRelationId, familyRelations.id))
    .leftJoin(bloodTypes, eq(residents.bloodTypeId, bloodTypes.id))
    .leftJoin(citizenships, eq(residents.citizenshipId, citizenships.id))
    .where(and(eq(residents.id, id), eq(residents.villageId, villageId)))
    .limit(1);
  if (row.length === 0) return null;
  return row[0];
}

export async function nationalIdExists(
  villageId: number,
  nationalId: string,
  excludeId: number | null,
): Promise<boolean> {
  const filters: SQL[] = [eq(residents.villageId, villageId), eq(residents.nationalId, nationalId)];
  if (excludeId !== null) {
    filters.push(ne(residents.id, excludeId));
  }
  const duplicates = await db
    .select({ id: residents.id })
    .from(residents)
    .where(and(...filters))
    .limit(1);
  return duplicates.length > 0;
}

export async function headOfFamilyExists(
  villageId: number,
  familyId: number,
  excludeId: number | null,
): Promise<boolean> {
  const filters: SQL[] = [
    eq(residents.villageId, villageId),
    eq(residents.familyId, familyId),
    eq(residents.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
  ];
  if (excludeId !== null) {
    filters.push(ne(residents.id, excludeId));
  }
  const rows = await db
    .select({ id: residents.id })
    .from(residents)
    .where(and(...filters))
    .limit(1);
  return rows.length > 0;
}

export interface PendudukOption {
  id: number;
  name: string;
  nationalId: string | null;
}

export async function listPendudukOptions(villageId: number): Promise<PendudukOption[]> {
  return db
    .select({ id: residents.id, name: residents.name, nationalId: residents.nationalId })
    .from(residents)
    .where(eq(residents.villageId, villageId))
    .orderBy(asc(residents.name), asc(residents.id));
}

export async function findPendudukOptionByNik(
  villageId: number,
  nationalId: string,
): Promise<PendudukOption | null> {
  const [row] = await db
    .select({ id: residents.id, name: residents.name, nationalId: residents.nationalId })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), eq(residents.nationalId, nationalId)))
    .limit(1);
  return row ?? null;
}

export interface PendudukSuratData extends PendudukDTO {
  religionName: string | null;
  occupationName: string | null;
  familyNumber: string | null;
}

export async function getPendudukSuratData(
  villageId: number,
  id: number,
): Promise<PendudukSuratData | null> {
  const [row] = await db
    .select({
      resident: residents,
      religionName: religions.name,
      occupationName: occupations.name,
      familyNumber: families.number,
    })
    .from(residents)
    .leftJoin(religions, eq(residents.religionId, religions.id))
    .leftJoin(occupations, eq(residents.occupationId, occupations.id))
    .leftJoin(families, and(eq(residents.familyId, families.id), eq(families.villageId, villageId)))
    .where(and(eq(residents.villageId, villageId), eq(residents.id, id)))
    .limit(1);
  if (!row) return null;
  return {
    ...toDto(row.resident),
    religionName: row.religionName ?? null,
    occupationName: row.occupationName ?? null,
    familyNumber: row.familyNumber ?? null,
  };
}

export interface AnggotaKeluargaSuratRow {
  id: number;
  nationalId: string | null;
  name: string;
  gender: PendudukDTO["gender"];
  birthPlace: string | null;
  birthDate: string | null;
  religionName: string | null;
  educationName: string | null;
  educationSedangName: string | null;
  occupationName: string | null;
  maritalStatusName: string | null;
  familyRelationName: string | null;
  citizenshipName: string | null;
  bloodTypeName: string | null;
  address: string | null;
  fatherName: string | null;
  motherName: string | null;
  fatherNationalId: string | null;
  motherNationalId: string | null;
}

export async function listAnggotaKeluargaSurat(
  villageId: number,
  familyId: number,
): Promise<AnggotaKeluargaSuratRow[]> {
  const educationsSedang = alias(educations, "educations_sedang");
  const rows = await db
    .select({
      id: residents.id,
      nationalId: residents.nationalId,
      name: residents.name,
      gender: residents.gender,
      birthPlace: residents.birthPlace,
      birthDate: residents.birthDate,
      religionName: religions.name,
      educationName: educations.name,
      educationSedangName: educationsSedang.name,
      occupationName: occupations.name,
      maritalStatusName: maritalStatuses.name,
      familyRelationName: familyRelations.name,
      citizenshipName: citizenships.name,
      bloodTypeName: bloodTypes.name,
      address: residents.address,
      fatherName: residents.fatherName,
      motherName: residents.motherName,
      fatherNationalId: residents.fatherNationalId,
      motherNationalId: residents.motherNationalId,
    })
    .from(residents)
    .leftJoin(religions, eq(residents.religionId, religions.id))
    .leftJoin(educations, eq(residents.educationId, educations.id))
    .leftJoin(educationsSedang, eq(residents.educationSedangId, educationsSedang.id))
    .leftJoin(occupations, eq(residents.occupationId, occupations.id))
    .leftJoin(maritalStatuses, eq(residents.maritalStatusId, maritalStatuses.id))
    .leftJoin(familyRelations, eq(residents.familyRelationId, familyRelations.id))
    .leftJoin(citizenships, eq(residents.citizenshipId, citizenships.id))
    .leftJoin(bloodTypes, eq(residents.bloodTypeId, bloodTypes.id))
    .where(
      and(
        eq(residents.villageId, villageId),
        eq(residents.familyId, familyId),
        eq(residents.lifeStatus, "alive"),
      ),
    )
    .orderBy(asc(residents.familyRelationId), asc(residents.birthDate));
  return rows.map((row) => ({ ...row, gender: row.gender as PendudukDTO["gender"] }));
}

export async function listPendudukSuratByIds(
  villageId: number,
  ids: readonly number[],
): Promise<AnggotaKeluargaSuratRow[]> {
  if (ids.length === 0) return [];
  const educationsSedang = alias(educations, "educations_sedang");
  const idsDiminta = ids.slice(0, 10);

  // Satu query untuk maksimal 10 pengikut; sebelumnya satu query per ID.
  const hasil = await db
    .select({
      id: residents.id,
      nationalId: residents.nationalId,
      name: residents.name,
      gender: residents.gender,
      birthPlace: residents.birthPlace,
      birthDate: residents.birthDate,
      religionName: religions.name,
      educationName: educations.name,
      educationSedangName: educationsSedang.name,
      occupationName: occupations.name,
      maritalStatusName: maritalStatuses.name,
      familyRelationName: familyRelations.name,
      citizenshipName: citizenships.name,
      bloodTypeName: bloodTypes.name,
      address: residents.address,
      fatherName: residents.fatherName,
      motherName: residents.motherName,
      fatherNationalId: residents.fatherNationalId,
      motherNationalId: residents.motherNationalId,
    })
    .from(residents)
    .leftJoin(religions, eq(residents.religionId, religions.id))
    .leftJoin(educations, eq(residents.educationId, educations.id))
    .leftJoin(educationsSedang, eq(residents.educationSedangId, educationsSedang.id))
    .leftJoin(occupations, eq(residents.occupationId, occupations.id))
    .leftJoin(maritalStatuses, eq(residents.maritalStatusId, maritalStatuses.id))
    .leftJoin(familyRelations, eq(residents.familyRelationId, familyRelations.id))
    .leftJoin(citizenships, eq(residents.citizenshipId, citizenships.id))
    .leftJoin(bloodTypes, eq(residents.bloodTypeId, bloodTypes.id))
    .where(
      and(eq(residents.villageId, villageId), inArray(residents.id, [...new Set(idsDiminta)])),
    );

  const perId = new Map(hasil.map((row) => [row.id, row as AnggotaKeluargaSuratRow]));
  return idsDiminta.flatMap((id) => {
    const row = perId.get(id);
    return row ? [row] : [];
  });
}

export async function updatePenduduk(
  villageId: number,
  id: number,
  input: PendudukFormInput,
): Promise<void> {
  await db
    .update(residents)
    .set({
      nationalId: input.nationalId,
      familyId: input.familyId,
      name: input.name,
      gender: input.gender,
      birthPlace: blankToNull(input.birthPlace),
      birthDate: input.birthDate,
      religionId: input.religionId,
      educationId: input.educationId,
      educationSedangId: input.educationSedangId,
      occupationId: input.occupationId,
      maritalStatusId: input.maritalStatusId,
      familyRelationId: input.familyRelationId,
      bloodTypeId: input.bloodTypeId,
      citizenshipId: input.citizenshipId,
      residenceStatus: input.residenceStatus,
      lifeStatus: input.lifeStatus,
      regionId: input.regionId,
      address: blankToNull(input.address),
      phone: blankToNull(input.phone),
      fatherName: blankToNull(input.fatherName),
      motherName: blankToNull(input.motherName),
      fatherNationalId: input.fatherNationalId,
      motherNationalId: input.motherNationalId,
      birthCertificateNumber: blankToNull(input.birthCertificateNumber),
      marriageCertificateNumber: blankToNull(input.marriageCertificateNumber),
      marriageDate: input.marriageDate,
      divorceCertificateNumber: blankToNull(input.divorceCertificateNumber),
      divorceDate: input.divorceDate,
      passportNumber: blankToNull(input.passportNumber),
      passportExpiryDate: input.passportExpiryDate,
      kitasNumber: blankToNull(input.kitasNumber),
      ethnicity: blankToNull(input.ethnicity),
      ktpEl: input.ktpEl,
      statusRekam: input.statusRekam,
      idCardTag: blankToNull(input.idCardTag),
      ktpIssuedPlace: blankToNull(input.ktpIssuedPlace),
      ktpIssuedDate: input.ktpIssuedDate,
      previousFamilyNumber: blankToNull(input.previousFamilyNumber),
      arrivalPurpose: blankToNull(input.arrivalPurpose),
      birthTime: blankToNull(input.birthTime),
      birthPlaceType: input.birthPlaceType,
      birthType: input.birthType,
      birthChildNumber: input.birthChildNumber,
      birthAssistant: input.birthAssistant,
      birthWeightGram: input.birthWeightGram,
      birthLengthCm: input.birthLengthCm,
      migrantWorker: blankToNull(input.migrantWorker),
      originCountry: blankToNull(input.originCountry),
      adat: blankToNull(input.adat),
      marga: blankToNull(input.marga),
      previousAddress: blankToNull(input.previousAddress),
      currentAddress: blankToNull(input.currentAddress),
      latitude: blankToNull(input.latitude),
      longitude: blankToNull(input.longitude),
      email: blankToNull(input.email),
      telegram: blankToNull(input.telegram),
      contactMethod: input.contactMethod,
      disability: input.disability,
      chronicIllness: input.chronicIllness,
      kbMethod: input.kbMethod,
      pregnancyStatus: input.pregnancyStatus,
      insurance: input.insurance,
      insuranceNumber: blankToNull(input.insuranceNumber),
      insuranceStatus: input.insuranceStatus,
      bpjsEmploymentNumber: blankToNull(input.bpjsEmploymentNumber),
      literacy: input.literacy,
      notes: blankToNull(input.notes),
    })
    .where(and(eq(residents.id, id), eq(residents.villageId, villageId)));
}

/**
 * Hapus penduduk.
 *
 * Referensi yang boleh kosong dilepas di dalam transaksi sebelum baris dihapus.
 * `suplemen_terdata` memakai FK `RESTRICT` pada composite key, jadi pelepasan
 * harus eksplisit di sini. Sebaliknya `dtks_anggota` sengaja tetap `RESTRICT`:
 * penduduk yang tercatat sebagai anggota DTKS harus dikeluarkan dari DTKS dulu.
 *
 * Composite FK `RESTRICT` juga melindungi `kontak`, `lapak`, `notifikasi_terkirim`,
 * `pendapat`, `family_member_logs`, dan `users` dari penghapusan saat direferensikan.
 * Karena `village_id` child `NOT NULL`, efek bisnis `SET NULL` dilakukan dengan
 * mengosongkan `resident_id` lebih dulu di transaksi yang sama.
 */
export async function deletePenduduk(villageId: number, id: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(letters)
      .set({ residentId: null })
      .where(and(eq(letters.villageId, villageId), eq(letters.residentId, id)));
    await tx
      .update(residentMutations)
      .set({ residentId: null })
      .where(and(eq(residentMutations.villageId, villageId), eq(residentMutations.residentId, id)));
    await tx
      .update(suplemenTerdata)
      .set({ pendudukId: null })
      .where(and(eq(suplemenTerdata.villageId, villageId), eq(suplemenTerdata.pendudukId, id)));
    await tx
      .update(kontak)
      .set({ residentId: null })
      .where(and(eq(kontak.villageId, villageId), eq(kontak.residentId, id)));
    await tx
      .update(lapak)
      .set({ residentId: null })
      .where(and(eq(lapak.villageId, villageId), eq(lapak.residentId, id)));
    await tx
      .update(notifikasiTerkirim)
      .set({ residentId: null })
      .where(
        and(eq(notifikasiTerkirim.villageId, villageId), eq(notifikasiTerkirim.residentId, id)),
      );
    await tx
      .update(pendapat)
      .set({ residentId: null })
      .where(and(eq(pendapat.villageId, villageId), eq(pendapat.residentId, id)));
    await tx
      .update(familyMemberLogs)
      .set({ residentId: null })
      .where(and(eq(familyMemberLogs.villageId, villageId), eq(familyMemberLogs.residentId, id)));
    // Dibuat tanpa filter desa: akun platform memiliki `village_id NULL` dan
    // tidak diperiksa composite FK, jadi pelepasan harus mencakup baris itu
    // agar tidak menyisakan `resident_id` yatim.
    await tx.update(users).set({ residentId: null }).where(eq(users.residentId, id));
    await tx.delete(residents).where(and(eq(residents.villageId, villageId), eq(residents.id, id)));
  });
}
