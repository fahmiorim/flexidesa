import { z } from "zod";

import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { toCsv } from "@/lib/csv";
import { NO_SELECTION, optionalSelectId, optionalText, type LabelOption } from "@/lib/forms";

/** Slug resource RBAC untuk modul rumah tangga (harus sama dengan `modules.slug`). */
export const RUMAH_TANGGA_RESOURCE = RESOURCES.rumahTangga;

/**
 * Rumah Tangga (RTM).
 *
 * RTM adalah unit sosial **di bawah** Kartu Keluarga: satu KK dapat memuat
 * beberapa rumah tangga (mis. satu rumah dihuni dua keluarga yang berbagi dapur).
 * Keanggotaan dinyatakan lewat `residents.rtm_id`, dan peran tiap anggota
 * disimpan pada `residents.rtm_level`.
 *
 * RTM punya **nomor sendiri** (`number`) yang dibangkitkan
 * dari kode desa + nomor urut, sehingga tidak bertabrakan dengan nomor KK.
 */

// --- Tingkat hubungan dalam rumah tangga -----------------------------------

/**
 * Tingkat hubungan anggota RTM.
 *
 * Nilai numerik mengikuti katalog tingkat (1 kepala, 2 anggota)
 * agar migrasi data lama tetap mudah. Disimpan sebagai angka pada baris penduduk.
 */
const RTM_LEVELS = [1, 2] as const;
type RtmLevel = (typeof RTM_LEVELS)[number];

export const RTM_LEVEL_KEPALA: RtmLevel = 1;
export const RTM_LEVEL_ANGGOTA: RtmLevel = 2;

const RTM_LEVEL_LABELS: Readonly<Record<RtmLevel, string>> = {
  1: "Kepala Rumah Tangga",
  2: "Anggota",
};

/** Label tingkat hubungan, atau "-" bila belum ditentukan. */
export function rtmLevelLabel(level: number | null): string {
  if (level === 1 || level === 2) return RTM_LEVEL_LABELS[level];
  return "-";
}

/** Apakah tingkat hubungan termasuk kepala rumah tangga? */
export function isKepalaRtm(level: number | null): boolean {
  return level === RTM_LEVEL_KEPALA;
}

// --- Validasi formulir -----------------------------------------------------

/**
 * Skema validasi input rumah tangga.
 *
 * Nomor RTM **tidak** diminta dari pengguna: dibangkitkan otomatis (lihat
 * `bangunNomorRtm`) agar konsisten dan bebas salah tulis. Kelas sosial & BDT
 * (Basis Data Terpadu) bersifat opsional karena sering belum tersedia.
 */
export const rumahTanggaFormSchema = z.object({
  alamat: optionalText(255),
  regionId: optionalSelectId,
  kelasSosial: z.preprocess(
    (value) => (value === "" || value === NO_SELECTION || value === null ? null : value),
    z.coerce.number().int().min(0, "Minimal 0.").max(99, "Maksimal 99.").nullable(),
  ),
  bdt: optionalText(30),
});

export type RumahTanggaFormInput = z.infer<typeof rumahTanggaFormSchema>;

// --- Nomor RTM -------------------------------------------------------------

/** Panjang nomor urut pada nomor RTM. */
const NOMOR_URUT_LENGTH = 5;

/**
 * Bangun nomor RTM dari kode desa dan nomor urut.
 *
 * Pola `kode_desa` + nomor urut 5 digit
 * diterapkan pada nomor **RTM sendiri**. `urut` adalah nomor urut global desa
 * (mis. jumlah RTM + 1); bagian kode desa dipangkas agar hasilnya tidak terlalu
 * panjang dan tetap unik per desa berkat indeks unik `(village_id, number)`.
 */
export function bangunNomorRtm(kodeDesa: string | null, urut: number): string {
  const kode = (kodeDesa ?? "").trim().replace(/[^0-9]/g, "");
  const urutan = String(Math.max(1, Math.trunc(urut))).padStart(NOMOR_URUT_LENGTH, "0");
  return kode === "" ? urutan : `${kode}${urutan}`;
}

// --- Bentuk data untuk UI --------------------------------------------------

