import "server-only";

import { and, asc, count, eq, inArray, like, ne, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { dtks, families, regions, residents, rumahTangga } from "@/db/schema";
import { HEAD_OF_FAMILY_RELATION_ID } from "@/features/keluarga/domain/keluarga";
import {
  bangunNomorRtm,
  RTM_LEVEL_ANGGOTA,
  RTM_LEVEL_KEPALA,
  type RtmFilter,
  type RtmRekapInput,
  type RumahTanggaDTO,
  type RumahTanggaFormInput,
  type RumahTanggaListRow,
  type RumahTanggaMember,
} from "@/features/rumah-tangga/domain/rumah-tangga";
import { formatWilayahLabel } from "@/features/wilayah/domain/wilayah";
import { validationError } from "@/lib/errors";

export interface ListRumahTanggaParams {
  villageId: number;
  /** Filter lanjutan (pencarian, kelas sosial, wilayah, kepemilikan BDT). */
  filter: RtmFilter;
  page: number;
  pageSize: number;
}

export interface RumahTanggaListResult {
  rows: RumahTanggaListRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** Ubah teks kosong menjadi `NULL` agar basis data tidak menyimpan string kosong. */
function blankToNull(value: string): string | null {
  return value === "" ? null : value;
}

/** Petakan baris `rtm` → DTO domain (kosakata Indonesia). */
function toDto(row: typeof rumahTangga.$inferSelect): RumahTanggaDTO {
  return {
    id: row.id,
    number: row.number,
    address: row.address,
    regionId: row.regionId,
    kelasSosial: row.kelasSosial,
    bdt: row.bdt,
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
 * Bangun klausa WHERE daftar RTM.
 *
 * Penyaringan wilayah memakai kolom `regions`, jadi pemanggil wajib menyertakan
 * `leftJoin(regions, ...)` pada query-nya.
 */
function buildWhere(villageId: number, filter: RtmFilter): SQL {
  const villageFilter = eq(rumahTangga.villageId, villageId);
  const filters: SQL[] = [villageFilter];

  if (filter.search) {
    const term = `%${filter.search}%`;
    const searchFilter = or(
      like(rumahTangga.number, term),
      like(rumahTangga.address, term),
      like(rumahTangga.bdt, term),
      // Nama/NIK kepala rumah tangga juga dicari, seperti daftar RTM OpenSID.
      sql`exists (
        select 1 from ${residents}
        where ${residents.villageId} = ${villageId}
          and ${residents.rtmId} = ${rumahTangga.id}
          and ${residents.rtmLevel} = ${RTM_LEVEL_KEPALA}
          and (${residents.name} like ${term} or ${residents.nationalId} like ${term})
      )`,
    );
    if (searchFilter) filters.push(searchFilter);
  }

  if (filter.kelasSosial !== null) filters.push(eq(rumahTangga.kelasSosial, filter.kelasSosial));
  if (filter.dusun) filters.push(eq(regions.dusun, filter.dusun));
  if (filter.rw) filters.push(eq(regions.rw, filter.rw));
  if (filter.rt) filters.push(eq(regions.rt, filter.rt));

  if (filter.bdt === "ada") {
    filters.push(sql`(${rumahTangga.bdt} is not null and ${rumahTangga.bdt} <> '')`);
  } else if (filter.bdt === "tidak") {
    filters.push(sql`(${rumahTangga.bdt} is null or ${rumahTangga.bdt} = '')`);
  }

  // Status RTM dihitung dari kondisi kepala rumah tangga (paritas OpenSID).
  const kepalaFilter = (kondisi: SQL) =>
    sql`exists (
      select 1 from ${residents}
      where ${residents.villageId} = ${villageId}
        and ${residents.rtmId} = ${rumahTangga.id}
        and ${residents.rtmLevel} = ${RTM_LEVEL_KEPALA}
        and ${kondisi}
    )`;
  const adaKepala = kepalaFilter(sql`1 = 1`);

  if (filter.status === "aktif") {
    filters.push(kepalaFilter(sql`${residents.lifeStatus} = 'alive'`));
  } else if (filter.status === "tidak-aktif") {
    filters.push(kepalaFilter(sql`${residents.lifeStatus} <> 'alive'`));
  } else if (filter.status === "tanpa-kepala") {
    filters.push(sql`not ${adaKepala}`);
  }

  // Jenis kelamin kepala rumah tangga.
  if (filter.sex) {
    filters.push(kepalaFilter(sql`${residents.gender} = ${filter.sex}`));
  }

  // Status pendaftaran DTKS.
  const dtksFilter = sql`exists (
    select 1 from ${dtks}
    where ${dtks.villageId} = ${villageId} and ${dtks.rtmId} = ${rumahTangga.id}
  )`;
  if (filter.dtks === "terdaftar") {
    filters.push(dtksFilter);
  } else if (filter.dtks === "belum") {
    filters.push(sql`not ${dtksFilter}`);
  }

  return and(...filters) ?? villageFilter;
}

export async function listRumahTangga(
  params: ListRumahTanggaParams,
): Promise<RumahTanggaListResult> {
  const { villageId, filter, page, pageSize } = params;
  const where = buildWhere(villageId, filter);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        rtm: rumahTangga,
        dusun: regions.dusun,
        rw: regions.rw,
        rt: regions.rt,
      })
      .from(rumahTangga)
      .leftJoin(
        regions,
        and(eq(rumahTangga.regionId, regions.id), eq(regions.villageId, villageId)),
      )
      .where(where)
      .orderBy(asc(rumahTangga.number), asc(rumahTangga.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: count() })
      .from(rumahTangga)
      .leftJoin(
        regions,
        and(eq(rumahTangga.regionId, regions.id), eq(regions.villageId, villageId)),
      )
      .where(where),
  ]);

  const total = totalRows[0]?.value ?? 0;
  const ids = rows.map((row) => row.rtm.id);

  // Agregasi anggota diambil sekali untuk halaman ini, lalu digabung di memori —
  // menghindari subquery berkorelasi per baris.
  const [counts, heads, dtksIds] = await Promise.all([
    listAnggotaCounts(villageId, ids),
    listKepalaRumahTangga(villageId, ids),
    listDtksRtmIds(villageId, ids),
  ]);

  return {
    rows: rows.map((row) => ({
      ...toDto(row.rtm),
      headName: heads.get(row.rtm.id) ?? null,
      memberCount: counts.get(row.rtm.id) ?? 0,
      regionLabel: formatRegionLabel(row.rtm.regionId, row.dusun, row.rw, row.rt),
      hasDtks: dtksIds.has(row.rtm.id),
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Jumlah anggota per rumah tangga untuk sekumpulan id (satu query). */
async function listAnggotaCounts(
  villageId: number,
  rtmIds: readonly number[],
): Promise<Map<number, number>> {
  if (rtmIds.length === 0) return new Map();

  const rows = await db
    .select({ rtmId: residents.rtmId, total: count() })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), inArray(residents.rtmId, [...rtmIds])))
    .groupBy(residents.rtmId);

  const result = new Map<number, number>();
  for (const row of rows) {
    if (row.rtmId !== null) result.set(row.rtmId, row.total);
  }
  return result;
}

/** RTM yang sudah memiliki formulir DTKS pada halaman ini (satu query). */
async function listDtksRtmIds(villageId: number, rtmIds: readonly number[]): Promise<Set<number>> {
  if (rtmIds.length === 0) return new Set();

  const rows = await db
    .select({ rtmId: dtks.rtmId })
    .from(dtks)
    .where(and(eq(dtks.villageId, villageId), inArray(dtks.rtmId, [...rtmIds])));

  return new Set(rows.map((row) => row.rtmId));
}

/** Apakah satu RTM sudah terdaftar pada DTKS. */
export async function hasDtksRtm(villageId: number, rtmId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: dtks.id })
    .from(dtks)
    .where(and(eq(dtks.villageId, villageId), eq(dtks.rtmId, rtmId)))
    .limit(1);
  return Boolean(row);
}

