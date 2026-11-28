import { z } from "zod";

import {
  HEAD_OF_FAMILY_RELATION_ID,
  type Gender,
  type LifeStatus,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import {
  isBlankSelection,
  optionalIsoDate,
  optionalSelectId,
  optionalText,
  type LabelOption,
} from "@/lib/forms";

/** Slug resource RBAC untuk modul keluarga (harus sama dengan `modules.slug`). */
export const KELUARGA_RESOURCE = RESOURCES.keluarga;

/**
 * `family_relations.id` untuk "KEPALA KELUARGA".
 *
 * Kepala keluarga tidak disimpan sebagai kolom, melainkan diturunkan dari
 * anggota yang punya hubungan keluarga ini.
 * Konstanta aslinya ada di domain penduduk agar aturan satu-kepala-per-KK dapat
 * ditegakkan saat menyimpan penduduk.
 */
export { HEAD_OF_FAMILY_RELATION_ID };

// --- Validasi formulir -----------------------------------------------------

/**
 * Nomor KK: 16 angka. Nomor kosong hanya boleh saat ditandai sementara; nomor
 * sementara yang dibuat server juga 16 angka dengan awalan `0`.
 */
const familyCardNumber = z.string().trim();

/** Nomor KK sementara ditandai awalan `0`. */
export function isTemporaryFamilyNumber(value: string): boolean {
  return value.startsWith("0");
}

/**
 * Kelas sosial keluarga.
 * Disimpan sebagai angka agar data lama/import tetap kompatibel.
 */
export const KELUARGA_WELFARE_CLASSES = [
  { value: 1, label: "Keluarga Pra Sejahtera" },
  { value: 2, label: "Keluarga Sejahtera I" },
  { value: 3, label: "Keluarga Sejahtera II" },
  { value: 4, label: "Keluarga Sejahtera III" },
  { value: 5, label: "Keluarga Sejahtera III Plus" },
] as const;

/** Label kelas sosial; `null` berarti belum ditetapkan. */
export function welfareClassLabel(value: number | null): string {
  return KELUARGA_WELFARE_CLASSES.find((item) => item.value === value)?.label ?? "Belum ditetapkan";
}

/** Kode kelas sosial opsional: kosong → `null`, selain itu 1–5. */
const optionalWelfareClass = z.preprocess(
  (value) => (isBlankSelection(value) ? null : value),
  z.coerce
    .number()
    .int()
    .min(1, "Kelas sosial tidak valid.")
    .max(5, "Kelas sosial tidak valid.")
    .nullable(),
);

/** Field keluarga yang dipakai untuk tambah dan ubah. */
export const keluargaFieldsSchema = z
  .object({
    number: familyCardNumber,
    temporary: z.boolean().default(false),
    address: optionalText(255),
    regionId: optionalSelectId,
    welfareClass: optionalWelfareClass,
    cardPrintedAt: optionalIsoDate,
  })
  .superRefine((value, ctx) => {
    if (value.number === "" && value.temporary) return;
    if (!/^\d{16}$/.test(value.number)) {
      ctx.addIssue({
        code: "custom",
        path: ["number"],
        message: "Nomor KK harus 16 angka, atau centang nomor sementara.",
      });
    }
  });

/**
 * Skema formulir tambah KK. `headResidentId` hanya berlaku saat membuat KK:
 * penduduk lepas yang dipilih akan langsung menjadi kepala keluarga.
 */
export const keluargaFormSchema = keluargaFieldsSchema.extend({
  headResidentId: optionalSelectId,
});

export type KeluargaFormInput = z.infer<typeof keluargaFieldsSchema>;
export type KeluargaCreateInput = z.infer<typeof keluargaFormSchema>;

/** Pilihan wajib (mis. kepala keluarga baru saat pecah KK). */
const requiredSelectId = z.preprocess(
  (value) => (isBlankSelection(value) ? undefined : value),
  z.coerce.number().int().positive("Pilih kepala keluarga baru."),
);

/** Field khusus pecah KK: nomor KK baru dan anggota yang menjadi kepala. */
export const pecahKeluargaSchema = z
  .object({
    number: familyCardNumber,
    temporary: z.boolean().default(false),
    headResidentId: requiredSelectId,
  })
  .superRefine((value, ctx) => {
    if (value.number === "" && value.temporary) return;
    if (!/^\d{16}$/.test(value.number)) {
      ctx.addIssue({
        code: "custom",
        path: ["number"],
        message: "Nomor KK harus 16 angka, atau centang nomor sementara.",
      });
    }
  });

export type PecahKeluargaInput = z.infer<typeof pecahKeluargaSchema>;

// --- Bentuk data untuk UI --------------------------------------------------

/** Bentuk data keluarga yang dikirim ke UI (tanpa kolom internal). */
export interface KeluargaDTO {
  id: number;
  number: string;
  /** Nomor belum final; diturunkan dari awalan `0`. */
  temporary: boolean;
  address: string | null;
  regionId: number | null;
  /** Kode kelas sosial 1–5, atau `null` bila belum ditetapkan. */
  welfareClass: number | null;
  /** Tanggal cetak KK (`YYYY-MM-DD`), atau `null`. */
  cardPrintedAt: string | null;
  /** Tanggal keluarga terdaftar. */
  registeredAt: string;
}

/** Baris tabel keluarga: DTO ditambah data turunan hasil join/agregasi. */
export interface KeluargaListRow extends KeluargaDTO {
  headName: string | null;
  headNationalId: string | null;
  headGender: Gender | null;
  headIdCardTag: string | null;
  headLifeStatus: LifeStatus | null;
  memberCount: number;
  regionLabel: string | null;
  dusun: string | null;
  rw: string | null;
  rt: string | null;
}

/** Filter daftar KK yang dipakai halaman, ekspor, cetak, dan unduh daftar. */
export interface KeluargaListFilter {
  search: string;
  status: KeluargaStatusFilter;
  gender: "male" | "female" | "all";
  regionId: number | null;
  temporaryOnly: boolean;
  programId: number | null;
  numbers: string[];
}

/** Ringkasan seluruh KK desa untuk kartu statistik halaman daftar. */
export interface KeluargaRingkasan {
  total: number;
  active: number;
  temporary: number;
  members: number;
}

/** Filter daftar KK yang tersedia. */
export const KELUARGA_STATUS_FILTERS = ["all", "active", "inactive", "empty"] as const;
export type KeluargaStatusFilter = (typeof KELUARGA_STATUS_FILTERS)[number];

export const KELUARGA_STATUS_LABELS: Readonly<Record<KeluargaStatusFilter, string>> = {
  all: "Semua status KK",
  active: "KK aktif (kepala keluarga hidup)",
  inactive: "Kepala keluarga hilang/pindah/mati",
  empty: "KK kosong (belum ada kepala keluarga)",
};

/** Penduduk lepas yang dapat dijadikan kepala keluarga baru. */
export interface KeluargaHeadCandidate {
  id: number;
  name: string;
  nationalId: string | null;
  address: string | null;
  regionId: number | null;
}

/** Batas jumlah KK pada satu aksi cetak/unduh agar respons tetap wajar. */
export const KELUARGA_BULK_MAX = 50;

/**
 * Baca daftar nomor KK dari satu isian (dipisah koma/spasi/baris baru).
 * Hanya nomor 16 angka yang dipakai; duplikat dibuang dan jumlahnya dibatasi.
 */
export function parseKeluargaNumbers(value: string): string[] {
  const numbers = value
    .split(/[^0-9]+/)
    .map((item) => item.trim())
    .filter((item) => /^\d{16}$/.test(item));
  return [...new Set(numbers)].slice(0, 20);
}

/** Baca filter daftar KK dari query string untuk ekspor/cetak/unduh. */
export function parseKeluargaFilter(searchParams: URLSearchParams): KeluargaListFilter {
  const rawStatus = searchParams.get("status");
  const status = KELUARGA_STATUS_FILTERS.includes(rawStatus as KeluargaStatusFilter)
    ? (rawStatus as KeluargaStatusFilter)
    : "all";
  const rawGender = searchParams.get("gender");
  const gender = rawGender === "male" || rawGender === "female" ? rawGender : "all";
  const rawRegion = Number(searchParams.get("regionId"));
  const rawProgram = Number(searchParams.get("program"));

  return {
    search: (searchParams.get("q") ?? "").trim().slice(0, 100),
    status,
    gender,
    regionId: Number.isInteger(rawRegion) && rawRegion > 0 ? rawRegion : null,
    temporaryOnly: searchParams.get("temporary") === "1",
    programId: Number.isInteger(rawProgram) && rawProgram > 0 ? rawProgram : null,
    numbers: parseKeluargaNumbers(searchParams.get("numbers") ?? ""),
  };
}

/** Sensor NIK/No. KK: delapan digit awal tetap terlihat. */
export function sensorIdentitas(value: string | null): string {
  if (!value) return "";
  if (value.length <= 8) return value;
  return `${value.slice(0, 8)}${"X".repeat(value.length - 8)}`;
}

/** Baca id KK dari query aksi massal, buang duplikat dan batasi jumlahnya. */
export function parseKeluargaIds(value: string | null): number[] {
  const ids = (value ?? "")
    .split(/[^0-9]+/)
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  return [...new Set(ids)].slice(0, KELUARGA_BULK_MAX);
}

/** Satu anggota keluarga untuk tampilan rincian. */
export interface KeluargaMember {
  id: number;
  name: string;
  nationalId: string | null;
  gender: Gender;
  birthDate: string | null;
  relationName: string | null;
}

/**
 * Anggota keluarga dengan data lengkap untuk cetak Kartu Keluarga.
 *
 * Dipisahkan dari `KeluargaMember` karena formulir rincian hanya butuh kolom
 * ringkas, sedangkan KK memerlukan kolom baku (agama, pendidikan, pekerjaan,
 * nama ayah/ibu, dst.). Nama-nama atribut mengikuti urutan kolom KK agar
 * pemetaannya ke berkas cetak mudah ditelusuri.
 */
export interface KeluargaMemberDetail extends KeluargaMember {
  birthPlace: string | null;
  religionName: string | null;
  educationName: string | null;
  occupationName: string | null;
  maritalStatusName: string | null;
  bloodTypeName: string | null;
  citizenshipName: string | null;
  passportNumber: string | null;
  kitasNumber: string | null;
  marriageDate: string | null;
  divorceDate: string | null;
  fatherName: string | null;
  motherName: string | null;
  /** Nomor RTM tempat anggota bernaung, bila sudah dibuat. */
  rtmNumber?: string | null;
}

/** Data referensi yang dibutuhkan formulir keluarga. */
export interface KeluargaReferenceData {
  regions: LabelOption[];
  headCandidates: LabelOption[];
  bantuanPrograms: LabelOption[];
}

/** Label ringkas keluarga, mis. "KK 3201012001120001". */
export function keluargaLabel(keluarga: Pick<KeluargaDTO, "number">): string {
  return `KK ${keluarga.number}`;
}

// --- Riwayat perubahan anggota ---------------------------------------------

/** Jenis perubahan keanggotaan yang dicatat. */
const AKSI_LOG_ANGGOTA = ["added", "removed", "role_changed"] as const;
type AksiLogAnggota = (typeof AKSI_LOG_ANGGOTA)[number];

export const AKSI_LOG_LABELS: Readonly<Record<AksiLogAnggota, string>> = {
  added: "Ditambahkan",
  removed: "Dikeluarkan",
  role_changed: "Hubungan berubah",
};

/** Keadaan keanggotaan seorang penduduk yang dibutuhkan untuk membandingkan. */
export interface AnggotaSnapshot {
  familyId: number | null;
  familyRelationId: number | null;
}

/** Satu perubahan yang harus dicatat pada sebuah KK. */
export interface PerubahanAnggota {
  familyId: number;
  aksi: AksiLogAnggota;
  /** Hubungan keluarga setelah perubahan (null saat dikeluarkan). */
  relationId: number | null;
}

/**
 * Tentukan perubahan keanggotaan KK dari keadaan sebelum → sesudah.
 *
 * Aturannya:
 * - sama-sama tanpa KK → tidak ada perubahan;
 * - KK sama tetapi hubungan berbeda → `role_changed`;
 * - pindah KK → `removed` pada KK lama **dan** `added` pada KK baru;
 * - masuk dari luar KK → `added`; keluar dari KK → `removed`.
 *
 * Fungsi murni ini dipakai saat menyimpan/mengubah/menghapus penduduk sehingga
 * riwayat selalu mencerminkan perubahan nyata, bukan setiap penyimpanan.
 */
export function bedakanPerubahanAnggota(
  sebelum: AnggotaSnapshot | null,
  sesudah: AnggotaSnapshot | null,
): PerubahanAnggota[] {
  const kkSebelum = sebelum?.familyId ?? null;
  const kkSesudah = sesudah?.familyId ?? null;
  const relSebelum = sebelum?.familyRelationId ?? null;
  const relSesudah = sesudah?.familyRelationId ?? null;

  if (kkSebelum === null && kkSesudah === null) return [];

  if (kkSebelum === kkSesudah) {
    if (relSebelum === relSesudah) return [];
    return [{ familyId: kkSesudah as number, aksi: "role_changed", relationId: relSesudah }];
  }

  const hasil: PerubahanAnggota[] = [];
  if (kkSebelum !== null) hasil.push({ familyId: kkSebelum, aksi: "removed", relationId: null });
  if (kkSesudah !== null) {
    hasil.push({ familyId: kkSesudah, aksi: "added", relationId: relSesudah });
  }
  return hasil;
}

/** Satu baris riwayat perubahan anggota untuk ditampilkan. */
export interface KeluargaAnggotaLog {
  id: number;
  createdAt: string;
  residentName: string;
  aksi: AksiLogAnggota;
  relationName: string | null;
  actorName: string | null;
}

/** Anggota KK pada halaman rincian (termasuk yang sudah meninggal/pindah). */
export interface KeluargaAnggotaRow {
  id: number;
  name: string;
  nationalId: string | null;
  gender: Gender;
  birthDate: string | null;
  lifeStatus: LifeStatus;
  relationId: number | null;
  relationName: string | null;
  /** Nomor RTM tempat anggota bernaung, bila sudah dibuat. */
  rtmNumber?: string | null;
}

/** Data lengkap satu KK untuk halaman rincian. */
export interface KeluargaDetail {
  keluarga: KeluargaDTO;
  regionLabel: string | null;
  headName: string | null;
  members: KeluargaAnggotaRow[];
  logs: KeluargaAnggotaLog[];
}

// --- Cetak Kartu Keluarga --------------------------------------------------

/** Isi kolom "Jenis Kelamin" pada KK. */
export function genderLabelKk(gender: Gender): string {
  return gender === "male" ? "LAKI-LAKI" : "PEREMPUAN";
}

const NAMA_BULAN = [
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

/**
 * Format tanggal ISO/timestamp menjadi `DD Bulan YYYY`.
 *
 * Timestamp database dapat berbentuk ISO lengkap; bagian tanggalnya saja yang
 * dipakai agar perbedaan zona waktu tidak menggeser hari.
 */
export function formatTanggalKeluarga(value: string | null): string | null {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-");
  const namaBulan = month ? NAMA_BULAN[Number(month) - 1] : null;
  if (!year || !day || !namaBulan) return null;
  return `${Number(day)} ${namaBulan} ${year}`;
}

/**
 * Tampilkan tanggal ISO (`YYYY-MM-DD`) dalam format Indonesia (`DD-MM-YYYY`).
 *
 * KK memakai format bertanda hubung; mengembalikan `null` bila tanggal tidak
 * tersedia agar pemanggil dapat menuliskan tanda kosong.
 */
export function tanggalKk(iso: string | null): string | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return null;
  return `${day}-${month}-${year}`;
}

/** Nama kepala keluarga (anggota dengan hubungan "kepala keluarga"). */
export function kepalaKeluarga(
  anggota: readonly KeluargaMemberDetail[],
): KeluargaMemberDetail | null {
  return anggota.find((row) => row.relationName?.toUpperCase().includes("KEPALA")) ?? null;
}