/** Bentuk data rumah tangga yang dikirim ke UI (tanpa kolom internal). */
export interface RumahTanggaDTO {
  id: number;
  number: string;
  address: string | null;
  regionId: number | null;
  kelasSosial: number | null;
  bdt: string | null;
}

/** Baris tabel rumah tangga: DTO ditambah data turunan hasil join/agregasi. */
export interface RumahTanggaListRow extends RumahTanggaDTO {
  headName: string | null;
  memberCount: number;
  regionLabel: string | null;
  /** Apakah RTM sudah memiliki formulir DTKS. */
  hasDtks: boolean;
}

/** Satu anggota rumah tangga untuk tampilan rincian. */
export interface RumahTanggaMember {
  id: number;
  name: string;
  nationalId: string | null;
  level: number | null;
  /** Jenis kelamin penduduk (`male`/`female`). */
  gender: "male" | "female";
  /** Status dasar kependudukan (`alive`, `deceased`, …). */
  lifeStatus: string;
}

/** Label jenis kelamin penduduk. */
export const RTM_GENDER_LABELS: Readonly<Record<"male" | "female", string>> = {
  male: "Laki-laki",
  female: "Perempuan",
};

/** Label status dasar kependudukan untuk daftar anggota RTM. */
const RTM_LIFE_STATUS_LABELS: Readonly<Record<string, string>> = {
  alive: "Hidup",
  deceased: "Mati",
  moved: "Pindah",
  missing: "Hilang",
  departed: "Pergi",
  invalid: "Tidak Valid",
};

/** Label status dasar, atau nilai mentah bila tak dikenal. */
export function rtmLifeStatusLabel(status: string): string {
  return RTM_LIFE_STATUS_LABELS[status] ?? status;
}

/** Filter daftar anggota pada halaman detail RTM. */
interface RtmAnggotaFilter {
  sex: RtmSexFilter | null;
  /** `hidup` = status dasar hidup; `tidak` = selain hidup. */
  status: "hidup" | "tidak" | null;
}

/** Filter anggota kosong. */
export function filterAnggotaRtmKosong(): RtmAnggotaFilter {
  return { sex: null, status: null };
}

/** Ubah query string halaman detail menjadi filter anggota tervalidasi. */
export function parseFilterAnggotaRtm(params: Record<string, NilaiParam>): RtmAnggotaFilter {
  const sex = ambilTeks(params.sexAnggota);
  const status = ambilTeks(params.statusAnggota);
  return {
    sex: (RTM_SEX_FILTERS as readonly string[]).includes(sex) ? (sex as RtmSexFilter) : null,
    status: status === "hidup" || status === "tidak" ? status : null,
  };
}

/** Terapkan filter anggota (fungsi murni). */
export function filterAnggotaRtm(
  members: readonly RumahTanggaMember[],
  filter: RtmAnggotaFilter,
): RumahTanggaMember[] {
  return members.filter((member) => {
    if (filter.sex !== null && member.gender !== filter.sex) return false;
    if (filter.status === "hidup" && member.lifeStatus !== "alive") return false;
    if (filter.status === "tidak" && member.lifeStatus === "alive") return false;
    return true;
  });
}

/**
 * Data referensi yang dibutuhkan formulir rumah tangga.
 *
 * `penduduk` berisi seluruh penduduk desa (dengan NIK) untuk dipilih saat
 * menautkan anggota; `regions` untuk memilih wilayah domisili.
 */
export interface RumahTanggaReferenceData {
  regions: LabelOption[];
  penduduk: LabelOption[];
}

// --- Filter daftar rumah tangga -------------------------------------------

/** Pilihan penyaringan kepemilikan nomor BDT. */
const RTM_BDT_FILTERS = ["ada", "tidak"] as const;
type RtmBdtFilter = (typeof RTM_BDT_FILTERS)[number];

/**
 * Status RTM menurut kondisi kepala rumah tangga.
 *
 * - `aktif` → ada kepala dan kepala masih hidup.
 * - `tidak-aktif` → ada kepala tetapi kepala sudah tidak hidup
 *   (meninggal/pindah/dll).
 * - `tanpa-kepala` → tidak ada kepala rumah tangga.
 */
export const RTM_STATUS_FILTERS = ["aktif", "tidak-aktif", "tanpa-kepala"] as const;
type RtmStatusFilter = (typeof RTM_STATUS_FILTERS)[number];