/**
 * Aktifkan/nonaktifkan pendaftaran DTKS sebuah RTM (paritas OpenSID).
 *
 * Mengaktifkan membuat formulir DTKS draf baru untuk RTM bila belum ada;
 * menonaktifkan menghapus formulir beserta anggota DTKS-nya (cascade).
 * Formulir yang sudah terverifikasi tidak ikut dihapus.
 */
export async function setDtksRtm(villageId: number, rtmId: number, aktif: boolean): Promise<void> {
  if (aktif) {
    if (await hasDtksRtm(villageId, rtmId)) return;
    await db.insert(dtks).values({ villageId, rtmId, status: "draf" });
    return;
  }

  await db
    .delete(dtks)
    .where(and(eq(dtks.villageId, villageId), eq(dtks.rtmId, rtmId), eq(dtks.status, "draf")));
}

/**
 * Lepaskan banyak anggota dari RTM-nya sekaligus (paritas OpenSID).
 *
 * Hanya penduduk desa aktif yang terdaftar di RTM yang dilepas; mengembalikan
 * jumlah baris yang benar-benar dilepas.
 */
export async function removeAnggotaMassal(
  villageId: number,
  residentIds: readonly number[],
): Promise<number> {
  const ids = [...new Set(residentIds)].filter((id) => Number.isSafeInteger(id) && id > 0);
  if (ids.length === 0) return 0;

  const [hasil] = await db
    .update(residents)
    .set({ rtmId: null, rtmLevel: null })
    .where(
      and(
        eq(residents.villageId, villageId),
        inArray(residents.id, ids),
        sql`${residents.rtmId} is not null`,
      ),
    );
  return hasil?.affectedRows ?? 0;
}

