import "server-only";

import { and, asc, count, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

import { db } from "@/db";
import {
  bloodTypes,
  citizenships,
  educations,
  families,
  familyRelations,
  maritalStatuses,
  occupations,
  regions,
  religions,
  residents,
  suplemen,
  suplemenTerdata,
} from "@/db/schema";
import { HEAD_OF_FAMILY_RELATION_ID } from "@/features/kependudukan/penduduk/domain/penduduk";
import {
  formatAlamatTerdata,
  SASARAN_KELUARGA,
  SASARAN_PENDUDUK,
  SUPLEMEN_TERDATA_FILTER_KOSONG,
  type ListSuplemenParams,
  type ListSuplemenResult,
  type SuplemenCreateInput,
  type SuplemenOption,
  type SuplemenSasaranOption,
  type SuplemenTerdataFilter,
  type SuplemenTerdataInput,
  type SuplemenTerdataRow,
  type SuplemenTerdataUpdateInput,
  type SuplemenUpdateInput,
  type WilayahFilterOptions,
} from "@/features/kependudukan/penduduk/domain/suplemen";
import { bacaIsian } from "@/features/kependudukan/penduduk/domain/suplemen-berkas";
import { slugify } from "@/lib/utils";

export async function listSuplemen(
  villageId: number,
  params: ListSuplemenParams,
): Promise<ListSuplemenResult> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 10));
  const offset = (page - 1) * perPage;

  const filters = [eq(suplemen.villageId, villageId)];
  if (params.search) {
    filters.push(like(suplemen.nama, `%${params.search}%`));
  }
  if (params.sasaran) {
    filters.push(eq(suplemen.sasaran, params.sasaran));
  }

  const where = and(...filters);

  const [totalRes, rows] = await Promise.all([
    db.select({ value: count() }).from(suplemen).where(where),
    db
      .select({
        id: suplemen.id,
        nama: suplemen.nama,
        slug: suplemen.slug,
        sasaran: suplemen.sasaran,
        keterangan: suplemen.keterangan,
        updatedAt: suplemen.updatedAt,
        terdataCount: sql<number>`(SELECT COUNT(*) FROM suplemen_terdata WHERE suplemen_terdata.id_suplemen = suplemen.id AND suplemen_terdata.village_id = ${villageId})`,
      })
      .from(suplemen)
      .where(where)
      .orderBy(desc(suplemen.updatedAt))
      .limit(perPage)
      .offset(offset),
  ]);

  const total = totalRes[0]?.value ?? 0;

  return {
    rows: rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function createSuplemen(
  villageId: number,
  input: SuplemenCreateInput,
): Promise<number> {
  const slug = slugify(input.nama);
  const [created] = await db.insert(suplemen).values({
    villageId,
    nama: input.nama,
    slug,
    sasaran: input.sasaran,
    keterangan: input.keterangan,
    formIsian: input.dataFormIsian.length > 0 ? input.dataFormIsian : null,
  });
  return Number(created.insertId);
}

export async function updateSuplemen(villageId: number, input: SuplemenUpdateInput): Promise<void> {
  const slug = slugify(input.nama);
  await db
    .update(suplemen)
    .set({
      nama: input.nama,
      slug,
      sasaran: input.sasaran,
      keterangan: input.keterangan,
      formIsian: input.dataFormIsian.length > 0 ? input.dataFormIsian : null,
    })
    .where(and(eq(suplemen.id, input.id), eq(suplemen.villageId, villageId)));
}

export async function deleteSuplemen(villageId: number, id: number): Promise<void> {
  await db.delete(suplemen).where(and(eq(suplemen.id, id), eq(suplemen.villageId, villageId)));
}

export async function getSuplemenById(villageId: number, id: number) {
  const [row] = await db
    .select()
    .from(suplemen)
    .where(and(eq(suplemen.id, id), eq(suplemen.villageId, villageId)))
    .limit(1);
  return row ?? null;
}

/** Jumlah terdata sebuah suplemen (dipakai validasi hapus & kunci sasaran). */
export async function countSuplemenTerdata(villageId: number, suplemenId: number): Promise<number> {
  const [row] = await db
    .select({ nilai: count() })
    .from(suplemenTerdata)
    .where(
      and(eq(suplemenTerdata.villageId, villageId), eq(suplemenTerdata.suplemenId, suplemenId)),
    );
  return Number(row?.nilai ?? 0);
}

/** Baris mentah terdata sebelum disusun menjadi `SuplemenTerdataRow`. */
interface TerdataMentah {
  id: number;
  pendudukId: number | null;
  keluargaId: number | null;
  keterangan: string | null;
  isian: unknown;
  createdAt: Date;
  nomorKk: string | null;
  nik: string | null;
  nama: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  gender: string | null;
  alamat: string | null;
  dusun: string | null;
  rw: string | null;
  rt: string | null;
  /** Penanda referensi berhasil di-resolve pada tenant aktif. */
  sasaranValid: boolean;
}

/** Kondisi filter terdata yang aman dipakai kedua sasaran. */
function filterTerdataUmum(filter: SuplemenTerdataFilter): SQL[] {
  const hasil: SQL[] = [];
  if (filter.dusun) hasil.push(eq(regions.dusun, filter.dusun));
  if (filter.rw) hasil.push(eq(regions.rw, filter.rw));
  if (filter.rt) hasil.push(eq(regions.rt, filter.rt));
  return hasil;
}

async function listTerdataPenduduk(
  villageId: number,
  suplemenId: number,
  filter: SuplemenTerdataFilter,
): Promise<TerdataMentah[]> {
  const filters = filterTerdataUmum(filter);
  if (filter.gender !== "all") filters.push(eq(residents.gender, filter.gender));
  if (filter.search) {
    const pola = `%${filter.search}%`;
    const kondisi = or(
      like(residents.name, pola),
      like(residents.nationalId, pola),
      like(families.number, pola),
    );
    if (kondisi) filters.push(kondisi);
  }

  const rows = await db
    .select({
      id: suplemenTerdata.id,
      pendudukId: suplemenTerdata.pendudukId,
      keluargaId: suplemenTerdata.keluargaId,
      keterangan: suplemenTerdata.keterangan,
      isian: suplemenTerdata.dataFormIsian,
      createdAt: suplemenTerdata.createdAt,
      nomorKk: families.number,
      nik: residents.nationalId,
      nama: residents.name,
      tempatLahir: residents.birthPlace,
      tanggalLahir: residents.birthDate,
      gender: residents.gender,
      alamat: sql<
        string | null
      >`COALESCE(${families.address}, ${residents.address}, ${residents.currentAddress})`,
      dusun: regions.dusun,
      rw: regions.rw,
      rt: regions.rt,
    })
    .from(suplemenTerdata)
    // Parent suplemen dan data terdata harus satu desa; identitas penduduk/KK
    // hanya dibaca dari tenant yang sama.
    .innerJoin(
      suplemen,
      and(eq(suplemen.id, suplemenTerdata.suplemenId), eq(suplemen.villageId, villageId)),
    )
    .leftJoin(
      residents,
      and(eq(suplemenTerdata.pendudukId, residents.id), eq(residents.villageId, villageId)),
    )
    .leftJoin(families, and(eq(residents.familyId, families.id), eq(families.villageId, villageId)))
    .leftJoin(regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)))
    .where(
      and(
        eq(suplemenTerdata.villageId, villageId),
        eq(suplemenTerdata.suplemenId, suplemenId),
        ...filters,
      ),
    )
    .orderBy(asc(families.number), asc(residents.name));

  return rows.map((row) => ({
    ...row,
    sasaranValid: row.pendudukId !== null && row.nama !== null,
  }));
}