export const RTM_STATUS_LABELS: Readonly<Record<RtmStatusFilter, string>> = {
  aktif: "Aktif",
  "tidak-aktif": "Tidak Aktif",
  "tanpa-kepala": "Tanpa Kepala Keluarga",
};

/** Jenis kelamin kepala rumah tangga untuk filter daftar. */
export const RTM_SEX_FILTERS = ["male", "female"] as const;
type RtmSexFilter = (typeof RTM_SEX_FILTERS)[number];

export const RTM_SEX_LABELS: Readonly<Record<RtmSexFilter, string>> = {
  male: "Laki-laki",
  female: "Perempuan",
};

/** Pilihan penyaringan status DTKS. */
const RTM_DTKS_FILTERS = ["terdaftar", "belum"] as const;
type RtmDtksFilter = (typeof RTM_DTKS_FILTERS)[number];

export interface RtmFilter {
  search: string;
  kelasSosial: number | null;
  dusun: string;
  rw: string;
  rt: string;
  bdt: RtmBdtFilter | null;
  status: RtmStatusFilter | null;
  sex: RtmSexFilter | null;
  dtks: RtmDtksFilter | null;
}

type NilaiParam = string | string[] | undefined;

function ambilTeks(param: NilaiParam): string {
  if (Array.isArray(param)) return param[0]?.trim() ?? "";
  return param?.trim() ?? "";
}

/** Filter kosong tanpa batasan apa pun. */
export function filterRtmKosong(): RtmFilter {
  return {
    search: "",
    kelasSosial: null,
    dusun: "",
    rw: "",
    rt: "",
    bdt: null,
    status: null,
    sex: null,
    dtks: null,
  };
}

/**
 * Ubah query string halaman menjadi filter RTM tervalidasi.
 *
 * Nilai tak dikenal diabaikan agar tautan lama tidak menampilkan galat.
 */
export function parseFilterRtm(params: Record<string, NilaiParam>): RtmFilter {
  const kelasTeks = ambilTeks(params.kelasSosial);
  const kelas = kelasTeks === "" ? null : Number(kelasTeks);
  const bdt = ambilTeks(params.bdt);
  const status = ambilTeks(params.status);
  const sex = ambilTeks(params.sex);
  const dtks = ambilTeks(params.dtks);

  return {
    search: ambilTeks(params.q),
    kelasSosial: kelas !== null && Number.isInteger(kelas) && kelas >= 0 ? kelas : null,
    dusun: ambilTeks(params.dusun),
    rw: ambilTeks(params.rw),
    rt: ambilTeks(params.rt),
    bdt: (RTM_BDT_FILTERS as readonly string[]).includes(bdt) ? (bdt as RtmBdtFilter) : null,
    status: (RTM_STATUS_FILTERS as readonly string[]).includes(status)
      ? (status as RtmStatusFilter)
      : null,
    sex: (RTM_SEX_FILTERS as readonly string[]).includes(sex) ? (sex as RtmSexFilter) : null,
    dtks: (RTM_DTKS_FILTERS as readonly string[]).includes(dtks) ? (dtks as RtmDtksFilter) : null,
  };
}

/** Query string dari filter (tanpa parameter halaman). */
export function filterRtmKeSearchParams(filter: RtmFilter): URLSearchParams {
  const query = new URLSearchParams();
  if (filter.search) query.set("q", filter.search);
  if (filter.kelasSosial !== null) query.set("kelasSosial", String(filter.kelasSosial));
  if (filter.dusun) query.set("dusun", filter.dusun);
  if (filter.rw) query.set("rw", filter.rw);
  if (filter.rt) query.set("rt", filter.rt);
  if (filter.bdt) query.set("bdt", filter.bdt);
  if (filter.status) query.set("status", filter.status);
  if (filter.sex) query.set("sex", filter.sex);
  if (filter.dtks) query.set("dtks", filter.dtks);
  return query;
}

/** Jumlah filter aktif selain pencarian. */
export function hitungFilterRtm(filter: RtmFilter): number {
  return [
    filter.kelasSosial,
    filter.dusun,
    filter.rw,
    filter.rt,
    filter.bdt,
    filter.status,
    filter.sex,
    filter.dtks,
  ].filter((item) => item !== null && item !== "").length;
}

