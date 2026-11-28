import { z } from "zod";

import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { optionalIsoDate, optionalSelectId, optionalText } from "@/lib/forms";

import { MAKS_PENDUDUK_LUAR, MAKS_PENGIKUT, pendudukLuarSchema } from "./pengikut";

export const SURAT_RESOURCE = RESOURCES.surat;
export const JENIS_SURAT_RESOURCE = RESOURCES.pengaturanSurat;
export const KLASIFIKASI_SURAT_RESOURCE = RESOURCES.klasifikasiSurat;
export const SYARAT_SURAT_RESOURCE = RESOURCES.syaratSurat;
export const SURAT_MASUK_RESOURCE = RESOURCES.suratMasuk;
export const SURAT_KELUAR_RESOURCE = RESOURCES.suratKeluar;
export const SURAT_DINAS_RESOURCE = RESOURCES.suratDinas;

// --- Status surat ----------------------------------------------------------

export const LETTER_STATUSES = ["draft", "verifikasi", "issued", "cancelled"] as const;

/** Ukuran halaman daftar surat; dipakai halaman dan use case agar konsisten. */
export const SURAT_PER_HALAMAN = 20;
export const SURAT_MAKS_PER_HALAMAN = 100;
export type LetterStatus = (typeof LETTER_STATUSES)[number];

export const LETTER_STATUS_LABELS: Readonly<Record<LetterStatus, string>> = {
  draft: "Konsep",
  verifikasi: "Menunggu Verifikasi",
  issued: "Terbit",
  cancelled: "Dibatalkan",
};

// --- Verification status (berjenjang) ----------------------------------------

export const VERIFICATION_STEPS = ["operator", "sekdes", "kades"] as const;
export type VerificationStep = (typeof VERIFICATION_STEPS)[number];


export const VERIFICATION_STEP_LABELS: Readonly<Record<VerificationStep, string>> = {
  operator: "Operator",
  sekdes: "Sekretaris Desa",
  kades: "Kepala Desa",
};

/** Slug role yang boleh menjalankan tiap tahap verifikasi. */
export const VERIFICATION_STEP_ROLE_SLUGS: Readonly<Record<VerificationStep, readonly string[]>> = {
  operator: ["operator"],
  // Role bawaan template tenant bernama "sekretaris"; "sekretaris-desa"
  // dipertahankan untuk data lama/ekspor yang masih memakai slug itu.
  sekdes: ["sekretaris", "sekretaris-desa"],
  kades: ["kepala-desa"],
};

/**
 * Tahap verifikasi berikutnya, atau `null` bila surat tidak sedang menunggu
 * verifikasi. Tahap hanya boleh dilompati lewat persetujuan berurutan.
 */
export function nextVerificationStep(surat: {
  status: LetterStatus;
  verifikasiOperator: boolean | null;
  verifikasiSekdes: boolean | null;
  verifikasiKades: boolean | null;
}): VerificationStep | null {
  if (surat.status !== "verifikasi") return null;
  if (!surat.verifikasiOperator) return "operator";
  if (!surat.verifikasiSekdes) return "sekdes";
  if (!surat.verifikasiKades) return "kades";
  return null;
}

/** Validasi urutan tahap: hanya tahap berikutnya yang boleh dijalankan. */
export function canVerifyStep(
  surat: Parameters<typeof nextVerificationStep>[0],
  step: VerificationStep,
): boolean {
  return nextVerificationStep(surat) === step;
}

/** Validasi peran: super admin boleh semua tahap, role lain hanya tahapnya. */
export function roleCanVerifyStep(
  step: VerificationStep,
  roleSlug: string | null,
  isSuperadmin: boolean,
): boolean {
  if (isSuperadmin) return true;
  return roleSlug !== null && VERIFICATION_STEP_ROLE_SLUGS[step].includes(roleSlug);
}

/** Semua tahap verifikasi yang boleh dijalankan role ini (superadmin: semua). */
export function tahapanUntukRole(
  roleSlug: string | null,
  isSuperadmin: boolean,
): VerificationStep[] {
  return VERIFICATION_STEPS.filter((step) => roleCanVerifyStep(step, roleSlug, isSuperadmin));
}

// --- Placeholder -----------------------------------------------------------