/** Nama kepala rumah tangga per RTM untuk sekumpulan id (satu query). */
async function listKepalaRumahTangga(
  villageId: number,
  rtmIds: readonly number[],
): Promise<Map<number, string>> {
  if (rtmIds.length === 0) return new Map();

  const rows = await db
    .select({ rtmId: residents.rtmId, name: residents.name })
    .from(residents)
    .where(
      and(
        eq(residents.villageId, villageId),
        eq(residents.rtmLevel, RTM_LEVEL_KEPALA),
        inArray(residents.rtmId, [...rtmIds]),
      ),
    )
    .orderBy(asc(residents.id));

  const result = new Map<number, string>();
  for (const row of rows) {
    if (row.rtmId !== null && !result.has(row.rtmId)) {
      result.set(row.rtmId, row.name);
    }
  }
  return result;
}

export async function findRumahTanggaById(
  villageId: number,
  id: number,
): Promise<RumahTanggaDTO | null> {
  const [row] = await db
    .select()
    .from(rumahTangga)
    .where(and(eq(rumahTangga.villageId, villageId), eq(rumahTangga.id, id)))
    .limit(1);

  return row ? toDto(row) : null;
}

/** Apakah nomor RTM sudah dipakai rumah tangga lain di desa yang sama. */
export async function rumahTanggaNumberExists(
  villageId: number,
  number: string,
  excludeId: number | null,
): Promise<boolean> {
  const filters: SQL[] = [eq(rumahTangga.villageId, villageId), eq(rumahTangga.number, number)];

  if (excludeId !== null) {
    filters.push(ne(rumahTangga.id, excludeId));
  }

  const duplicates = await db
    .select({ id: rumahTangga.id })
    .from(rumahTangga)
    .where(and(...filters))
    .limit(1);

  return duplicates.length > 0;
}

