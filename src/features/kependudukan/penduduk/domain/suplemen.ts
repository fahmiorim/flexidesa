import { z } from "zod";

import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";

export const SUPLEMEN_RESOURCE = RESOURCES.suplemen;

export const SASARAN_PENDUDUK = 1;
export const SASARAN_KELUARGA = 2;

export const SASARAN_LABELS: Record<number, string> = {
  [SASARAN_PENDUDUK]: "Penduduk",
  [SASARAN_KELUARGA]: "Keluarga (KK)",
};

/**
 * Tipe kolom isian dinamis.
 *
 * `select-manual` memakai `pilihanKode` (daftar pilihan manual),
 * `select-otomatis` memakai `referensiKode` (nama tabel referensi).
 */
export const TIPE_FORM_ISIAN = [
  "date",
  "text",
  "number",
  "time",
  "textarea",
  "select-manual",
  "select-otomatis",
] as const;

type TipeFormIsian = (typeof TIPE_FORM_ISIAN)[number];

export const TIPE_FORM_ISIAN_LABELS: Record<string, string> = {
  date: "Tanggal",
  text: "Teks",
  number: "Angka",
  time: "Waktu",
  textarea: "Teks Panjang",
  "select-manual": "Pilihan Manual",
  "select-otomatis": "Pilihan Otomatis",
};

/**
 * Satu definisi kolom isian dinamis.
 *
 * Bentuk kanonis memakai camelCase; `bacaFormIsian` menerima bentuk
 * snake_case (`nama_kode`, `label_kode`, `deskripsi_kode`,
 * `pilihan_kode`, `referensi_kode`, `atribut`, `kolom`).
 */
const suplemenFormFieldSchema = z.object({
  label: z.string().min(1).max(100),
  tipe: z.enum(TIPE_FORM_ISIAN),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(),
  namaKode: z.string().max(100).optional().default(""),
  deskripsiKode: z.string().max(200).optional().default(""),
  pilihanKode: z.array(z.string().max(100)).max(50).optional().default([]),
  referensiKode: z.string().max(100).optional().default(""),
  atribut: z.string().max(500).optional().default(""),
  kolom: z.coerce.number().int().min(1).max(12).optional().nullable(),
});

export type SuplemenFormField = z.infer<typeof suplemenFormFieldSchema>;

/** Normalisasi satu field dari bentuk snake_case maupun kanonis. */
function normalisasiField(raw: Record<string, unknown>): SuplemenFormField | null {
  const teks = (key: string): string => (typeof raw[key] === "string" ? (raw[key] as string) : "");
  const label = teks("label") || teks("label_kode");
  const namaKode = teks("namaKode") || teks("nama_kode") || teks("nama") || label;
  const tipeRaw = teks("tipe") || teks("tipe_kode");
  const pilihan: string[] = [];
  const pilihanRaw = raw["pilihanKode"] ?? raw["pilihan_kode"] ?? raw["pilihan"] ?? raw["options"];
  if (Array.isArray(pilihanRaw)) {
    for (const item of pilihanRaw) {
      if (typeof item === "string" && item.trim() !== "") pilihan.push(item);
    }
  } else if (typeof pilihanRaw === "string" && pilihanRaw.trim() !== "") {
    for (const item of pilihanRaw.split(/[,;\n]/)) {
      const bersih = item.trim();
      if (bersih !== "") pilihan.push(bersih);
    }
  }
  const tipe: TipeFormIsian | null = (TIPE_FORM_ISIAN as readonly string[]).includes(tipeRaw)
    ? (tipeRaw as TipeFormIsian)
    : null;
  if (label.trim() === "" || !tipe) return null;
  const kolomRaw = raw["kolom"];
  const kolomParsed = Number(kolomRaw);
  return {
    label: label.slice(0, 100),
    tipe,
    required: Boolean(raw["required"] ?? raw["required_kode"] ?? false),
    options: pilihan.length > 0 ? pilihan : undefined,
    namaKode: namaKode.slice(0, 100),
    deskripsiKode: (teks("deskripsiKode") || teks("deskripsi_kode") || teks("deskripsi")).slice(
      0,
      200,
    ),
    pilihanKode: pilihan.slice(0, 50),
    referensiKode: (teks("referensiKode") || teks("referensi_kode") || teks("referensi")).slice(
      0,
      100,
    ),
    atribut: teks("atribut").slice(0, 500),
    kolom:
      Number.isInteger(kolomParsed) && kolomParsed >= 1 && kolomParsed <= 12 ? kolomParsed : null,
  };
}