async function listTerdataKeluarga(
  villageId: number,
  suplemenId: number,
  filter: SuplemenTerdataFilter,
): Promise<TerdataMentah[]> {
  const kepala = alias(residents, "kepala_terdata");
  const filters = filterTerdataUmum(filter);
  if (filter.gender !== "all") filters.push(eq(kepala.gender, filter.gender));
  if (filter.search) {
    const pola = `%${filter.search}%`;
    const kondisi = or(
      like(families.number, pola),
      like(kepala.name, pola),
      like(kepala.nationalId, pola),
    );
    if (kondisi) filters.push(kondisi);
  }

  const rows = await db
    .select({
      id: suplemenTerdata.id,
      pendudukId: suplemenTerdata.pendudukId,
      keluargaId: suplemenTerdata.keluargaId,
      keterangan: suplemenTerdata.keterangan,
      isian: suplemenTerdata.dataFormIsian,
      createdAt: suplemenTerdata.createdAt,
      nomorKk: families.number,
      nik: kepala.nationalId,
      nama: kepala.name,
      tempatLahir: kepala.birthPlace,
      tanggalLahir: kepala.birthDate,
      gender: kepala.gender,
      alamat: families.address,
      dusun: regions.dusun,
      rw: regions.rw,
      rt: regions.rt,
    })
    .from(suplemenTerdata)
    .innerJoin(
      suplemen,
      and(eq(suplemen.id, suplemenTerdata.suplemenId), eq(suplemen.villageId, villageId)),
    )
    .leftJoin(
      families,
      and(eq(suplemenTerdata.keluargaId, families.id), eq(families.villageId, villageId)),
    )
    .leftJoin(
      kepala,
      and(
        eq(kepala.familyId, families.id),
        eq(kepala.villageId, villageId),
        eq(kepala.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
      ),
    )
    .leftJoin(regions, and(eq(families.regionId, regions.id), eq(regions.villageId, villageId)))
    .where(
      and(
        eq(suplemenTerdata.villageId, villageId),
        eq(suplemenTerdata.suplemenId, suplemenId),
        ...filters,
      ),
    )
    .orderBy(asc(families.number));

  return rows.map((row) => ({
    ...row,
    sasaranValid: row.keluargaId !== null && row.nomorKk !== null,
  }));
}

function susunBarisTerdata(row: TerdataMentah): SuplemenTerdataRow {
  // Jangan keluarkan ID referensi yang gagal di-resolve pada tenant aktif.
  // Ini menutup kebocoran identifier legacy lintas desa dari API.
  const pendudukValid = row.pendudukId !== null && row.nama !== null;
  const keluargaValid = row.keluargaId !== null && row.nomorKk !== null;

  // Label mengikuti referensi yang tersimpan pada baris (bukan sasaran induk),
  // sehingga baris legacy yang menunjuk sasaran desa lain tetap terbaca jelas.
  const label =
    row.pendudukId !== null
      ? pendudukValid
        ? `${row.nama}${row.nik ? ` — ${row.nik}` : ""}`
        : "Penduduk tidak tersedia"
      : keluargaValid
        ? `KK ${row.nomorKk}`
        : "KK tidak tersedia";

  return {
    id: row.id,
    pendudukId: pendudukValid ? row.pendudukId : null,
    keluargaId: keluargaValid ? row.keluargaId : null,
    label,
    nomorKk: keluargaValid ? row.nomorKk : null,
    nik: row.sasaranValid ? row.nik : null,
    nama: row.sasaranValid ? row.nama : null,
    tempatLahir: row.sasaranValid ? row.tempatLahir : null,
    tanggalLahir: row.sasaranValid ? row.tanggalLahir : null,
    gender:
      row.sasaranValid && (row.gender === "male" || row.gender === "female") ? row.gender : null,
    alamat: row.sasaranValid
      ? formatAlamatTerdata({
          alamat: row.alamat,
          rt: row.rt,
          rw: row.rw,
          dusun: row.dusun,
        })
      : null,
    keterangan: row.keterangan,
    isian: bacaIsian(row.isian),
    createdAt: row.createdAt.toISOString(),
  };
}

/** Daftar terdata sebuah suplemen (kolom mengikuti sasaran induknya). */
export async function listSuplemenTerdata(
  villageId: number,
  suplemenId: number,
  filter: SuplemenTerdataFilter = SUPLEMEN_TERDATA_FILTER_KOSONG,
): Promise<SuplemenTerdataRow[]> {
  const parent = await getSuplemenById(villageId, suplemenId);
  if (!parent) return [];

  const rows =
    parent.sasaran === SASARAN_KELUARGA
      ? await listTerdataKeluarga(villageId, suplemenId, filter)
      : await listTerdataPenduduk(villageId, suplemenId, filter);

  return rows.map((row) => susunBarisTerdata(row));
}

/** Satu baris terdata milik tenant, dipakai halaman ubah terdata. */
export async function getSuplemenTerdataById(
  villageId: number,
  suplemenId: number,
  terdataId: number,
): Promise<SuplemenTerdataRow | null> {
  const rows = await listSuplemenTerdata(villageId, suplemenId);
  return rows.find((row) => row.id === terdataId) ?? null;
}

/** Opsi wilayah (dusun/RW/RT) yang dipakai filter terdata. */
export async function listWilayahFilterOptions(villageId: number): Promise<WilayahFilterOptions> {
  const rows = await db
    .select({ dusun: regions.dusun, rw: regions.rw, rt: regions.rt })
    .from(regions)
    .where(eq(regions.villageId, villageId))
    .orderBy(asc(regions.dusun), asc(regions.rw), asc(regions.rt));

  const unik = (nilai: (string | null)[]): string[] =>
    [...new Set(nilai.filter((item): item is string => Boolean(item && item.trim())))].sort(
      (a, b) => a.localeCompare(b, "id"),
    );

  return {
    dusun: unik(rows.map((row) => row.dusun)),
    rw: unik(rows.map((row) => row.rw)),
    rt: unik(rows.map((row) => row.rt)),
  };
}

/**
 * Cari warga yang belum terdata pada suplemen ini.
 *
 * Sasaran penduduk mencari NIK/nama
 * penduduk hidup, sasaran keluarga mencari No. KK/nama kepala keluarga.
 */
export async function cariSasaranSuplemen(
  villageId: number,
  suplemenId: number,
  sasaran: number,
  cari: string,
  limit = 20,
): Promise<SuplemenSasaranOption[]> {
  const batas = Math.min(50, Math.max(1, limit));
  const pola = `%${cari}%`;

  const terdaftar = await db
    .select({
      pendudukId: suplemenTerdata.pendudukId,
      keluargaId: suplemenTerdata.keluargaId,
    })
    .from(suplemenTerdata)
    .where(
      and(eq(suplemenTerdata.villageId, villageId), eq(suplemenTerdata.suplemenId, suplemenId)),
    );
  const pendudukTerdaftar = terdaftar
    .map((row) => row.pendudukId)
    .filter((id): id is number => id !== null);
  const keluargaTerdaftar = terdaftar
    .map((row) => row.keluargaId)
    .filter((id): id is number => id !== null);

  if (sasaran === SASARAN_KELUARGA) {
    const kepala = alias(residents, "kepala_pilihan");
    const rows = await db
      .select({
        id: families.id,
        nomorKk: families.number,
        nama: kepala.name,
        nik: kepala.nationalId,
        dusun: regions.dusun,
        rw: regions.rw,
        rt: regions.rt,
        alamat: families.address,
      })
      .from(families)
      .leftJoin(
        kepala,
        and(
          eq(kepala.familyId, families.id),
          eq(kepala.villageId, villageId),
          eq(kepala.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
        ),
      )
      .leftJoin(regions, and(eq(families.regionId, regions.id), eq(regions.villageId, villageId)))
      .where(
        and(
          eq(families.villageId, villageId),
          keluargaTerdaftar.length > 0
            ? sql`${families.id} NOT IN (${sql.join(
                keluargaTerdaftar.map((id) => sql`${id}`),
                sql`, `,
              )})`
            : undefined,
          cari
            ? or(
                like(families.number, pola),
                like(kepala.name, pola),
                like(kepala.nationalId, pola),
              )
            : undefined,
        ),
      )
      .orderBy(asc(families.number))
      .limit(batas);

    return rows.map((row) => ({
      id: row.id,
      text: `No KK : ${row.nomorKk}${row.nama ? ` - ${row.nama}` : ""}${
        row.nik ? ` - NIK : ${row.nik}` : ""
      }${row.rt || row.rw || row.dusun ? ` RT-${row.rt ?? ""}, RW-${row.rw ?? ""}, ${(row.dusun ?? "").toUpperCase()}` : ""}`,
    }));
  }

  const rows = await db
    .select({
      id: residents.id,
      nik: residents.nationalId,
      nama: residents.name,
      nomorKk: families.number,
      dusun: regions.dusun,
      rw: regions.rw,
      rt: regions.rt,
    })
    .from(residents)
    .leftJoin(families, and(eq(residents.familyId, families.id), eq(families.villageId, villageId)))
    .leftJoin(regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)))
    .where(
      and(
        eq(residents.villageId, villageId),
        eq(residents.lifeStatus, "alive"),
        pendudukTerdaftar.length > 0
          ? sql`${residents.id} NOT IN (${sql.join(
              pendudukTerdaftar.map((id) => sql`${id}`),
              sql`, `,
            )})`
          : undefined,
        cari ? or(like(residents.nationalId, pola), like(residents.name, pola)) : undefined,
      ),
    )
    .orderBy(asc(residents.name), asc(residents.id))
    .limit(batas);

  return rows.map((row) => ({
    id: row.id,
    text: `NIK : ${row.nik ?? "-"} - ${row.nama} RT-${row.rt ?? ""}, RW-${row.rw ?? ""}, ${(row.dusun ?? "").toUpperCase()}${row.nomorKk ? ` (KK ${row.nomorKk})` : ""}`,
  }));
}