/**
 * Jumlah rumah tangga di desa.
 *
 * Dipakai untuk membangkitkan nomor urut berikutnya; dihitung ulang saat
 * menyimpan sehingga celah akibat penghapusan tidak menghasilkan nomor ganda
 * (indeks unik tetap menjadi pengaman terakhir).
 */
export async function countRumahTangga(villageId: number): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(rumahTangga)
    .where(eq(rumahTangga.villageId, villageId));

  return row?.value ?? 0;
}

/** Anggota sebuah RTM, terurut dengan kepala rumah tangga di depan. */
export async function listRumahTanggaMembers(
  villageId: number,
  rtmId: number,
): Promise<RumahTanggaMember[]> {
  const rows = await db
    .select({
      id: residents.id,
      name: residents.name,
      nationalId: residents.nationalId,
      level: residents.rtmLevel,
      gender: residents.gender,
      lifeStatus: residents.lifeStatus,
    })
    .from(residents)
    .innerJoin(
      rumahTangga,
      and(eq(rumahTangga.id, residents.rtmId), eq(rumahTangga.villageId, villageId)),
    )
    .where(and(eq(residents.villageId, villageId), eq(residents.rtmId, rtmId)));

  return rows
    .sort((a, b) => {
      const aHead = a.level === RTM_LEVEL_KEPALA ? 0 : 1;
      const bHead = b.level === RTM_LEVEL_KEPALA ? 0 : 1;
      return aHead - bHead || a.name.localeCompare(b.name, "id") || a.id - b.id;
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      nationalId: row.nationalId,
      level: row.level,
      gender: row.gender,
      lifeStatus: row.lifeStatus,
    }));
}

/**
 * Pastikan wilayah yang dipilih milik desa pemanggil.
 *
 * Composite foreign key menolak relasi lintas desa, tetapi error SQL tidak
 * ramah pengguna dan dapat membocorkan nama constraint. Guard ini memberi
 * kesalahan validasi yang konsisten untuk create maupun update.
 */
export async function validateRumahTanggaRegion(
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

export interface HasilRtmKolektif {
  dibuat: number;
  dilewati: string[];
}

/**
 * Buat satu RTM untuk setiap KK terpilih, lalu tautkan kepala keluarga dan
 * seluruh anggota hidup ke RTM tersebut.
 *
 * KK dilewati bila kepala keluarga tidak ada, sudah meninggal/pindah, atau
 * sudah terdaftar di RTM lain — sama seperti perilaku OpenSID. Seluruh proses
 * berjalan dalam satu transaksi agar tidak ada RTM setengah jadi.
 */
export async function tambahRtmKolektif(
  villageId: number,
  familyIds: readonly number[],
  kodeDesa: string | null,
): Promise<HasilRtmKolektif> {
  const ids = [...new Set(familyIds)].filter((id) => Number.isSafeInteger(id) && id > 0);
  if (ids.length === 0) return { dibuat: 0, dilewati: [] };

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({
        familyId: families.id,
        familyNumber: families.number,
        address: families.address,
        regionId: families.regionId,
        kelasSosial: families.welfareClass,
        headId: residents.id,
        headLifeStatus: residents.lifeStatus,
        headRtmId: residents.rtmId,
      })
      .from(families)
      .leftJoin(
        residents,
        and(
          eq(residents.familyId, families.id),
          eq(residents.villageId, villageId),
          eq(residents.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
        ),
      )
      .where(and(eq(families.villageId, villageId), inArray(families.id, ids)))
      .orderBy(asc(families.number));

    const nomorTerpakai = await tx
      .select({ number: rumahTangga.number })
      .from(rumahTangga)
      .where(eq(rumahTangga.villageId, villageId));
    const dipakai = new Set(nomorTerpakai.map((row) => row.number));
    let urut = nomorTerpakai.length;
    const nomorBaru = () => {
      let kandidat = "";
      do {
        urut += 1;
        kandidat = bangunNomorRtm(kodeDesa, urut);
      } while (dipakai.has(kandidat));
      dipakai.add(kandidat);
      return kandidat;
    };

    const dilewati: string[] = [];
    let dibuat = 0;

    for (const row of rows) {
      if (!row.headId || row.headLifeStatus !== "alive" || row.headRtmId !== null) {
        dilewati.push(row.familyNumber);
        continue;
      }

      const [rtm] = await tx
        .insert(rumahTangga)
        .values({
          villageId,
          number: nomorBaru(),
          address: row.address,
          regionId: row.regionId,
          kelasSosial: row.kelasSosial,
        })
        .$returningId();
      if (!rtm) throw new Error("Gagal menyimpan rumah tangga.");

      await tx
        .update(residents)
        .set({ rtmId: rtm.id, rtmLevel: RTM_LEVEL_KEPALA })
        .where(and(eq(residents.villageId, villageId), eq(residents.id, row.headId)));

      await tx
        .update(residents)
        .set({ rtmId: rtm.id, rtmLevel: RTM_LEVEL_ANGGOTA })
        .where(
          and(
            eq(residents.villageId, villageId),
            eq(residents.familyId, row.familyId),
            eq(residents.lifeStatus, "alive"),
            ne(residents.id, row.headId),
          ),
        );

      dibuat += 1;
    }

    return { dibuat, dilewati };
  });
}