export const SURAT_PLACEHOLDERS = [
  { key: "lampiran", label: "Daftar lampiran surat" },
  { key: "nama_desa", label: "Nama desa" },
  { key: "kode_desa", label: "Kode desa" },
  { key: "nama_kecamatan", label: "Nama kecamatan" },
  { key: "nama_kabupaten", label: "Nama kabupaten/kota" },
  { key: "nama_propinsi", label: "Nama provinsi" },
  { key: "alamat_kantor", label: "Alamat kantor desa" },
  { key: "telepon_desa", label: "Telepon desa" },
  { key: "email_desa", label: "Email desa" },
  { key: "nama", label: "Nama penduduk" },
  { key: "nik", label: "NIK penduduk" },
  { key: "tempat_lahir", label: "Tempat lahir" },
  { key: "tanggal_lahir", label: "Tanggal lahir" },
  { key: "jenis_kelamin", label: "Jenis kelamin" },
  { key: "agama", label: "Agama" },
  { key: "pekerjaan", label: "Pekerjaan" },
  { key: "akta_lahir", label: "Nomor akta lahir" },
  { key: "akta_kawin", label: "Nomor akta kawin" },
  { key: "tanggal_kawin", label: "Tanggal perkawinan" },
  { key: "akta_cerai", label: "Nomor akta cerai" },
  { key: "tanggal_cerai", label: "Tanggal perceraian" },
  { key: "nomor_paspor", label: "Nomor paspor" },
  { key: "tanggal_akhir_paspor", label: "Tanggal akhir paspor" },
  { key: "nomor_kitas", label: "Nomor KITAS" },
  { key: "suku", label: "Suku/etnis" },
  { key: "keterangan_penduduk", label: "Keterangan penduduk" },
  { key: "alamat", label: "Alamat penduduk" },
  { key: "no_kk", label: "Nomor Kartu Keluarga" },
  { key: "nomor_surat", label: "Nomor surat (otomatis)" },
  { key: "tanggal_surat", label: "Tanggal surat" },
  { key: "keperluan", label: "Keperluan" },
  { key: "berlaku_sampai", label: "Berlaku sampai" },
] as const;

const BULAN_INDONESIA = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

const BULAN_ROMAWI = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

/** Tanggal ISO (`YYYY-MM-DD`) → "5 Oktober 2026"; nilai kosong → "-". */
export function formatTanggalIndonesia(value: string | null | undefined): string {
  if (!value) return "-";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const monthName = BULAN_INDONESIA[month - 1];

  return monthName ? `${day} ${monthName} ${year}` : value;
}

/** Bulan (1-12) → angka Romawi untuk format nomor surat. */
export function bulanRomawi(month: number): string {
  return BULAN_ROMAWI[month - 1] ?? "";
}

export const DEFAULT_NUMBER_FORMAT = "[kode_surat]/[nomor]/[kode_desa]/[tahun]";

interface NumberContext {
  /** Panjang nomor urut (nol di depan); 0/undefined = 3 digit seperti lama. */
  panjangNomor?: number;
  sequence: number;
  kodeSurat: string;
  kodeDesa: string;
  year: number;
  month: number;
}

/**
 * Isi format penomoran surat.
 *
 * Mendukung `[nomor]`/`[nomor_surat]` (otomatis 3 digit), `[nomor, N]`
 * (N digit), `[kode_surat]`, `[kode_desa]`, `[tahun]`, dan `[bulan_romawi]`.
 * Token `[format_nomor_surat]` adalah placeholder badan surat, bukan format
 * penomoran; nilainya diisi lewat `buildValues` saat render.
 */
export function buildSuratNumber(format: string, context: NumberContext): string {
  const withNumber = format.replace(
    /\[(?:nomor|nomor_surat)(?:\s*,\s*(\d+))?\]/gi,
    (_match, digits?: string) =>
      padNomorUrut(context.sequence, digits ? Number(digits) : (context.panjangNomor ?? 0)),
  );

  const values: Record<string, string> = {
    kode_surat: context.kodeSurat,
    kode_desa: context.kodeDesa,
    tahun: String(context.year),
    bulan_romawi: bulanRomawi(context.month),
  };

  return withNumber.replace(/\[([a-z_]+)\]/gi, (match, key: string) => {
    return values[key.toLowerCase()] ?? match;
  });
}

