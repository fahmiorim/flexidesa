import "server-only";

import {
  aliasedTable,
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  like,
  ne,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  bantuanPeserta,
  bantuanProgram,
  bloodTypes,
  citizenships,
  dtks,
  educations,
  families,
  familyMemberLogs,
  familyRelations,
  maritalStatuses,
  occupations,
  regions,
  religions,
  residents,
  rumahTangga,
  suplemenTerdata,
  users,
  villages,
} from "@/db/schema";
import { formatWilayahLabel } from "@/features/info-desa/wilayah/domain/wilayah";
import {
  HEAD_OF_FAMILY_RELATION_ID,
  isTemporaryFamilyNumber,
  type KeluargaAnggotaLog,
  type KeluargaAnggotaRow,
  type KeluargaDTO,
  type KeluargaFormInput,
  type KeluargaHeadCandidate,
  type KeluargaListRow,
  type KeluargaMember,
  type KeluargaMemberDetail,
  type KeluargaRingkasan,
  type KeluargaStatusFilter,
  type PerubahanAnggota,
} from "@/features/kependudukan/keluarga/domain/keluarga";
import type { Gender } from "@/features/kependudukan/penduduk/domain/penduduk";
import { SASARAN_KELUARGA } from "@/features/program-data-desa/bantuan/domain/bantuan";
import { validationError } from "@/lib/errors";

/** Alias `residents` untuk mencari anggota yang berperan sebagai kepala keluarga. */
const head = aliasedTable(residents, "head");

export interface ListKeluargaParams {
  villageId: number;
  search: string;
  status: KeluargaStatusFilter;
  gender: Gender | "all";
  regionId: number | null;
  temporaryOnly: boolean;
  programId: number | null;
  numbers: string[];
  page: number;
  pageSize: number;
}