/**
 * Simpan RTM baru dan, bila dipilih, langsung tetapkan kepala rumah tangga.
 *
 * Insert dan penetapan kepala berada dalam satu transaksi agar tidak ada RTM
 * tanpa kepala ketika penetapan anggota gagal.
 */
export async function insertRumahTangga(
  villageId: number,
  number: string,
  input: RumahTanggaFormInput,
  headResidentId: number | null = null,
): Promise<number> {
  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(rumahTangga)
      .values({
        villageId,
        number,
        address: blankToNull(input.alamat),
        regionId: input.regionId,
        kelasSosial: input.kelasSosial,
        bdt: blankToNull(input.bdt),
      })
      .$returningId();

    if (!inserted) throw new Error("Gagal menyimpan data rumah tangga.");

    if (headResidentId !== null) {
      const [kepala] = await tx
        .select({ rtmId: residents.rtmId })
        .from(residents)
        .where(and(eq(residents.villageId, villageId), eq(residents.id, headResidentId)))
        .limit(1);

      if (!kepala) {
        throw validationError("Penduduk yang dipilih tidak ditemukan di desa ini.");
      }
      if (kepala.rtmId !== null) {
        throw validationError("Penduduk tersebut sudah terdaftar di rumah tangga lain.");
      }

      await tx
        .update(residents)
        .set({ rtmId: inserted.id, rtmLevel: RTM_LEVEL_KEPALA })
        .where(and(eq(residents.villageId, villageId), eq(residents.id, headResidentId)));
    }

    return inserted.id;
  });
}

export async function updateRumahTangga(
  villageId: number,
  id: number,
  input: RumahTanggaFormInput,
): Promise<void> {
  await db
    .update(rumahTangga)
    .set({
      address: blankToNull(input.alamat),
      regionId: input.regionId,
      kelasSosial: input.kelasSosial,
      bdt: blankToNull(input.bdt),
    })
    .where(and(eq(rumahTangga.villageId, villageId), eq(rumahTangga.id, id)));
}

/**
 * Hapus RTM.
 *
 * Referensi anggota dilepas dalam transaksi sebelum RTM dihapus agar
 * `village_id` tetap terjaga pada composite foreign key.
 */
export async function deleteRumahTangga(villageId: number, id: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(residents)
      .set({ rtmId: null, rtmLevel: null })
      .where(and(eq(residents.villageId, villageId), eq(residents.rtmId, id)));
    await tx
      .delete(rumahTangga)
      .where(and(eq(rumahTangga.villageId, villageId), eq(rumahTangga.id, id)));
  });
}