/** Baca definisi `form_isian` dari JSON basis data (array, string JSON, atau kosong). */
export function bacaFormIsian(nilai: unknown): SuplemenFormField[] {
  if (nilai === null || nilai === undefined) return [];
  let raw: unknown = nilai;
  if (typeof nilai === "string") {
    try {
      raw = JSON.parse(nilai) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const hasil: SuplemenFormField[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const field = normalisasiField(item as Record<string, unknown>);
    if (field) hasil.push(field);
  }
  return hasil.slice(0, 20);
}

export const suplemenCreateSchema = z.object({
  nama: z.string().min(1, "Nama suplemen wajib diisi.").max(200),
  sasaran: z.coerce.number().int().default(SASARAN_PENDUDUK),
  keterangan: z.string().max(300, "Keterangan maksimal 300 karakter.").optional().nullable(),
  dataFormIsian: z.array(suplemenFormFieldSchema).optional().default([]),
});

export type SuplemenCreateInput = z.infer<typeof suplemenCreateSchema>;

export const suplemenUpdateSchema = suplemenCreateSchema.extend({
  id: z.coerce.number().int().positive(),
});

export type SuplemenUpdateInput = z.infer<typeof suplemenUpdateSchema>;

interface SuplemenListRow {
  id: number;
  nama: string;
  slug: string;
  sasaran: number;
  keterangan: string | null;
  terdataCount: number;
  updatedAt: string;
}

export interface ListSuplemenParams {
  page: number;
  perPage: number;
  search?: string;
  sasaran?: number;
}

export interface ListSuplemenResult {
  rows: SuplemenListRow[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

/** Keterangan satu baris terdata; varchar(100). */
const keteranganTerdataSchema = z
  .string()
  .max(100, "Keterangan maksimal 100 karakter.")
  .optional()
  .nullable();

export const suplemenTerdataSchema = z
  .object({
    suplemenId: z.coerce.number().int().positive(),
    pendudukId: z.coerce.number().int().positive().optional().nullable(),
    keluargaId: z.coerce.number().int().positive().optional().nullable(),
    keterangan: keteranganTerdataSchema,
    /** Isian dinamis per suplemen (kolom bebas yang dibentuk petugas). */
    isian: z.record(z.string(), z.string()).optional(),
  })
  .refine((value) => Boolean(value.pendudukId) !== Boolean(value.keluargaId), {
    message: "Pilih salah satu sasaran: penduduk atau keluarga.",
  });

export type SuplemenTerdataInput = z.infer<typeof suplemenTerdataSchema>;

/** Ubah terdata: sasaran tidak berubah, hanya keterangan & isian. */
export const suplemenTerdataUpdateSchema = z.object({
  suplemenId: z.coerce.number().int().positive(),
  terdataId: z.coerce.number().int().positive(),
  keterangan: keteranganTerdataSchema,
  isian: z.record(z.string(), z.string()).optional(),
});

export type SuplemenTerdataUpdateInput = z.infer<typeof suplemenTerdataUpdateSchema>;

/** Filter daftar terdata: jenis kelamin + dusun/RW/RT. */
export interface SuplemenTerdataFilter {
  search: string;
  gender: "male" | "female" | "all";
  dusun: string;
  rw: string;
  rt: string;
}

export const SUPLEMEN_TERDATA_FILTER_KOSONG: SuplemenTerdataFilter = {
  search: "",
  gender: "all",
  dusun: "",
  rw: "",
  rt: "",
};

function teksParam(value: string | null, maks: number): string {
  return (value ?? "").trim().slice(0, maks);
}

/** Baca filter terdata dari query string (halaman rincian dan cetak). */
export function parseFilterTerdata(searchParams: URLSearchParams): SuplemenTerdataFilter {
  const gender = searchParams.get("sex");
  return {
    search: teksParam(searchParams.get("q"), 100),
    gender: gender === "male" || gender === "female" ? gender : "all",
    dusun: teksParam(searchParams.get("dusun"), 100),
    rw: teksParam(searchParams.get("rw"), 10),
    rt: teksParam(searchParams.get("rt"), 10),
  };
}

/** Apakah filter terdata berbeda dari keadaan kosong (untuk label reset). */
export function filterTerdataAktif(filter: SuplemenTerdataFilter): number {
  let jumlah = 0;
  if (filter.search) jumlah += 1;
  if (filter.gender !== "all") jumlah += 1;
  if (filter.dusun) jumlah += 1;
  if (filter.rw) jumlah += 1;
  if (filter.rt) jumlah += 1;
  return jumlah;
}

export interface SuplemenTerdataRow {
  id: number;
  pendudukId: number | null;
  keluargaId: number | null;
  /** Label ringkas sasaran ("Nama — NIK" atau "KK nomor"). */
  label: string;
  /** Nomor KK penduduk (sasaran penduduk) atau nomor KK sasaran (keluarga). */
  nomorKk: string | null;
  /** NIK penduduk sasaran, atau NIK kepala keluarga untuk sasaran keluarga. */
  nik: string | null;
  /** Nama penduduk sasaran, atau nama kepala keluarga. */
  nama: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  gender: "male" | "female" | null;
  /** Alamat lengkap "alamat RT x / RW y Dusun z". */
  alamat: string | null;
  keterangan: string | null;
  /** Kolom isian dinamis terdata (lihat `suplemen-berkas.ts`). */
  isian: Record<string, string>;
  createdAt: string;
}

/** Opsi pemilih warga terdata (pencarian server-side). */
export interface SuplemenSasaranOption {
  id: number;
  /** Id penduduk untuk sasaran penduduk, id keluarga untuk sasaran keluarga. */
  text: string;
}

export interface SuplemenOption {
  id: number;
  label: string;
}

/** Opsi wilayah untuk filter terdata (dusun/RW/RT yang ada di desa). */
export interface WilayahFilterOptions {
  dusun: string[];
  rw: string[];
  rt: string[];
}

/** Label kolom isian: `jumlah_anak` → `Jumlah Anak`. */
export function labelKolomIsian(nama: string): string {
  const teks = nama.replace(/_/g, " ").trim();
  if (teks === "") return nama;
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

/** Susun alamat "alamat RT x / RW y Dusun z". */
export function formatAlamatTerdata(input: {
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  dusun: string | null;
}): string | null {
  const bagian = [input.alamat?.trim() || null].filter((item): item is string => Boolean(item));
  const wilayah = [
    input.rt ? `RT ${input.rt}` : null,
    input.rw ? `RW ${input.rw}` : null,
    input.dusun ? `Dusun ${input.dusun}` : null,
  ].filter((item): item is string => Boolean(item));
  if (wilayah.length > 0) bagian.push(wilayah.join(" / "));
  return bagian.length > 0 ? bagian.join(" ") : null;
}

/** Label sasaran dari konstanta (`SASARAN_LABELS`) dengan fallback aman. */
export function labelSasaran(sasaran: number): string {
  return SASARAN_LABELS[sasaran] ?? "Penduduk";
}