/**
 * Data ringkas sasaran untuk blok konfirmasi terdata
 * (TTL/umur, alamat, pendidikan,
 * warga negara, agama).
 */
export async function getSasaranTerdataDetail(
  villageId: number,
  sasaran: number,
  sasaranId: number,
) {
  if (sasaran === SASARAN_KELUARGA) {
    const kepala = alias(residents, "kepala_konfirmasi");
    const [row] = await db
      .select({
        nomorKk: families.number,
        alamat: families.address,
        dusun: regions.dusun,
        rw: regions.rw,
        rt: regions.rt,
        nama: kepala.name,
        nik: kepala.nationalId,
        tempatLahir: kepala.birthPlace,
        tanggalLahir: kepala.birthDate,
        pendidikan: educations.name,
        warganegara: citizenships.name,
        agama: religions.name,
      })
      .from(families)
      .leftJoin(
        kepala,
        and(
          eq(kepala.familyId, families.id),
          eq(kepala.villageId, villageId),
          eq(kepala.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
        ),
      )
      .leftJoin(educations, eq(kepala.educationId, educations.id))
      .leftJoin(citizenships, eq(kepala.citizenshipId, citizenships.id))
      .leftJoin(religions, eq(kepala.religionId, religions.id))
      .leftJoin(regions, and(eq(families.regionId, regions.id), eq(regions.villageId, villageId)))
      .where(and(eq(families.id, sasaranId), eq(families.villageId, villageId)))
      .limit(1);
    if (!row) return null;
    return {
      sasaran,
      nomorKk: row.nomorKk,
      nik: row.nik,
      nama: row.nama,
      tempatLahir: row.tempatLahir,
      tanggalLahir: row.tanggalLahir,
      alamat: formatAlamatTerdata({
        alamat: row.alamat,
        rt: row.rt,
        rw: row.rw,
        dusun: row.dusun,
      }),
      pendidikan: row.pendidikan,
      warganegara: row.warganegara,
      agama: row.agama,
    };
  }

  const [row] = await db
    .select({
      nomorKk: families.number,
      nama: residents.name,
      nik: residents.nationalId,
      tempatLahir: residents.birthPlace,
      tanggalLahir: residents.birthDate,
      alamat: sql<
        string | null
      >`COALESCE(${families.address}, ${residents.address}, ${residents.currentAddress})`,
      dusun: regions.dusun,
      rw: regions.rw,
      rt: regions.rt,
      pendidikan: educations.name,
      warganegara: citizenships.name,
      agama: religions.name,
    })
    .from(residents)
    .leftJoin(families, and(eq(residents.familyId, families.id), eq(families.villageId, villageId)))
    .leftJoin(educations, eq(residents.educationId, educations.id))
    .leftJoin(citizenships, eq(residents.citizenshipId, citizenships.id))
    .leftJoin(religions, eq(residents.religionId, religions.id))
    .leftJoin(regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)))
    .where(and(eq(residents.id, sasaranId), eq(residents.villageId, villageId)))
    .limit(1);
  if (!row) return null;

  return {
    sasaran,
    nomorKk: row.nomorKk,
    nik: row.nik,
    nama: row.nama,
    tempatLahir: row.tempatLahir,
    tanggalLahir: row.tanggalLahir,
    alamat: formatAlamatTerdata({
      alamat: row.alamat,
      rt: row.rt,
      rw: row.rw,
      dusun: row.dusun,
    }),
    pendidikan: row.pendidikan,
    warganegara: row.warganegara,
    agama: row.agama,
  };
}