/** Setel (atau lepas) keanggotaan RTM seorang penduduk beserta tingkatnya. */
export async function setAnggotaRumahTangga(
  villageId: number,
  residentId: number,
  rtmId: number | null,
  level: number | null,
): Promise<void> {
  await db.transaction(async (tx) => {
    if (rtmId !== null) {
      const [rtm] = await tx
        .select({ id: rumahTangga.id })
        .from(rumahTangga)
        .where(and(eq(rumahTangga.id, rtmId), eq(rumahTangga.villageId, villageId)))
        .limit(1);
      if (!rtm) throw validationError("Rumah Tangga tidak ditemukan pada desa aktif.");
    }

    const [penduduk] = await tx
      .select({ id: residents.id })
      .from(residents)
      .where(and(eq(residents.villageId, villageId), eq(residents.id, residentId)))
      .limit(1);
    if (!penduduk) throw validationError("Penduduk tidak ditemukan di desa ini.");

    // Hanya boleh ada satu kepala rumah tangga. Menetapkan kepala baru
    // menurunkan kepala lama menjadi anggota, bukan menolak perubahan.
    if (rtmId !== null && level === RTM_LEVEL_KEPALA) {
      await tx
        .update(residents)
        .set({ rtmLevel: RTM_LEVEL_ANGGOTA })
        .where(
          and(
            eq(residents.villageId, villageId),
            eq(residents.rtmId, rtmId),
            eq(residents.rtmLevel, RTM_LEVEL_KEPALA),
            ne(residents.id, residentId),
          ),
        );
    }

    await tx
      .update(residents)
      .set({ rtmId, rtmLevel: rtmId === null ? null : level })
      .where(and(eq(residents.villageId, villageId), eq(residents.id, residentId)));
  });
}

// --- Impor RTM -------------------------------------------------------------

/** Penduduk desa berdasarkan daftar NIK (untuk mencocokkan berkas impor). */
export async function findPendudukByNiks(
  villageId: number,
  niks: readonly string[],
): Promise<Array<{ id: number; nik: string; nama: string }>> {
  const unik = [...new Set(niks.filter((nik) => nik !== ""))];
  if (unik.length === 0) return [];

  const rows = await db
    .select({ id: residents.id, nik: residents.nationalId, nama: residents.name })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), inArray(residents.nationalId, unik)));

  return rows
    .filter((row): row is { id: number; nik: string; nama: string } => Boolean(row.nik))
    .map((row) => ({ id: row.id, nik: row.nik, nama: row.nama }));
}

/** Seluruh nomor RTM yang sudah ada di desa (untuk rencana impor). */
export async function listNomorRtm(villageId: number): Promise<Set<string>> {
  const rows = await db
    .select({ number: rumahTangga.number })
    .from(rumahTangga)
    .where(eq(rumahTangga.villageId, villageId));
  return new Set(rows.map((row) => row.number));
}

/** Hasil impor RTM: jumlah RTM baru dan jumlah penduduk yang ditautkan. */
export interface HasilImporRtm {
  dibuatRtm: number;
  dihubungkan: number;
}

/**
 * Impor pengelompokan RTM (paritas OpenSID).
 *
 * Setiap nomor RTM pada berkas menjadi satu RTM: dibuat baru bila belum ada,
 * dipakai ulang bila sudah ada. Penduduk ditautkan menurut tingkatnya;
 * menetapkan kepala menurunkan kepala lama menjadi anggota, dan penduduk yang
 * sebelumnya berada di RTM lain dipindahkan. Seluruh proses satu transaksi.
 */