// --- Laporan rumah tangga --------------------------------------------------

/** Label untuk RTM yang belum diisi kelas sosialnya. */
export const RTM_TANPA_KELAS = "(Belum ada kelas sosial)";
/** Label untuk RTM yang wilayahnya belum ditentukan. */
export const RTM_TANPA_DUSUN = "(Belum ada dusun)";

/** Satu baris rekapitulasi RTM (per kelas sosial atau per dusun). */
interface RtmRekapRow {
  label: string;
  jumlahRtm: number;
  jumlahAnggota: number;
  percentage: number;
}

export interface RtmRekap {
  totalRtm: number;
  totalAnggota: number;
  perKelasSosial: RtmRekapRow[];
  perDusun: RtmRekapRow[];
}

/** Baris ringkas yang dibutuhkan rekapitulasi. */
export interface RtmRekapInput {
  kelasSosial: number | null;
  dusun: string | null;
  anggota: number;
}

/** Kelompokkan baris ringkas menjadi rekapitulasi (fungsi murni). */
function kelompokkan(
  rows: readonly RtmRekapInput[],
  kunci: (row: RtmRekapInput) => string,
): RtmRekapRow[] {
  const peta = new Map<string, { jumlahRtm: number; jumlahAnggota: number }>();

  for (const row of rows) {
    const label = kunci(row);
    const nilai = peta.get(label) ?? { jumlahRtm: 0, jumlahAnggota: 0 };
    nilai.jumlahRtm += 1;
    nilai.jumlahAnggota += row.anggota;
    peta.set(label, nilai);
  }

  const total = rows.length;

  return [...peta.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "id", { numeric: true }))
    .map(([label, nilai]) => ({
      label,
      jumlahRtm: nilai.jumlahRtm,
      jumlahAnggota: nilai.jumlahAnggota,
      percentage: total === 0 ? 0 : Math.round((nilai.jumlahRtm / total) * 10000) / 100,
    }));
}

/**
 * Rekapitulasi rumah tangga menurut kelas sosial dan dusun.
 *
 * Dua sudut pandang karena laporan desa lazim memakainya bersama: sebaran
 * kesejahteraan (kelas sosial) dan sebaran wilayah (dusun).
 */
export function hitungRekapRtm(rows: readonly RtmRekapInput[]): RtmRekap {
  return {
    totalRtm: rows.length,
    totalAnggota: rows.reduce((jumlah, row) => jumlah + row.anggota, 0),
    perKelasSosial: kelompokkan(rows, (row) =>
      row.kelasSosial === null ? RTM_TANPA_KELAS : `Kelas ${row.kelasSosial}`,
    ),
    perDusun: kelompokkan(rows, (row) =>
      row.dusun && row.dusun.trim() !== "" ? row.dusun.trim() : RTM_TANPA_DUSUN,
    ),
  };
}

/** CSV laporan rumah tangga (dua blok: kelas sosial & dusun). */
export function buildRtmRekapCsv(input: { namaDesa: string | null; rekap: RtmRekap }): string {
  const baris: string[][] = [
    ["Laporan Rumah Tangga (RTM)"],
    [input.namaDesa ?? "-"],
    [],
    ["Rumah Tangga", String(input.rekap.totalRtm)],
    ["Anggota", String(input.rekap.totalAnggota)],
    [],
    ["Menurut Kelas Sosial"],
    ["Kelas Sosial", "Jumlah RTM", "Jumlah Anggota", "Persentase"],
  ];

  const tambah = (rows: readonly RtmRekapRow[]) => {
    for (const row of rows) {
      baris.push([
        row.label,
        String(row.jumlahRtm),
        String(row.jumlahAnggota),
        `${row.percentage}%`,
      ]);
    }
  };

  tambah(input.rekap.perKelasSosial);
  baris.push([], ["Menurut Dusun"], ["Dusun", "Jumlah RTM", "Jumlah Anggota", "Persentase"]);
  tambah(input.rekap.perDusun);

  return `\uFEFF${toCsv(baris)}`;
}

/** Nama berkas CSV laporan rumah tangga. */
export function rtmRekapFilename(namaDesa: string | null): string {
  const slug =
    (namaDesa ?? "desa")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "desa";
  return `laporan-rumah-tangga-${slug}.csv`;
}