/** Id penduduk untuk sekumpulan NIK pada desa ini (dipakai impor). */
export async function findPendudukIdsByNik(
  villageId: number,
  nik: readonly string[],
): Promise<Map<string, number>> {
  if (nik.length === 0) return new Map();

  const rows = await db
    .select({ id: residents.id, nationalId: residents.nationalId })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), inArray(residents.nationalId, [...nik])));

  return new Map(rows.map((row) => [row.nationalId ?? "", row.id]));
}

/** Id keluarga untuk sekumpulan nomor KK pada desa ini (dipakai impor). */
export async function findKeluargaIdsByNumber(
  villageId: number,
  numbers: readonly string[],
): Promise<Map<string, number>> {
  if (numbers.length === 0) return new Map();

  const rows = await db
    .select({ id: families.id, number: families.number })
    .from(families)
    .where(and(eq(families.villageId, villageId), inArray(families.number, [...numbers])));

  return new Map(rows.map((row) => [row.number, row.id]));
}

/**
 * Tambahkan terdata dari impor dengan data isian dinamis.
 *
 * Idempoten: sasaran yang sudah terdata pada suplemen ini dianggap dilewati.
 */
export async function addSuplemenTerdataImpor(
  villageId: number,
  suplemenId: number,
  sasaranId: { pendudukId: number | null; keluargaId: number | null },
  isian: Record<string, string>,
  keterangan: string | null = null,
): Promise<boolean> {
  // Impor tidak boleh melewati validasi kepemilikan: parent suplemen dan
  // sasaran harus berada pada desa yang sama. Tepat satu sasaran wajib diisi.
  const punyaPenduduk = sasaranId.pendudukId !== null;
  const punyaKeluarga = sasaranId.keluargaId !== null;
  if (punyaPenduduk === punyaKeluarga) {
    throw new Error("Sasaran impor harus salah satu: penduduk atau keluarga.");
  }

  const parent = await getSuplemenById(villageId, suplemenId);
  if (!parent) throw new Error("Suplemen tidak ditemukan.");

  if (sasaranId.pendudukId !== null) {
    const [resident] = await db
      .select({ id: residents.id })
      .from(residents)
      .where(and(eq(residents.id, sasaranId.pendudukId), eq(residents.villageId, villageId)))
      .limit(1);
    if (!resident) throw new Error("Penduduk tidak ditemukan.");
  }

  if (sasaranId.keluargaId !== null) {
    const [family] = await db
      .select({ id: families.id })
      .from(families)
      .where(and(eq(families.id, sasaranId.keluargaId), eq(families.villageId, villageId)))
      .limit(1);
    if (!family) throw new Error("Keluarga tidak ditemukan.");
  }

  const kolomCek = sasaranId.pendudukId
    ? eq(suplemenTerdata.pendudukId, sasaranId.pendudukId)
    : eq(suplemenTerdata.keluargaId, sasaranId.keluargaId!);

  const ada = await db
    .select({ id: suplemenTerdata.id })
    .from(suplemenTerdata)
    .where(
      and(
        eq(suplemenTerdata.villageId, villageId),
        eq(suplemenTerdata.suplemenId, suplemenId),
        kolomCek,
      ),
    )
    .limit(1);

  if (ada[0]) return false;

  await db.insert(suplemenTerdata).values({
    villageId,
    suplemenId,
    pendudukId: sasaranId.pendudukId,
    keluargaId: sasaranId.keluargaId,
    keterangan: keterangan === null ? null : keterangan.slice(0, 100),
    dataFormIsian: isian,
  });

  return true;
}