/**
 * Format tanggal surat sesuai pilihan desa.
 *
 * - `indonesia` → "5 Oktober 2026" (bawaan Appdes)
 * - `dmy` → "05-10-2026"
 * - `iso` → "2026-10-05"
 */
export function formatTanggalSurat(
  preset: "indonesia" | "dmy" | "iso",
  tanggal: string | null,
): string {
  if (!tanggal) return "-";
  const tanggalIso = tanggal.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalIso)) return tanggal;
  if (preset === "iso") return tanggalIso;
  if (preset === "dmy") {
    const [tahun, bulan, hari] = tanggalIso.split("-");
    return `${hari}-${bulan}-${tahun}`;
  }
  return formatTanggalIndonesia(tanggalIso);
}

/**
 * Nomor urut dengan nol di depan.
 *
 * `0` memakai lebar bawaan 3 digit seperti perilaku penomoran lama.
 */
function padNomorUrut(sequence: number, panjang: number): string {
  const lebar = panjang > 0 ? Math.min(panjang, 10) : 3;
  return String(Math.max(0, Math.trunc(sequence))).padStart(lebar, "0");
}

/** Ganti seluruh placeholder `[kode]` (tidak peka huruf besar/kecil). */
export function renderSuratTemplate(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  const normalized = new Map<string, string>();
  for (const [key, value] of Object.entries(values)) {
    normalized.set(key.toLowerCase(), value);
  }

  return template.replace(/\[([a-zA-Z0-9_]+)\]/g, (match, key: string) => {
    return normalized.get(key.toLowerCase()) ?? match;
  });
}

/** Data anggota keluarga yang dipakai placeholder `klg1_*` … `klg10_*`. */
export interface AnggotaKeluargaSurat {
  nik: string | null;
  nama: string;
  jenisKelamin: string;
  tempatLahir: string | null;
  /** Sudah diformat untuk tampilan surat. */
  tanggalLahir: string;
  usia: string;
  agama: string | null;
  pendidikan: string | null;
  pendidikanSedang: string | null;
  pekerjaan: string | null;
  statusKawin: string | null;
  hubunganKk: string | null;
  alamat: string | null;
  kewarganegaraan: string | null;
  golonganDarah: string | null;
  namaAyah: string | null;
  namaIbu: string | null;
  nikAyah: string | null;
  nikIbu: string | null;
}

/**
 * Bentuk placeholder anggota keluarga (`klg1_nama`, `klg2_nik`, dst.).
 *
 * Hanya anggota yang ada yang diisi; template yang merujuk anggota di luar
 * jumlah anggota keluarga akan mempertahankan placeholder aslinya. Kode yang
 * tersedia mengikuti acuan (`klgx_*`), termasuk alias
 * penulisan tanpa garis bawah seperti `tempatlahir` dan `tanggallahir`.
 */
export function buildKlgPlaceholders(
  anggota: readonly AnggotaKeluargaSurat[],
): Record<string, string> {
  const values: Record<string, string> = {};

  anggota.slice(0, 10).forEach((item, index) => {
    const prefix = `klg${index + 1}_`;
    const tempatTanggal = [item.tempatLahir, item.tanggalLahir]
      .filter((part) => part && part !== "-")
      .join(", ");

    values[`${prefix}no`] = String(index + 1);
    values[`${prefix}nik`] = item.nik ?? "-";
    values[`${prefix}nama`] = item.nama;
    values[`${prefix}jenis_kelamin`] = item.jenisKelamin;
    values[`${prefix}tempat_lahir`] = item.tempatLahir ?? "-";
    values[`${prefix}tempatlahir`] = item.tempatLahir ?? "-";
    values[`${prefix}tanggal_lahir`] = item.tanggalLahir;
    values[`${prefix}tanggallahir`] = item.tanggalLahir;
    values[`${prefix}ttl`] = tempatTanggal || "-";
    values[`${prefix}tempat_tgl_lahir`] = tempatTanggal || "-";
    values[`${prefix}usia`] = item.usia;
    values[`${prefix}agama`] = item.agama ?? "-";
    values[`${prefix}pendidikan`] = item.pendidikan ?? "-";
    values[`${prefix}pendidikan_kk`] = item.pendidikan ?? "-";
    values[`${prefix}pendidikan_sedang`] = item.pendidikanSedang ?? "-";
    values[`${prefix}pekerjaan`] = item.pekerjaan ?? "-";
    values[`${prefix}status_kawin`] = item.statusKawin ?? "-";
    values[`${prefix}hubungan_kk`] = item.hubunganKk ?? "-";
    values[`${prefix}alamat`] = item.alamat ?? "-";
    values[`${prefix}warga_negara`] = item.kewarganegaraan ?? "-";
    values[`${prefix}golongan_darah`] = item.golonganDarah ?? "-";
    values[`${prefix}nama_ayah`] = item.namaAyah ?? "-";
    values[`${prefix}nik_ayah`] = item.nikAyah ?? "-";
    values[`${prefix}nama_ibu`] = item.namaIbu ?? "-";
    values[`${prefix}nik_ibu`] = item.nikIbu ?? "-";
  });

  return values;
}