export async function imporRumahTangga(
  villageId: number,
  siap: readonly { residentId: number; nomorRtm: string; level: 1 | 2 }[],
): Promise<HasilImporRtm> {
  if (siap.length === 0) return { dibuatRtm: 0, dihubungkan: 0 };

  return db.transaction(async (tx) => {
    type BarisSiap = { residentId: number; nomorRtm: string; level: 1 | 2 };
    const perNomor = new Map<string, BarisSiap[]>();
    for (const row of siap) {
      const grup = perNomor.get(row.nomorRtm) ?? [];
      grup.push(row);
      perNomor.set(row.nomorRtm, grup);
    }

    const existing = await tx
      .select({ id: rumahTangga.id, number: rumahTangga.number })
      .from(rumahTangga)
      .where(eq(rumahTangga.villageId, villageId));
    const petaId = new Map(existing.map((row) => [row.number, row.id]));

    let dibuatRtm = 0;
    for (const [nomor, grup] of perNomor) {
      let rtmId = petaId.get(nomor);
      if (rtmId === undefined) {
        const [inserted] = await tx
          .insert(rumahTangga)
          .values({ villageId, number: nomor })
          .$returningId();
        if (!inserted) throw new Error("Gagal membuat rumah tangga dari berkas impor.");
        rtmId = inserted.id;
        petaId.set(nomor, rtmId);
        dibuatRtm += 1;
      }

      for (const row of grup) {
        if (row.level === RTM_LEVEL_KEPALA) {
          await tx
            .update(residents)
            .set({ rtmLevel: RTM_LEVEL_ANGGOTA })
            .where(
              and(
                eq(residents.villageId, villageId),
                eq(residents.rtmId, rtmId),
                eq(residents.rtmLevel, RTM_LEVEL_KEPALA),
                ne(residents.id, row.residentId),
              ),
            );
        }
        await tx
          .update(residents)
          .set({ rtmId, rtmLevel: row.level })
          .where(and(eq(residents.villageId, villageId), eq(residents.id, row.residentId)));
      }
    }

    return { dibuatRtm, dihubungkan: siap.length };
  });
}

// --- Laporan & filter ------------------------------------------------------

/**
 * Nilai kelas sosial yang benar-benar dipakai data desa.
 *
 * Pilihan filter dibangkitkan dari data agar tidak menawarkan kelas yang tidak
 * pernah ada di desa tersebut.
 */
export async function listKelasSosialOptions(villageId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ kelasSosial: rumahTangga.kelasSosial })
    .from(rumahTangga)
    .where(eq(rumahTangga.villageId, villageId))
    .orderBy(asc(rumahTangga.kelasSosial));

  return rows
    .map((row) => row.kelasSosial)
    .filter((nilai): nilai is number => nilai !== null)
    .sort((a, b) => a - b);
}

/**
 * Baris ringkas seluruh RTM untuk laporan (kelas sosial, dusun, jumlah anggota).
 *
 * Jumlah anggota dihitung satu query agregat, bukan per baris, agar laporan
 * tetap ringan walau RTM-nya banyak.
 */
export async function listRtmRingkas(
  villageId: number,
  filter: RtmFilter,
): Promise<RtmRekapInput[]> {
  const where = buildWhere(villageId, filter);

  const rows = await db
    .select({
      id: rumahTangga.id,
      kelasSosial: rumahTangga.kelasSosial,
      dusun: regions.dusun,
    })
    .from(rumahTangga)
    .leftJoin(regions, and(eq(rumahTangga.regionId, regions.id), eq(regions.villageId, villageId)))
    .where(where)
    .orderBy(asc(rumahTangga.number));

  const jumlahAnggota = await db
    .select({ rtmId: residents.rtmId, value: count() })
    .from(residents)
    .where(eq(residents.villageId, villageId))
    .groupBy(residents.rtmId);

  const petaAnggota = new Map<number, number>();
  for (const baris of jumlahAnggota) {
    if (baris.rtmId !== null) petaAnggota.set(baris.rtmId, Number(baris.value));
  }

  return rows.map((row) => ({
    kelasSosial: row.kelasSosial,
    dusun: row.dusun,
    anggota: petaAnggota.get(row.id) ?? 0,
  }));
}