/** Jumlah terdata per suplemen untuk seluruh suplemen desa (dipakai laporan). */
export async function listSuplemenRekap(villageId: number) {
  const rows = await db
    .select({
      id: suplemen.id,
      nama: suplemen.nama,
      sasaran: suplemen.sasaran,
    })
    .from(suplemen)
    .where(eq(suplemen.villageId, villageId))
    .orderBy(asc(suplemen.nama));

  // Query agregat, bukan subquery berkorelasi: Drizzle merender kolom subquery
  // tanpa kualifikasi tabel sehingga `id` menunjuk `suplemen_terdata.id`.
  const terdataRows = await db
    .select({ suplemenId: suplemenTerdata.suplemenId, jumlah: count() })
    .from(suplemenTerdata)
    .innerJoin(
      suplemen,
      and(eq(suplemen.id, suplemenTerdata.suplemenId), eq(suplemen.villageId, villageId)),
    )
    .where(eq(suplemenTerdata.villageId, villageId))
    .groupBy(suplemenTerdata.suplemenId);
  const terdataBySuplemen = new Map(
    terdataRows.map((row) => [row.suplemenId, Number(row.jumlah ?? 0)]),
  );

  return rows.map((row) => ({ ...row, jumlahTerdata: terdataBySuplemen.get(row.id) ?? 0 }));
}