/** Kode placeholder anggota keluarga yang tersedia (untuk bantuan di UI). */

/**
 * Tambah bulan ke tanggal ISO (dipakai untuk masa berlaku surat).
 *
 * Hari dijepit ke hari terakhir bulan tujuan agar 31 Januari + 1 bulan menjadi
 * 28/29 Februari, bukan meluber ke awal Maret.
 */
export function addMonthsIso(value: string, months: number): string {
  if (months <= 0) return value;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const targetIndex = monthIndex + months;
  const targetYear = year + Math.floor(targetIndex / 12);
  const targetMonth = ((targetIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

  return `${String(targetYear).padStart(4, "0")}-${String(targetMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

// --- Pengajuan verifikasi: penegakan syarat ----------------------

/**
 * Pengajuan verifikasi dari jalur operator wajib konfirmasi syarat bila jenis
 * suratnya menuntut syarat. Jalur permohonan warga tidak butuh konfirmasi
 * ulang: warga sudah wajib mengunggah semua berkas syarat sebelum permohonan
 * bisa diperiksa, jadi admin cukup meneruskan.
 */
export function butuhKonfirmasiSyarat(jumlahSyarat: number): boolean {
  return jumlahSyarat > 0;
}

// --- Skema formulir --------------------------------------------------------

const codeField = z.string().trim().min(1, "Kode wajib diisi.").max(20, "Maksimal 20 karakter.");

const nameField = (label: string) =>
  z.string().trim().min(1, `${label} wajib diisi.`).max(150, "Maksimal 150 karakter.");

const selectedId = (message: string) =>
  z
    .string()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, message)
    .transform((value) => Number(value));

/** Batas kode klasifikasi; `kode` disimpan sampai 50 karakter. */
export const KLASIFIKASI_KODE_MAKS = 50;

/** Batas uraian klasifikasi (`uraian` mediumText). */
export const KLASIFIKASI_URAIAN_MAKS = 5000;

export const klasifikasiSuratFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kode wajib diisi.")
    .max(KLASIFIKASI_KODE_MAKS, `Maksimal ${KLASIFIKASI_KODE_MAKS} karakter.`),
  name: nameField("Nama klasifikasi"),
  /** `uraian` pada formulir. */
  description: z
    .string()
    .trim()
    .max(KLASIFIKASI_URAIAN_MAKS, "Maksimal 5.000 karakter.")
    .optional()
    .default(""),
  /** `enabled`. */
  isActive: z.boolean().optional().default(true),
});
export type KlasifikasiSuratInput = z.infer<typeof klasifikasiSuratFormSchema>;

export const syaratSuratFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama persyaratan wajib diisi.")
    .max(150, "Maksimal 150 karakter."),
  description: z.string().trim().max(255, "Maksimal 255 karakter.").optional().default(""),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isActive: z.boolean().optional().default(true),
});
export type SyaratSuratInput = z.infer<typeof syaratSuratFormSchema>;

/**
 * Satuan masa berlaku surat (`d` hari, `w` minggu, `M` bulan, `y` tahun).
 */
export const SATUAN_MASA_BERLAKU = [
  { nilai: "d", label: "Hari" },
  { nilai: "w", label: "Minggu" },
  { nilai: "M", label: "Bulan" },
  { nilai: "y", label: "Tahun" },
] as const;
const NILAI_SATUAN_MASA_BERLAKU = SATUAN_MASA_BERLAKU.map((item) => item.nilai) as [
  string,
  ...string[],
];

/** Orientasi kertas surat; nilai mengikuti pembaca layout PDF Appdes. */
export const ORIENTASI_SURAT = [
  { nilai: "potrait", label: "Potrait" },
  { nilai: "landscape", label: "Landscape" },
] as const;

/** Ukuran kertas: A1–A6, F4, Letter, dan Legal. */
export const UKURAN_SURAT = ["A4", "F4", "Letter", "Legal"] as const;

/** Pilihan tampilan header (1 semua, 2 halaman awal, 0 tidak). */
export const HEADER_SURAT = [
  { nilai: 1, label: "Semua halaman" },
  { nilai: 2, label: "Hanya halaman awal" },
  { nilai: 0, label: "Tidak" },
] as const;

/** Margin default (cm). */
export const MARGIN_SURAT_DEFAULT = { kiri: 3, atas: 2, kanan: 2, bawah: 2.5 } as const;

/** Label masa berlaku ringkas, mis. "6 Bulan". */
export function labelMasaBerlaku(nilai: number, satuan: string | null): string {
  if (!nilai) return "Tidak dibatasi";
  const label = SATUAN_MASA_BERLAKU.find((item) => item.nilai === satuan)?.label ?? "Bulan";
  return `${nilai} ${label}`;
}

/** Batas jumlah & panjang nama lampiran surat pada satu jenis surat. */
export const LAMPIRAN_MAKS = 20;
const LAMPIRAN_NAMA_MAKS = 100;

/**
 * Normalisasi daftar lampiran: buang spasi berlebih, kosong, dan duplikat.
 *
 * Lampiran disimpan sebagai JSON array string pada `letter_types.lampiran`.
 */
export function normalisasiLampiran(nama: readonly string[]): string[] {
  const hasil: string[] = [];
  for (const item of nama) {
    const bersih = item.trim().slice(0, LAMPIRAN_NAMA_MAKS);
    if (bersih && !hasil.includes(bersih)) hasil.push(bersih);
    if (hasil.length >= LAMPIRAN_MAKS) break;
  }
  return hasil;
}

/** Baca daftar lampiran tersimpan; nilai rusak dianggap kosong. */
export function parseDaftarLampiran(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalisasiLampiran(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return [];
  }
}

/** Apakah JSON daftar lampiran sah dan tidak melebihi batas. */
function daftarLampiranValid(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    if (parsed.length > LAMPIRAN_MAKS) return false;
    return parsed.every(
      (item) =>
        typeof item === "string" && item.trim().length > 0 && item.length <= LAMPIRAN_NAMA_MAKS,
    );
  } catch {
    return false;
  }
}

/**
 * Tanggal kedaluwarsa surat menurut satuan masa berlaku.
 *
 * `d` hari, `w` minggu, `M` bulan (bawaan), `y` tahun. Nilai 0 berarti surat
 * tidak dibatasi masa berlakunya.
 */
export function hitungBerlakuSampai(
  tanggal: string,
  nilai: number,
  satuan: string | null | undefined,
): string | null {
  if (!nilai || nilai <= 0) return null;
  const hari = satuan === "d" ? 1 : satuan === "w" ? 7 : null;
  if (hari !== null) {
    const dasar = new Date(`${tanggal}T00:00:00.000Z`);
    if (Number.isNaN(dasar.getTime())) return null;
    dasar.setUTCDate(dasar.getUTCDate() + nilai * hari);
    return dasar.toISOString().slice(0, 10);
  }
  return addMonthsIso(tanggal, satuan === "y" ? nilai * 12 : nilai);
}

/**
 * Susun `layout_config` dari pengaturan tampilan yang diketik petugas.
 *
 * Kolom-kolom bertipe pada `letter_types` menjadi sumber kebenaran; kolom JSON
 * hanya turunan yang dibaca `buildSuratPdf`. Kunci lain yang sudah ada pada
 * JSON lama dipertahankan agar konfigurasi khusus tidak hilang.
 */
export function susunLayoutConfig(
  input: {
    orientasi: string;
    ukuran: string;
    header: number;
    footer: boolean;
    marginGlobal: boolean;
    marginKiri: number;
    marginAtas: number;
    marginKanan: number;
    marginBawah: number;
    qrCode: boolean;
    qrCodeTte: boolean;
    logoGaruda: boolean;
  },
  lama?: string | null,
): string {
  let sebelumnya: Record<string, unknown> = {};
  if (lama) {
    try {
      const parsed: unknown = JSON.parse(lama);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        sebelumnya = parsed as Record<string, unknown>;
    } catch {
      sebelumnya = {};
    }
  }

  return JSON.stringify({
    ...sebelumnya,
    orientasi: input.orientasi,
    ukuran: input.ukuran,
    header: input.header,
    footer: input.footer,
    marginGlobal: input.marginGlobal,
    margin: {
      kiri: input.marginKiri,
      atas: input.marginAtas,
      kanan: input.marginKanan,
      bawah: input.marginBawah,
    },
    qrCode: input.qrCode,
    qrCodeTte: input.qrCodeTte,
    logoGaruda: input.logoGaruda,
  });
}

export const jenisSuratFormSchema = z.object({
  code: codeField,
  name: nameField("Nama jenis surat"),
  classificationId: optionalSelectId,
  templateBody: z
    .string()
    .trim()
    .min(1, "Badan surat wajib diisi.")
    .max(20000, "Maksimal 20.000 karakter."),
  /** Badan surat alternatif untuk varian template (opsional). */
  templateBodyAlt: z.string().trim().max(20000).optional().default(""),
  /** JSON daftar isian dinamis (lihat `domain/isian.ts`). */
  formIsian: z.string().trim().max(20000).optional().default("[]"),
  /** JSON daftar id syarat surat. */
  syaratSurat: z.string().trim().max(2000).optional().default("[]"),
  /** JSON daftar nama lampiran yang menyertai surat. */
  lampiran: z
    .string()
    .trim()
    .max(2000, "Daftar lampiran terlalu panjang.")
    .optional()
    .default("[]")
    .refine((value) => daftarLampiranValid(value), "Daftar lampiran tidak valid."),
  requiresResident: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
  /** Sediakan di layanan mandiri warga. */
  mandiri: z.boolean().optional().default(true),
  numberFormat: z
    .string()
    .trim()
    .max(100, "Maksimal 100 karakter.")
    .optional()
    .default(DEFAULT_NUMBER_FORMAT)
    .transform((value) => (value === "" ? DEFAULT_NUMBER_FORMAT : value)),
  validityMonths: z.coerce
    .number()
    .int("Masa berlaku harus bilangan bulat.")
    .min(0, "Minimal 0.")
    .max(31, "Maksimal 31, isi 0 bila tidak dibatasi.")
    .optional()
    .default(1),
  /** Satuan masa berlaku: d/w/M/y. */
  satuanMasaBerlaku: z.enum(NILAI_SATUAN_MASA_BERLAKU).optional().default("M"),
  /** `true` → format nomor desa dipakai; `false` → format per jenis surat. */
  formatNomorGlobal: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  /** Varian template aktif (mis. default, landscape, compact). */
  templateVariant: z.string().trim().max(50).optional().default("default"),
  /** JSON konfigurasi layout turunan; lihat `susunLayoutConfig`. */
  layoutConfig: z.string().trim().max(5000).optional().default("{}"),
  // --- Pengaturan tampilan ----------------------------------------------
  orientasi: z.enum(["potrait", "landscape"]).optional().default("potrait"),
  ukuran: z.enum(UKURAN_SURAT).optional().default("F4"),
  /** 1 = semua halaman, 2 = halaman awal, 0 = tidak tampil. */
  header: z.coerce
    .number()
    .int()
    .refine((value) => [0, 1, 2].includes(value), "Pilihan header tidak valid.")
    .optional()
    .default(1),
  footer: z.boolean().optional().default(true),
  marginGlobal: z.boolean().optional().default(true),
  marginKiri: z.coerce
    .number()
    .min(0, "Minimal 0 cm.")
    .max(10, "Maksimal 10 cm.")
    .optional()
    .default(MARGIN_SURAT_DEFAULT.kiri),
  marginAtas: z.coerce
    .number()
    .min(0, "Minimal 0 cm.")
    .max(10, "Maksimal 10 cm.")
    .optional()
    .default(MARGIN_SURAT_DEFAULT.atas),
  marginKanan: z.coerce
    .number()
    .min(0, "Minimal 0 cm.")
    .max(10, "Maksimal 10 cm.")
    .optional()
    .default(MARGIN_SURAT_DEFAULT.kanan),
  marginBawah: z.coerce
    .number()
    .min(0, "Minimal 0 cm.")
    .max(10, "Maksimal 10 cm.")
    .optional()
    .default(MARGIN_SURAT_DEFAULT.bawah),
  qrCode: z.boolean().optional().default(false),
  qrCodeTte: z.boolean().optional().default(false),
  logoGaruda: z.boolean().optional().default(false),
  /** Kirim ke kecamatan untuk TTE. */
  kecamatan: z.boolean().optional().default(false),
  /** Butuh data penduduk lain (memengaruhi izin layanan mandiri). */
  sumberPendudukBerulang: z.boolean().optional().default(false),
});
export type JenisSuratInput = z.infer<typeof jenisSuratFormSchema>;

export const suratFormSchema = z.object({
  typeId: selectedId("Jenis surat wajib dipilih."),
  residentId: optionalSelectId,
  letterDate: z.iso.date("Tanggal surat tidak valid."),
  purpose: optionalText(255),
  /** Nilai isian dinamis per jenis surat (kode isian → nilai). */
  isiSurat: z.record(z.string(), z.string()).optional().default({}),
  /** Id penduduk desa yang mengikuti surat (placeholder `pengikut<n>_*`). */
  pengikut: z.array(z.coerce.number().int().positive()).max(MAKS_PENGIKUT).optional(),
  /** Baris penduduk luar desa yang diisi manual (placeholder `luar<n>_*`). */
  luar: z.array(pendudukLuarSchema).max(MAKS_PENDUDUK_LUAR).optional(),
});
export type SuratInput = z.infer<typeof suratFormSchema>;

export const suratMasukFormSchema = z.object({
  agendaNumber: z.coerce.number().int().min(0, "Minimal 0.").max(99999).optional().default(0),
  receivedDate: z.iso.date("Tanggal penerimaan tidak valid."),
  letterNumber: optionalText(50),
  letterDate: optionalIsoDate,
  sender: optionalText(150),
  classificationId: optionalSelectId,
  summary: optionalText(255),
  disposition: optionalText(255),
  archiveLocation: optionalText(150),
});
export type SuratMasukInput = z.infer<typeof suratMasukFormSchema>;

export const suratKeluarFormSchema = z.object({
  agendaNumber: z.coerce.number().int().min(0, "Minimal 0.").max(99999).optional().default(0),
  letterNumber: optionalText(50),
  letterDate: z.iso.date("Tanggal surat tidak valid."),
  recipient: optionalText(150),
  classificationId: optionalSelectId,
  summary: optionalText(255),
  sentDate: optionalIsoDate,
  archiveLocation: optionalText(150),
});
export type SuratKeluarInput = z.infer<typeof suratKeluarFormSchema>;

// --- Surat dinas --------------------------------------------------

export const suratDinasFormSchema = z.object({
  letterNumber: z
    .string()
    .trim()
    .min(1, "Nomor surat wajib diisi.")
    .max(100, "Maksimal 100 karakter."),
  letterDate: z.iso.date("Tanggal surat tidak valid."),
  recipient: optionalText(150),
  recipientAddress: optionalText(255),
  subject: z
    .string()
    .trim()
    .min(1, "Perihal surat wajib diisi.")
    .max(200, "Maksimal 200 karakter."),
  content: optionalText(4000),
  classificationId: optionalSelectId,
  /** Jalur media lampiran arsip (isi otomatis saat unggah). */
  archiveFile: optionalText(255),
  /** `true` → pengguna meminta lampiran arsip dihapus. */
  hapusArsip: z.boolean().optional().default(false),
  archiveLocation: optionalText(150),
});
export type SuratDinasInput = z.infer<typeof suratDinasFormSchema>;

// --- DTO -------------------------------------------------------------------

export interface KlasifikasiSuratDTO {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface JenisSuratDTO {
  id: number;
  code: string;
  name: string;
  classificationId: number | null;
  classificationName: string | null;
  templateBody: string;
  /** Badan surat alternatif untuk varian template (opsional). */
  templateBodyAlt: string | null;
  /** JSON daftar isian dinamis jenis surat ini. */
  formIsian: string | null;
  /** JSON daftar id syarat surat yang wajib dilengkapi. */
  syaratSurat: string | null;
  /** JSON daftar nama lampiran yang menyertai surat. */
  lampiran: string | null;
  requiresResident: boolean;
  isActive: boolean;
  /** Tersedia di layanan mandiri warga. */
  mandiri: boolean | null;
  numberFormat: string;
  validityMonths: number;
  sortOrder: number;
  /** Varian template aktif (mis. default, landscape, compact). */
  templateVariant: string | null;
  /** JSON konfigurasi layout turunan; lihat `susunLayoutConfig`. */
  layoutConfig: string | null;
  satuanMasaBerlaku: string | null;
  /** `1` = pakai format nomor desa, `0` = format per jenis surat. */
  formatNomorGlobal: number | null;
  orientasi: string | null;
  ukuran: string | null;
  header: number | null;
  footer: number | null;
  margin: string | null;
  qrCode: boolean | null;
  qrCodeTte: boolean | null;
  logoGaruda: boolean | null;
  kecamatan: boolean | null;
  sumberPendudukBerulang: boolean | null;
}

export interface SuratListRow {
  id: number;
  typeId: number;
  residentId: number | null;
  number: string | null;
  status: LetterStatus;
  letterDate: string;
  /** Tahun surat (dari letterDate). */
  year: number;
  typeName: string;
  typeCode: string | null;
  residentName: string | null;
  purpose: string | null;
  /** JSON nilai isian dinamis (kode isian → nilai). */
  nilaiIsian: string | null;
  createdAt: Date;
  issuedAt: Date | null;
  verifikasiOperator: boolean | null;
  verifikasiSekdes: boolean | null;
  verifikasiKades: boolean | null;
  logVerifikasi: string | null;
  catatanVerifikasi: string | null;
  /** Surat sudah ditandatangani elektronik (BSrE). */
  tte: boolean | null;
}

export interface SuratDetail extends SuratListRow {
  /** ID pengguna yang membuat konsep (untuk larangan verifikasi sendiri). */
  createdBy: string | null;
  content?: string | null;
  /** Jalur relatif berkas PDF hasil TTE (privat). */
  tteFile: string | null;
  /**
   * Token mentah untuk tautan verifikasi publik.
   *
   * Disimpan agar admin dapat mencetak ulang tautan/QR; pencarian publik tetap
   * memakai `verificationTokenHash` sehingga tidak bergantung pada PK numerik.
   */
  verificationToken: string | null;
}

/** Baris surat dinas. */
export interface SuratDinasDTO {
  id: number;
  letterNumber: string;
  letterDate: string;
  recipient: string | null;
  recipientAddress: string | null;
  subject: string;
  content: string | null;
  classificationId: number | null;
  classificationName: string | null;
  /** Jalur media lampiran arsip (bila ada). */
  archiveFile: string | null;
  archiveLocation: string | null;
}

/** Placeholder contoh untuk ditampilkan di formulir jenis surat. */

// ── Token verifikasi publik ──────────────────

/**
 * Panjang token mentah (byte). 32 byte = 256 bit entropy — tidak feasible
 * untuk di-brute-force tanpa kunci.
 */
const VERIFICATION_TOKEN_BYTES = 32;
/** Panjang token dalam representasi hex (2 char per byte). */
export const VERIFICATION_TOKEN_LENGTH = VERIFICATION_TOKEN_BYTES * 2;

/**
 * Hasil generate token: token mentah (dipakai di URL/QR) + hash (kunci
 * pencarian di DB). Keduanya hex-encoded.
 */
interface VerificationToken {
  token: string;
  hash: string;
}

/**
 * Hasilkan token verifikasi acak beserta hash SHA-256-nya.
 *
 * Token mentah ditampilkan di URL `/desa/verifikasi-surat/[token]` dan
 * disimpan agar tautan dapat dicetak ulang dari halaman surat. Hash dipakai
 * sebagai kunci pencarian sehingga halaman publik tidak pernah menerima PK
 * numerik surat.
 *
 * `crypto` diimpor secara dinamis agar fungsi ini bisa dipakai di test
 * (tanpa `server-only`) maupun di server action.
 */
export async function generateVerificationToken(): Promise<VerificationToken> {
  const { randomBytes, createHash } = await import("node:crypto");
  const token = randomBytes(VERIFICATION_TOKEN_BYTES).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

/**
 * Hash token dari klien (URL) untuk dipakai sebagai kunci pencarian di DB.
 */
export async function hashVerificationToken(token: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}