export interface KeluargaListResult {
  rows: KeluargaListRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** Ubah teks kosong menjadi `NULL` agar basis data tidak menyimpan string kosong. */
function blankToNull(value: string): string | null {
  return value === "" ? null : value;
}

/** Petakan baris `families` → DTO domain (kosakata Indonesia). */
function toDto(row: typeof families.$inferSelect): KeluargaDTO {
  return {
    id: row.id,
    number: row.number,
    temporary: isTemporaryFamilyNumber(row.number),
    address: row.address,
    regionId: row.regionId,
    welfareClass: row.welfareClass,
    cardPrintedAt: row.cardPrintedAt,
    registeredAt: row.createdAt.toISOString(),
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

function buildWhere(params: {
  villageId: number;
  search: string;
  status: KeluargaStatusFilter;
  gender: Gender | "all";
  regionId: number | null;
  temporaryOnly: boolean;
  programId: number | null;
  numbers: string[];
}): SQL {
  const villageFilter = eq(families.villageId, params.villageId);
  const filters: SQL[] = [villageFilter];

  if (params.search) {
    const term = `%${params.search}%`;
    const searchFilter = or(
      like(families.number, term),
      like(families.address, term),
      like(head.name, term),
      like(head.nationalId, term),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  if (params.status === "active") filters.push(eq(head.lifeStatus, "alive"));
  if (params.status === "inactive") {
    const inactive = and(isNotNull(head.id), ne(head.lifeStatus, "alive"));
    if (inactive) filters.push(inactive);
  }
  if (params.status === "empty") filters.push(isNull(head.id));
  if (params.gender !== "all") filters.push(eq(head.gender, params.gender));
  if (params.regionId !== null) filters.push(eq(families.regionId, params.regionId));
  if (params.temporaryOnly) filters.push(like(families.number, "0%"));
  if (params.numbers.length > 0) filters.push(inArray(families.number, params.numbers));
  if (params.programId !== null) {
    filters.push(
      exists(
        db
          .select({ id: bantuanPeserta.id })
          .from(bantuanPeserta)
          .where(
            and(
              eq(bantuanPeserta.villageId, params.villageId),
              eq(bantuanPeserta.programId, params.programId),
              eq(bantuanPeserta.familyId, families.id),
            ),
          ),
      ),
    );
  }

  return and(...filters) ?? villageFilter;
}

export async function listKeluarga(params: ListKeluargaParams): Promise<KeluargaListResult> {
  const { villageId, page, pageSize } = params;
  const where = buildWhere(params);
  const headJoin = and(
    eq(head.familyId, families.id),
    eq(head.villageId, villageId),
    eq(head.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
  );

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        family: families,
        headName: head.name,
        headNationalId: head.nationalId,
        headGender: head.gender,
        headIdCardTag: head.idCardTag,
        headLifeStatus: head.lifeStatus,
        dusun: regions.dusun,
        rw: regions.rw,
        rt: regions.rt,
      })
      .from(families)
      .leftJoin(head, headJoin)
      .leftJoin(regions, and(eq(families.regionId, regions.id), eq(regions.villageId, villageId)))
      .where(where)
      .orderBy(asc(families.number), asc(families.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: countDistinct(families.id) })
      .from(families)
      .leftJoin(head, headJoin)
      .where(where),
  ]);

  const total = totalRows[0]?.value ?? 0;

  // Hitungan anggota diambil lewat query agregat, bukan subquery berkorelasi:
  // Drizzle merender kolom subquery tanpa kualifikasi tabel sehingga `id`
  // menunjuk `residents.id`, bukan `families.id`.
  const familyIds = rows.map((row) => row.family.id);
  const anggotaRows =
    familyIds.length === 0
      ? []
      : await db
          .select({ familyId: residents.familyId, jumlah: count() })
          .from(residents)
          .where(
            and(
              inArray(residents.familyId, familyIds),
              eq(residents.villageId, villageId),
              eq(residents.lifeStatus, "alive"),
            ),
          )
          .groupBy(residents.familyId);
  const anggotaByFamily = new Map(
    anggotaRows.map((row) => [row.familyId, Number(row.jumlah ?? 0)]),
  );

  return {
    rows: rows.map((row) => ({
      ...toDto(row.family),
      headName: row.headName ?? null,
      headNationalId: row.headNationalId ?? null,
      headGender: row.headGender ?? null,
      headIdCardTag: row.headIdCardTag ?? null,
      headLifeStatus: row.headLifeStatus ?? null,
      memberCount: anggotaByFamily.get(row.family.id) ?? 0,
      regionLabel: formatRegionLabel(row.family.regionId, row.dusun, row.rw, row.rt),
      dusun: row.dusun ?? null,
      rw: row.rw ?? null,
      rt: row.rt ?? null,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Ringkasan KK dan anggota hidup untuk kartu statistik halaman daftar. */
export async function getKeluargaRingkasan(villageId: number): Promise<KeluargaRingkasan> {
  const headJoin = and(
    eq(head.familyId, families.id),
    eq(head.villageId, villageId),
    eq(head.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
    eq(head.lifeStatus, "alive"),
  );

  const [totalRows, activeRows, temporaryRows, memberRows] = await Promise.all([
    db.select({ value: count() }).from(families).where(eq(families.villageId, villageId)),
    db
      .select({ value: countDistinct(families.id) })
      .from(families)
      .innerJoin(head, headJoin)
      .where(eq(families.villageId, villageId)),
    db
      .select({ value: count() })
      .from(families)
      .where(and(eq(families.villageId, villageId), like(families.number, "0%"))),
    db
      .select({ value: count() })
      .from(residents)
      .innerJoin(
        families,
        and(eq(families.id, residents.familyId), eq(families.villageId, villageId)),
      )
      .where(and(eq(residents.villageId, villageId), eq(residents.lifeStatus, "alive"))),
  ]);

  return {
    total: totalRows[0]?.value ?? 0,
    active: activeRows[0]?.value ?? 0,
    temporary: temporaryRows[0]?.value ?? 0,
    members: memberRows[0]?.value ?? 0,
  };
}

export async function findKeluargaById(villageId: number, id: number): Promise<KeluargaDTO | null> {
  const [row] = await db
    .select()
    .from(families)
    .where(and(eq(families.villageId, villageId), eq(families.id, id)))
    .limit(1);

  return row ? toDto(row) : null;
}

/** Apakah nomor KK sudah dipakai keluarga lain di desa yang sama. */
export async function keluargaNumberExists(
  villageId: number,
  number: string,
  excludeId: number | null,
): Promise<boolean> {
  const filters: SQL[] = [eq(families.villageId, villageId), eq(families.number, number)];

  if (excludeId !== null) {
    filters.push(ne(families.id, excludeId));
  }

  const duplicates = await db
    .select({ id: families.id })
    .from(families)
    .where(and(...filters))
    .limit(1);

  return duplicates.length > 0;
}

/** Anggota sebuah KK, terurut dengan kepala keluarga di depan. */
export async function listKeluargaMembers(
  villageId: number,
  familyId: number,
): Promise<KeluargaMember[]> {
  const rows = await db
    .select({
      id: residents.id,
      name: residents.name,
      nationalId: residents.nationalId,
      gender: residents.gender,
      birthDate: residents.birthDate,
      relationName: familyRelations.name,
      familyRelationId: residents.familyRelationId,
    })
    .from(residents)
    .innerJoin(
      families,
      and(eq(families.id, residents.familyId), eq(families.villageId, villageId)),
    )
    .leftJoin(familyRelations, eq(residents.familyRelationId, familyRelations.id))
    .where(and(eq(residents.villageId, villageId), eq(residents.familyId, familyId)))
    .orderBy(asc(residents.name), asc(residents.id));

  return rows
    .sort((a, b) => {
      const aHead = a.familyRelationId === HEAD_OF_FAMILY_RELATION_ID ? 0 : 1;
      const bHead = b.familyRelationId === HEAD_OF_FAMILY_RELATION_ID ? 0 : 1;
      return aHead - bHead;
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      nationalId: row.nationalId,
      gender: row.gender,
      birthDate: row.birthDate,
      relationName: row.relationName ?? null,
    }));
}

/**
 * Anggota sebuah KK dengan data lengkap untuk cetak Kartu Keluarga.
 *
 * Hanya penduduk berstatus hidup yang dicetak. Seluruh kolom referensi diambil
 * sebagai nama (bukan id) agar lapisan PDF tinggal menulis teksnya.
 */
export async function listKeluargaMemberDetails(
  villageId: number,
  familyId: number,
): Promise<KeluargaMemberDetail[]> {
  const rows = await db
    .select({
      id: residents.id,
      name: residents.name,
      nationalId: residents.nationalId,
      gender: residents.gender,
      birthPlace: residents.birthPlace,
      birthDate: residents.birthDate,
      relationName: familyRelations.name,
      familyRelationId: residents.familyRelationId,
      religionName: religions.name,
      educationName: educations.name,
      occupationName: occupations.name,
      maritalStatusName: maritalStatuses.name,
      bloodTypeName: bloodTypes.name,
      citizenshipName: citizenships.name,
      passportNumber: residents.passportNumber,
      kitasNumber: residents.kitasNumber,
      marriageDate: residents.marriageDate,
      divorceDate: residents.divorceDate,
      fatherName: residents.fatherName,
      motherName: residents.motherName,
      rtmNumber: rumahTangga.number,
    })
    .from(residents)
    .innerJoin(
      families,
      and(eq(families.id, residents.familyId), eq(families.villageId, villageId)),
    )
    .leftJoin(familyRelations, eq(residents.familyRelationId, familyRelations.id))
    .leftJoin(religions, eq(residents.religionId, religions.id))
    .leftJoin(educations, eq(residents.educationId, educations.id))
    .leftJoin(occupations, eq(residents.occupationId, occupations.id))
    .leftJoin(maritalStatuses, eq(residents.maritalStatusId, maritalStatuses.id))
    .leftJoin(bloodTypes, eq(residents.bloodTypeId, bloodTypes.id))
    .leftJoin(citizenships, eq(residents.citizenshipId, citizenships.id))
    .leftJoin(
      rumahTangga,
      and(eq(rumahTangga.id, residents.rtmId), eq(rumahTangga.villageId, villageId)),
    )
    .where(
      and(
        eq(residents.villageId, villageId),
        eq(residents.familyId, familyId),
        eq(residents.lifeStatus, "alive"),
      ),
    );

  return rows
    .sort((a, b) => {
      const aHead = a.familyRelationId === HEAD_OF_FAMILY_RELATION_ID ? 0 : 1;
      const bHead = b.familyRelationId === HEAD_OF_FAMILY_RELATION_ID ? 0 : 1;
      return aHead - bHead || a.name.localeCompare(b.name, "id") || a.id - b.id;
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      nationalId: row.nationalId,
      gender: row.gender,
      birthDate: row.birthDate,
      relationName: row.relationName ?? null,
      birthPlace: row.birthPlace,
      religionName: row.religionName,
      educationName: row.educationName,
      occupationName: row.occupationName,
      maritalStatusName: row.maritalStatusName,
      bloodTypeName: row.bloodTypeName,
      citizenshipName: row.citizenshipName,
      passportNumber: row.passportNumber,
      kitasNumber: row.kitasNumber,
      marriageDate: row.marriageDate,
      divorceDate: row.divorceDate,
      fatherName: row.fatherName,
      motherName: row.motherName,
      rtmNumber: row.rtmNumber ?? null,
    }));
}

/**
 * Pastikan wilayah yang dipilih benar-benar milik desa pemanggil.
 *
 * Composite foreign key sudah mencegah relasi lintas desa pada database baru,
 * tetapi baris lama dan database yang belum menjalankan migration tetap perlu
 * ditolak di layer aplikasi agar kesalahan tidak bocor sebagai error SQL.
 */
export async function validateKeluargaRegion(
  villageId: number,
  regionId: number | null,
): Promise<void> {
  if (regionId === null) return;

  const [region] = await db
    .select({ id: regions.id })
    .from(regions)
    .where(and(eq(regions.id, regionId), eq(regions.villageId, villageId)))
    .limit(1);

  if (!region) {
    throw validationError("Wilayah tidak valid untuk desa ini.");
  }
}

/** Program bantuan bersasaran keluarga untuk filter daftar KK. */
export async function listBantuanKeluargaOptions(
  villageId: number,
): Promise<{ id: number; name: string }[]> {
  return db
    .select({ id: bantuanProgram.id, name: bantuanProgram.name })
    .from(bantuanProgram)
    .where(
      and(eq(bantuanProgram.villageId, villageId), eq(bantuanProgram.sasaran, SASARAN_KELUARGA)),
    )
    .orderBy(asc(bantuanProgram.name), asc(bantuanProgram.id));
}

/**
 * Nomor KK sementara berikutnya: `0` + kode desa 10 digit + urutan 5 digit.
 * Format ini sama dengan OpenSID dan tetap 16 angka sehingga index unik berlaku.
 */
export async function nextTemporaryKeluargaNumber(villageId: number): Promise<string> {
  const [village] = await db
    .select({ code: villages.code })
    .from(villages)
    .where(eq(villages.id, villageId))
    .limit(1);

  const kodeDesa = (village?.code ?? "").replace(/\D/g, "").padStart(10, "0").slice(-10);
  const prefix = `0${kodeDesa}`;
  const [terakhir] = await db
    .select({ number: families.number })
    .from(families)
    .where(and(eq(families.villageId, villageId), like(families.number, `${prefix}%`)))
    .orderBy(desc(families.number))
    .limit(1);

  const urutan = terakhir ? Number(terakhir.number.slice(-5)) + 1 : 1;
  if (!Number.isSafeInteger(urutan) || urutan > 99_999) {
    throw validationError("Nomor KK sementara sudah habis. Ajukan nomor KK permanen.");
  }

  return `${prefix}${String(urutan).padStart(5, "0")}`;
}

/** Penduduk hidup yang belum punya KK dan dapat menjadi kepala keluarga. */
export async function listKeluargaHeadCandidates(
  villageId: number,
): Promise<KeluargaHeadCandidate[]> {
  return db
    .select({
      id: residents.id,
      name: residents.name,
      nationalId: residents.nationalId,
      address: residents.address,
      regionId: residents.regionId,
    })
    .from(residents)
    .where(
      and(
        eq(residents.villageId, villageId),
        eq(residents.lifeStatus, "alive"),
        isNull(residents.familyId),
        or(
          isNull(residents.familyRelationId),
          eq(residents.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
        ),
      ),
    )
    .orderBy(asc(residents.name), asc(residents.id));
}

/** Cari penduduk lepas yang dipilih sebagai kepala keluarga. */
export async function findKeluargaHeadCandidate(
  villageId: number,
  residentId: number,
): Promise<KeluargaHeadCandidate | null> {
  const [row] = await db
    .select({
      id: residents.id,
      name: residents.name,
      nationalId: residents.nationalId,
      address: residents.address,
      regionId: residents.regionId,
    })
    .from(residents)
    .where(
      and(
        eq(residents.villageId, villageId),
        eq(residents.id, residentId),
        eq(residents.lifeStatus, "alive"),
        isNull(residents.familyId),
        or(
          isNull(residents.familyRelationId),
          eq(residents.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
        ),
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * Simpan KK baru; bila kepala keluarga dipilih, hubungkan penduduk dan catat
 * riwayat keanggotaan dalam transaksi yang sama. Ini meniru alur OpenSID
 * "Tambah KK dari penduduk sudah ada" agar tidak ada KK tanpa kepala keluarga
 * akibat kegagalan di tengah proses.
 */
export async function insertKeluarga(
  villageId: number,
  input: KeluargaFormInput,
  options?: { head: KeluargaHeadCandidate; actorId: string | null },
): Promise<number> {
  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(families)
      .values({
        villageId,
        number: input.number,
        address: blankToNull(input.address),
        regionId: input.regionId,
        welfareClass: input.welfareClass,
        cardPrintedAt: input.cardPrintedAt,
      })
      .$returningId();

    if (!inserted) throw new Error("Gagal menyimpan data keluarga.");

    if (options) {
      const [assignment] = await tx
        .update(residents)
        .set({
          familyId: inserted.id,
          familyRelationId: HEAD_OF_FAMILY_RELATION_ID,
        })
        .where(
          and(
            eq(residents.villageId, villageId),
            eq(residents.id, options.head.id),
            isNull(residents.familyId),
          ),
        );

      if (assignment.affectedRows === 0) {
        throw validationError("Penduduk yang dipilih sudah menjadi anggota keluarga lain.");
      }

      await tx.insert(familyMemberLogs).values({
        villageId,
        familyId: inserted.id,
        residentId: options.head.id,
        residentName: options.head.name,
        aksi: "added",
        relationId: HEAD_OF_FAMILY_RELATION_ID,
        relationName: "KEPALA KELUARGA",
        actorId: options.actorId,
      });
    }

    return inserted.id;
  });
}

/** Pindahkan KK dan seluruh anggotanya ke wilayah lain. */
export async function pindahWilayahKeluarga(
  villageId: number,
  ids: readonly number[],
  regionId: number,
): Promise<number> {
  if (ids.length === 0) return 0;

  return db.transaction(async (tx) => {
    const [hasil] = await tx
      .update(families)
      .set({ regionId })
      .where(and(eq(families.villageId, villageId), inArray(families.id, ids)));

    await tx
      .update(residents)
      .set({ regionId })
      .where(and(eq(residents.villageId, villageId), inArray(residents.familyId, ids)));

    return hasil.affectedRows;
  });
}

/**
 * Pecah KK: buat KK baru dari seluruh anggota yang masih hidup, lalu jadikan
 * salah satunya kepala keluarga. KK lama tetap menyimpan riwayat anggota yang
 * sudah meninggal/pindah, sesuai perilaku OpenSID.
 */
export async function pecahKeluarga(
  villageId: number,
  oldFamilyId: number,
  nomorBaru: string,
  newHeadResidentId: number,
  actorId: string | null,
): Promise<number> {
  return db.transaction(async (tx) => {
    const [lama] = await tx
      .select()
      .from(families)
      .where(and(eq(families.villageId, villageId), eq(families.id, oldFamilyId)))
      .limit(1);
    if (!lama) throw validationError("Kartu Keluarga lama tidak ditemukan.");

    const [kepalaLama] = await tx
      .select({ id: residents.id, lifeStatus: residents.lifeStatus })
      .from(residents)
      .where(
        and(
          eq(residents.villageId, villageId),
          eq(residents.familyId, oldFamilyId),
          eq(residents.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
        ),
      )
      .limit(1);
    if (kepalaLama?.lifeStatus === "alive") {
      throw validationError("Pecah KK hanya tersedia bila kepala keluarga lama tidak hidup.");
    }

    const anggota = await tx
      .select({ id: residents.id, name: residents.name, relationId: residents.familyRelationId })
      .from(residents)
      .where(
        and(
          eq(residents.villageId, villageId),
          eq(residents.familyId, oldFamilyId),
          eq(residents.lifeStatus, "alive"),
        ),
      );

    if (!anggota.some((row) => row.id === newHeadResidentId)) {
      throw validationError("Kepala keluarga baru harus anggota hidup dari KK lama.");
    }

    const [baru] = await tx
      .insert(families)
      .values({
        villageId,
        number: nomorBaru,
        address: lama.address,
        regionId: lama.regionId,
        welfareClass: lama.welfareClass,
        cardPrintedAt: null,
      })
      .$returningId();
    if (!baru) throw new Error("Gagal membuat Kartu Keluarga baru.");

    for (const orang of anggota) {
      await tx
        .update(residents)
        .set({
          familyId: baru.id,
          familyRelationId:
            orang.id === newHeadResidentId ? HEAD_OF_FAMILY_RELATION_ID : orang.relationId,
        })
        .where(and(eq(residents.villageId, villageId), eq(residents.id, orang.id)));
    }

    await tx.insert(familyMemberLogs).values(
      anggota.flatMap((orang) => [
        {
          villageId,
          familyId: oldFamilyId,
          residentId: orang.id,
          residentName: orang.name,
          aksi: "removed" as const,
          relationId: null,
          relationName: null,
          actorId,
        },
        {
          villageId,
          familyId: baru.id,
          residentId: orang.id,
          residentName: orang.name,
          aksi: "added" as const,
          relationId:
            orang.id === newHeadResidentId ? HEAD_OF_FAMILY_RELATION_ID : orang.relationId,
          relationName: orang.id === newHeadResidentId ? "KEPALA KELUARGA" : null,
          actorId,
        },
      ]),
    );

    return baru.id;
  });
}

export async function updateKeluarga(
  villageId: number,
  id: number,
  input: KeluargaFormInput,
): Promise<void> {
  await db
    .update(families)
    .set({
      number: input.number,
      address: blankToNull(input.address),
      regionId: input.regionId,
      welfareClass: input.welfareClass,
      cardPrintedAt: input.cardPrintedAt,
    })
    .where(and(eq(families.villageId, villageId), eq(families.id, id)));
}

/**
 * Hapus KK.
 *
 * Referensi penduduk, DTKS, Suplemen, dan riwayat anggota dilepas dalam
 * transaksi sebelum KK dihapus agar `village_id` tetap terjaga pada composite
 * foreign key. Semuanya memakai FK `RESTRICT` (bukan `SET NULL`) karena
 * composite FK menyertakan `village_id NOT NULL`; `SET NULL` akan ikut
 * mengosongkan kolom desa.
 */
export async function deleteKeluarga(villageId: number, id: number): Promise<void> {
  await deleteKeluargaBanyak(villageId, [id]);
}

/**
 * Hapus beberapa KK kosong sekaligus.
 *
 * KK yang masih memiliki anggota tidak dihapus agar riwayat kependudukan tidak
 * hilang. Hasil mengembalikan nomor KK yang dilewati supaya UI dapat menjelaskan
 * mengapa jumlah yang terhapus lebih kecil dari pilihan pengguna.
 */
export async function deleteKeluargaBanyak(
  villageId: number,
  ids: readonly number[],
): Promise<{ dihapus: number; dilewati: string[] }> {
  const unik = [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0);
  if (unik.length === 0) return { dihapus: 0, dilewati: [] };

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({
        id: families.id,
        number: families.number,
        anggota: count(residents.id),
      })
      .from(families)
      .leftJoin(
        residents,
        and(eq(residents.familyId, families.id), eq(residents.villageId, villageId)),
      )
      .where(and(eq(families.villageId, villageId), inArray(families.id, unik)))
      .groupBy(families.id, families.number);

    const kosong = rows.filter((row) => Number(row.anggota) === 0);
    const idsKosong = kosong.map((row) => row.id);
    if (idsKosong.length === 0) {
      return { dihapus: 0, dilewati: rows.map((row) => row.number) };
    }

    await tx
      .update(familyMemberLogs)
      .set({ familyId: null })
      .where(
        and(
          eq(familyMemberLogs.villageId, villageId),
          inArray(familyMemberLogs.familyId, idsKosong),
        ),
      );
    await tx
      .update(dtks)
      .set({ keluargaId: null })
      .where(and(eq(dtks.villageId, villageId), inArray(dtks.keluargaId, idsKosong)));
    await tx
      .update(suplemenTerdata)
      .set({ keluargaId: null })
      .where(
        and(
          eq(suplemenTerdata.villageId, villageId),
          inArray(suplemenTerdata.keluargaId, idsKosong),
        ),
      );
    const [hasil] = await tx
      .delete(families)
      .where(and(eq(families.villageId, villageId), inArray(families.id, idsKosong)));

    return {
      dihapus: hasil?.affectedRows ?? 0,
      dilewati: rows.filter((row) => Number(row.anggota) > 0).map((row) => row.number),
    };
  });
}

// --- Riwayat perubahan anggota ---------------------------------------------

/**
 * Catat perubahan keanggotaan KK.
 *
 * Hanya dipanggil saat ada perubahan nyata (lihat `bedakanPerubahanAnggota`),
 * sehingga riwayat tidak dipenuhi baris kosong. Nama hubungan keluarga disimpan
 * sebagai snapshot agar riwayat tetap terbaca bila katalog berubah.
 */
export async function catatLogAnggotaKk(params: {
  villageId: number;
  residentId: number | null;
  residentName: string;
  perubahan: readonly PerubahanAnggota[];
  actorId: string | null;
}): Promise<void> {
  if (params.perubahan.length === 0) return;

  const relationIds = [
    ...new Set(
      params.perubahan.map((item) => item.relationId).filter((id): id is number => id !== null),
    ),
  ];

  const namaHubungan = new Map<number, string>();
  if (relationIds.length > 0) {
    const baris = await db
      .select({ id: familyRelations.id, name: familyRelations.name })
      .from(familyRelations)
      .where(inArray(familyRelations.id, relationIds));
    for (const baris1 of baris) namaHubungan.set(baris1.id, baris1.name);
  }

  await db.insert(familyMemberLogs).values(
    params.perubahan.map((item) => ({
      villageId: params.villageId,
      familyId: item.familyId,
      residentId: params.residentId,
      residentName: params.residentName,
      aksi: item.aksi,
      relationId: item.relationId,
      relationName: item.relationId === null ? null : (namaHubungan.get(item.relationId) ?? null),
      actorId: params.actorId,
    })),
  );
}

/** Identitas KK beserta label wilayah untuk halaman rincian. */
export async function findKeluargaDetail(
  villageId: number,
  id: number,
): Promise<{ keluarga: KeluargaDTO; regionLabel: string | null } | null> {
  const [row] = await db
    .select({
      family: families,
      dusun: regions.dusun,
      rw: regions.rw,
      rt: regions.rt,
    })
    .from(families)
    .leftJoin(regions, and(eq(families.regionId, regions.id), eq(regions.villageId, villageId)))
    .where(and(eq(families.villageId, villageId), eq(families.id, id)))
    .limit(1);

  if (!row) return null;

  return {
    keluarga: toDto(row.family),
    regionLabel: formatRegionLabel(row.family.regionId, row.dusun, row.rw, row.rt),
  };
}

/**
 * Seluruh anggota sebuah KK (termasuk yang sudah meninggal/pindah).
 *
 * Halaman rincian KK perlu menampilkan status kependudukan anggota, sedangkan
 * cetak KK hanya memuat penduduk hidup.
 */
export async function listKeluargaAnggotaRows(
  villageId: number,
  familyId: number,
): Promise<KeluargaAnggotaRow[]> {
  const rows = await db
    .select({
      id: residents.id,
      name: residents.name,
      nationalId: residents.nationalId,
      gender: residents.gender,
      birthDate: residents.birthDate,
      lifeStatus: residents.lifeStatus,
      relationId: residents.familyRelationId,
      relationName: familyRelations.name,
      rtmNumber: rumahTangga.number,
    })
    .from(residents)
    .innerJoin(
      families,
      and(eq(families.id, residents.familyId), eq(families.villageId, villageId)),
    )
    .leftJoin(familyRelations, eq(residents.familyRelationId, familyRelations.id))
    .leftJoin(
      rumahTangga,
      and(eq(rumahTangga.id, residents.rtmId), eq(rumahTangga.villageId, villageId)),
    )
    .where(and(eq(residents.villageId, villageId), eq(residents.familyId, familyId)))
    .orderBy(asc(residents.name), asc(residents.id));

  return rows
    .sort((a, b) => {
      const aHead = a.relationId === HEAD_OF_FAMILY_RELATION_ID ? 0 : 1;
      const bHead = b.relationId === HEAD_OF_FAMILY_RELATION_ID ? 0 : 1;
      return aHead - bHead;
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      nationalId: row.nationalId,
      gender: row.gender,
      birthDate: row.birthDate,
      lifeStatus: row.lifeStatus,
      relationId: row.relationId,
      relationName: row.relationName ?? null,
      rtmNumber: row.rtmNumber ?? null,
    }));
}

/** Riwayat perubahan anggota sebuah KK, terbaru lebih dahulu. */
export async function listLogAnggotaKk(
  villageId: number,
  familyId: number,
  limit = 100,
): Promise<KeluargaAnggotaLog[]> {
  const rows = await db
    .select({
      id: familyMemberLogs.id,
      createdAt: familyMemberLogs.createdAt,
      residentName: familyMemberLogs.residentName,
      aksi: familyMemberLogs.aksi,
      relationName: familyMemberLogs.relationName,
      actorName: users.name,
    })
    .from(familyMemberLogs)
    .innerJoin(
      families,
      and(eq(families.id, familyMemberLogs.familyId), eq(families.villageId, villageId)),
    )
    .leftJoin(
      users,
      and(
        eq(familyMemberLogs.actorId, users.id),
        or(eq(users.villageId, villageId), isNull(users.villageId)),
      ),
    )
    .where(and(eq(familyMemberLogs.villageId, villageId), eq(familyMemberLogs.familyId, familyId)))
    .orderBy(desc(familyMemberLogs.createdAt), desc(familyMemberLogs.id))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    residentName: row.residentName,
    aksi: row.aksi,
    relationName: row.relationName,
    actorName: row.actorName ?? null,
  }));
}