/** Apakah sasaran sudah terdata pada suplemen ini (cegah duplikat). */
async function sasaranSudahTerdata(
  villageId: number,
  suplemenId: number,
  sasaranId: { pendudukId?: number | null; keluargaId?: number | null },
  kecualiId?: number,
): Promise<boolean> {
  const kolom = sasaranId.pendudukId
    ? eq(suplemenTerdata.pendudukId, sasaranId.pendudukId)
    : eq(suplemenTerdata.keluargaId, sasaranId.keluargaId!);

  const [row] = await db
    .select({ id: suplemenTerdata.id })
    .from(suplemenTerdata)
    .where(
      and(
        eq(suplemenTerdata.villageId, villageId),
        eq(suplemenTerdata.suplemenId, suplemenId),
        kolom,
        kecualiId ? sql`${suplemenTerdata.id} <> ${kecualiId}` : undefined,
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function addSuplemenTerdata(
  villageId: number,
  input: SuplemenTerdataInput,
): Promise<void> {
  const suplemenRow = await getSuplemenById(villageId, input.suplemenId);
  if (!suplemenRow) throw new Error("Suplemen tidak ditemukan.");

  if (suplemenRow.sasaran === SASARAN_PENDUDUK && !input.pendudukId) {
    throw new Error("Suplemen ini bersasaran penduduk.");
  }
  if (suplemenRow.sasaran === SASARAN_KELUARGA && !input.keluargaId) {
    throw new Error("Suplemen ini bersasaran keluarga.");
  }

  if (input.pendudukId) {
    const [resident] = await db
      .select({ id: residents.id })
      .from(residents)
      .where(and(eq(residents.id, input.pendudukId), eq(residents.villageId, villageId)))
      .limit(1);
    if (!resident) throw new Error("Penduduk tidak ditemukan.");
  }

  if (input.keluargaId) {
    const [family] = await db
      .select({ id: families.id })
      .from(families)
      .where(and(eq(families.id, input.keluargaId), eq(families.villageId, villageId)))
      .limit(1);
    if (!family) throw new Error("Keluarga tidak ditemukan.");
  }

  if (await sasaranSudahTerdata(villageId, input.suplemenId, input)) {
    throw new Error("Sasaran tersebut sudah terdata pada suplemen ini.");
  }

  await db.insert(suplemenTerdata).values({
    villageId,
    suplemenId: input.suplemenId,
    pendudukId: input.pendudukId ?? null,
    keluargaId: input.keluargaId ?? null,
    keterangan: input.keterangan ?? null,
    dataFormIsian: input.isian ?? null,
  });
}

/** Ubah keterangan & isian satu baris terdata; sasaran tidak berubah. */
export async function updateSuplemenTerdata(
  villageId: number,
  input: SuplemenTerdataUpdateInput,
): Promise<void> {
  const [row] = await db
    .select({ id: suplemenTerdata.id })
    .from(suplemenTerdata)
    .where(
      and(
        eq(suplemenTerdata.id, input.terdataId),
        eq(suplemenTerdata.villageId, villageId),
        eq(suplemenTerdata.suplemenId, input.suplemenId),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Data terdata tidak ditemukan.");

  await db
    .update(suplemenTerdata)
    .set({
      keterangan: input.keterangan ?? null,
      dataFormIsian: input.isian ?? null,
    })
    .where(
      and(
        eq(suplemenTerdata.id, input.terdataId),
        eq(suplemenTerdata.villageId, villageId),
        eq(suplemenTerdata.suplemenId, input.suplemenId),
      ),
    );
}

export async function removeSuplemenTerdata(villageId: number, id: number): Promise<void> {
  await db
    .delete(suplemenTerdata)
    .where(and(eq(suplemenTerdata.id, id), eq(suplemenTerdata.villageId, villageId)));
}

/** Hapus massal terdata terpilih pada satu suplemen. */
export async function removeSuplemenTerdataMassal(
  villageId: number,
  suplemenId: number,
  ids: readonly number[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const hasil = await db
    .delete(suplemenTerdata)
    .where(
      and(
        eq(suplemenTerdata.villageId, villageId),
        eq(suplemenTerdata.suplemenId, suplemenId),
        inArray(suplemenTerdata.id, [...ids]),
      ),
    );
  return Number(hasil[0]?.affectedRows ?? 0);
}

/**
 * Pilihan untuk kolom isian bertipe `select-otomatis`.
 *
 * Nilai pilihan diambil dari katalog desa
 * (agama, pendidikan, pekerjaan, dst.) sehingga petugas tidak mengetik ulang
 * dan nilai antar-suplemen tetap konsisten.
 */
export async function getReferensiIsianOptions(
  villageId: number,
): Promise<Record<string, string[]>> {
  const [agama, pendidikan, pekerjaan, kawin, hubungan, darah, warga, dusunRows] =
    await Promise.all([
      db.select({ name: religions.name }).from(religions).orderBy(asc(religions.id)),
      db.select({ name: educations.name }).from(educations).orderBy(asc(educations.id)),
      db.select({ name: occupations.name }).from(occupations).orderBy(asc(occupations.id)),
      db
        .select({ name: maritalStatuses.name })
        .from(maritalStatuses)
        .orderBy(asc(maritalStatuses.id)),
      db
        .select({ name: familyRelations.name })
        .from(familyRelations)
        .orderBy(asc(familyRelations.id)),
      db.select({ name: bloodTypes.name }).from(bloodTypes).orderBy(asc(bloodTypes.id)),
      db.select({ name: citizenships.name }).from(citizenships).orderBy(asc(citizenships.id)),
      db
        .select({ dusun: regions.dusun })
        .from(regions)
        .where(eq(regions.villageId, villageId))
        .groupBy(regions.dusun)
        .orderBy(asc(regions.dusun)),
    ]);

  const nama = (rows: { name: string }[]) => rows.map((row) => row.name).filter(Boolean);

  return {
    "Jenis Kelamin": ["Laki-laki", "Perempuan"],
    Agama: nama(agama),
    "Pendidikan Dalam KK": nama(pendidikan),
    "Pendidikan Sedang Ditempuh": nama(pendidikan),
    Pekerjaan: nama(pekerjaan),
    "Status Perkawinan": nama(kawin),
    "Status Hubungan Dalam Keluarga": nama(hubungan),
    "Golongan Darah": nama(darah),
    "Warga Negara": nama(warga),
    Dusun: dusunRows.map((row) => row.dusun).filter((item): item is string => Boolean(item)),
  };
}

export async function listSuplemenPendudukOptions(villageId: number): Promise<SuplemenOption[]> {
  const rows = await db
    .select({ id: residents.id, name: residents.name, nationalId: residents.nationalId })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), eq(residents.lifeStatus, "alive")))
    .orderBy(asc(residents.name), asc(residents.id));

  return rows.map((row) => ({
    id: row.id,
    label: row.nationalId ? `${row.name} — ${row.nationalId}` : row.name,
  }));
}

export async function listSuplemenKeluargaOptions(villageId: number): Promise<SuplemenOption[]> {
  const rows = await db
    .select({ id: families.id, number: families.number, address: families.address })
    .from(families)
    .where(eq(families.villageId, villageId))
    .orderBy(asc(families.number));

  return rows.map((row) => ({
    id: row.id,
    label: row.address ? `KK ${row.number} — ${row.address}` : `KK ${row.number}`,
  }));
}
