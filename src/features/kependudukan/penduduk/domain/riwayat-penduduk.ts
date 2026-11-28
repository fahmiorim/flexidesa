import { z } from "zod";

import { toCsv } from "@/lib/csv";
import { optionalDigits, optionalIsoDate, optionalSelectId, optionalText } from "@/lib/forms";
import {
  RESIDENT_MUTATION_TYPE_LABELS,
  RESIDENT_MUTATION_TYPES,
  type ResidentMutationType,
} from "@/lib/resident-mutation";

import { LIFE_STATUSES, type LifeStatus } from "./penduduk";

export const MUTATION_TYPES = RESIDENT_MUTATION_TYPES;
export type MutationType = ResidentMutationType;

export const MUTATION_TYPE_LABELS = RESIDENT_MUTATION_TYPE_LABELS;

// --- Konstanta ----------------------------------------------------------

/** Sebab kematian. */
export const SEBAB_KEMATIAN = ["1", "2", "3", "4", "5", "6"] as const;
type SebabKematian = (typeof SEBAB_KEMATIAN)[number];
export const SEBAB_KEMATIAN_LABELS: Record<SebabKematian, string> = {
  "1": "Sakit biasa / tua",
  "2": "Wabah Penyakit",
  "3": "Kecelakaan",
  "4": "Kriminalitas",
  "5": "Bunuh Diri",
  "6": "Lainnya",
};

/** Yang menerangkan kematian. */
export const PENOLONG_KEMATIAN = ["1", "2", "3", "4"] as const;
type PenolongKematian = (typeof PENOLONG_KEMATIAN)[number];
export const PENOLONG_KEMATIAN_LABELS: Record<PenolongKematian, string> = {
  "1": "Dokter",
  "2": "Tenaga Kesehatan",
  "3": "Kepolisian",
  "4": "Lainnya",
};

/** Tujuan pindah. */
export const TUJUAN_PINDAH = ["1", "2", "3", "4"] as const;
type TujuanPindah = (typeof TUJUAN_PINDAH)[number];
export const TUJUAN_PINDAH_LABELS: Record<TujuanPindah, string> = {
  "1": "Pindah keluar Desa/Kelurahan",
  "2": "Pindah keluar Kecamatan",
  "3": "Pindah keluar Kabupaten/Kota",
  "4": "Pindah keluar Provinsi",
};

/** Detail peristiwa kematian/pindah yang disimpan pada `meta` mutasi. */
export interface MutasiDetailMeta {
  tempatMeninggal?: string | null;
  jamKematian?: string | null;
  sebab?: SebabKematian;
  penolong?: PenolongKematian;
  nomorAkta?: string | null;
  anakKe?: number;
  refPindah?: TujuanPindah;
  alamatTujuan?: string | null;
  fromLifeStatus?: LifeStatus;
  toLifeStatus?: LifeStatus;
  /** Penduduk tercatat sebagai kepala keluarga saat mutasi (kolom KK laporan). */
  kepalaKeluarga?: boolean;
}

/**
 * Pilihan status dasar baru:
 * penduduk tetap tidak dapat menjadi "Pergi", "Tidak Valid" tidak pernah
 * ditawarkan lewat mutasi, dan kepala KK yang anggotanya lebih dari satu
 * tidak dapat langsung dicatat "Mati" (KK harus dipecah dulu).
 */
export function opsiStatusDasar(input: {
  residenceStatus: "permanent" | "temporary";
  kepalaKeluarga: boolean;
  jumlahAnggotaKk: number;
}): LifeStatus[] {
  const dapatMati = !(input.kepalaKeluarga && input.jumlahAnggotaKk > 1);
  const opsi: LifeStatus[] = [];
  if (dapatMati) opsi.push("deceased");
  opsi.push("moved", "missing");
  if (input.residenceStatus === "temporary") opsi.push("departed");
  return opsi;
}

export function labelDetailMeta(meta: MutasiDetailMeta): string[] {
  const baris: string[] = [];
  if (meta.tempatMeninggal) baris.push(`Meninggal di ${meta.tempatMeninggal}`);
  if (meta.jamKematian) baris.push(`Jam ${meta.jamKematian}`);
  if (meta.sebab) baris.push(SEBAB_KEMATIAN_LABELS[meta.sebab]);
  if (meta.penolong) baris.push(PENOLONG_KEMATIAN_LABELS[meta.penolong]);
  if (meta.nomorAkta) baris.push(`Akta ${meta.nomorAkta}`);
  if (meta.refPindah) baris.push(TUJUAN_PINDAH_LABELS[meta.refPindah]);
  if (meta.alamatTujuan) baris.push(meta.alamatTujuan);
  return baris;
}

export function normalisasiMutationType(value: string | null | undefined): MutationType | "all" {
  return (MUTATION_TYPES as readonly string[]).includes(value ?? "")
    ? (value as MutationType)
    : "all";
}

export function normalisasiTanggal(value: string | null | undefined): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export const catatKelahiranSchema = z.object({
  eventDate: z.iso.date("Tanggal lahir tidak valid."),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Maksimal 100 karakter."),
  nationalId: optionalDigits(16),
  gender: z.enum(["male", "female"]).optional().or(z.literal("")),
  familyId: optionalSelectId,
  familyRelationId: optionalSelectId,
  regionId: optionalSelectId,
  address: optionalText(255),
  fatherName: optionalText(100),
  motherName: optionalText(100),
  reason: optionalText(255),
  notes: optionalText(1000),
  referenceNo: optionalText(100),
});

export type CatatKelahiranInput = z.infer<typeof catatKelahiranSchema>;

const detailKematianSchema = z.object({
  tempatMeninggal: z.string().trim().max(50),
  jamKematian: z.string().trim().max(50),
  sebab: z.enum(SEBAB_KEMATIAN, { error: "Pilih penyebab kematian." }),
  penolong: z.enum(PENOLONG_KEMATIAN, { error: "Pilih yang menerangkan kematian." }),
  anakKe: z.coerce.number().int().min(1, "Anak ke- minimal 1."),
  nomorAkta: optionalText(50),
});

export const catatKematianSchema = z
  .object({
    residentId: z.coerce.number().int().positive("Pilih penduduk."),
    eventDate: z.iso.date("Tanggal meninggal tidak valid."),
    reportDate: z.iso.date("Tanggal lapor tidak valid.").optional().or(z.literal("")),
    notes: optionalText(1000),
    referenceNo: optionalText(100),
    ...detailKematianSchema.shape,
  })
  .refine((data) => !data.reportDate || data.reportDate >= data.eventDate, {
    error: "Tanggal lapor harus sama atau lebih besar dari tanggal peristiwa.",
    path: ["reportDate"],
  });

export type CatatKematianInput = z.infer<typeof catatKematianSchema>;

export const catatPindahKeluarSchema = z
  .object({
    residentId: z.coerce.number().int().positive("Pilih penduduk."),
    eventDate: z.iso.date("Tanggal pindah tidak valid."),
    reportDate: z.iso.date("Tanggal lapor tidak valid.").optional().or(z.literal("")),
    toAddress: optionalText(255),
    destination: optionalText(255),
    refPindah: z.enum(TUJUAN_PINDAH, { error: "Pilih tujuan pindah." }),
    alamatTujuan: z.string().trim().min(1, "Alamat tujuan wajib diisi.").max(255),
    reason: optionalText(255),
    notes: optionalText(1000),
    referenceNo: optionalText(100),
  })
  .refine((data) => !data.reportDate || data.reportDate >= data.eventDate, {
    error: "Tanggal lapor harus sama atau lebih besar dari tanggal peristiwa.",
    path: ["reportDate"],
  });

export type CatatPindahKeluarInput = z.infer<typeof catatPindahKeluarSchema>;

export const catatDatangSchema = z.object({
  eventDate: z.iso.date("Tanggal datang tidak valid."),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Maksimal 100 karakter."),
  nationalId: optionalDigits(16),
  gender: z.enum(["male", "female"]).optional().or(z.literal("")),
  birthDate: optionalIsoDate,
  birthPlace: optionalText(100),
  familyId: optionalSelectId,
  familyRelationId: optionalSelectId,
  regionId: optionalSelectId,
  address: optionalText(255),
  fromAddress: optionalText(255),
  reason: optionalText(255),
  notes: optionalText(1000),
  referenceNo: optionalText(100),
});

export type CatatDatangInput = z.infer<typeof catatDatangSchema>;

export const catatPerubahanSchema = z.object({
  residentId: z.coerce.number().int().positive("Pilih penduduk."),
  eventDate: z.iso.date("Tanggal perubahan tidak valid."),
  lifeStatus: z.enum(LIFE_STATUSES, { error: "Status kependudukan tidak valid." }),
  reason: optionalText(255),
  notes: optionalText(1000),
  referenceNo: optionalText(100),
});

export type CatatPerubahanInput = z.infer<typeof catatPerubahanSchema>;

/**
 * Ubah status dasar penduduk.
 * Status baru dibatasi `opsiStatusDasar`; detail kematian/pindah wajib
 * sesuai jenis status yang dipilih.
 */
export const ubahStatusDasarSchema = z
  .object({
    residentId: z.coerce.number().int().positive("Penduduk tidak valid."),
    lifeStatus: z.enum(["deceased", "moved", "missing", "departed"], {
      error: "Pilih status dasar baru.",
    }),
    eventDate: z.iso.date("Tanggal peristiwa tidak valid."),
    reportDate: z.iso.date("Tanggal lapor tidak valid."),
    notes: optionalText(1000),
    tempatMeninggal: optionalText(50),
    jamKematian: optionalText(50),
    sebab: z.enum(SEBAB_KEMATIAN).optional().or(z.literal("")),
    penolong: z.enum(PENOLONG_KEMATIAN).optional().or(z.literal("")),
    anakKe: z.coerce.number().int().min(1).optional(),
    nomorAkta: optionalText(50),
    refPindah: z.enum(TUJUAN_PINDAH).optional().or(z.literal("")),
    alamatTujuan: optionalText(255),
  })
  .superRefine((data, ctx) => {
    if (data.reportDate < data.eventDate) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal lapor harus sama atau lebih besar dari tanggal peristiwa.",
        path: ["reportDate"],
      });
    }
    if (data.lifeStatus === "deceased") {
      if (!data.tempatMeninggal) {
        ctx.addIssue({
          code: "custom",
          message: "Tempat meninggal wajib diisi.",
          path: ["tempatMeninggal"],
        });
      }
      if (!data.sebab) {
        ctx.addIssue({ code: "custom", message: "Pilih penyebab kematian.", path: ["sebab"] });
      }
      if (!data.penolong) {
        ctx.addIssue({
          code: "custom",
          message: "Pilih yang menerangkan kematian.",
          path: ["penolong"],
        });
      }
      if (data.anakKe === undefined) {
        ctx.addIssue({ code: "custom", message: "Isi anak ke-.", path: ["anakKe"] });
      }
    }
    if (data.lifeStatus === "moved") {
      if (!data.refPindah) {
        ctx.addIssue({ code: "custom", message: "Pilih tujuan pindah.", path: ["refPindah"] });
      }
      if (!data.alamatTujuan) {
        ctx.addIssue({
          code: "custom",
          message: "Alamat tujuan wajib diisi.",
          path: ["alamatTujuan"],
        });
      }
    }
  });

export type UbahStatusDasarInput = z.infer<typeof ubahStatusDasarSchema>;

export interface RiwayatPendudukRow {
  id: number;
  villageId: number;
  residentId: number | null;
  type: MutationType;
  eventDate: string;
  reportedAt: Date;
  actorId: string | null;
  reason: string | null;
  notes: string | null;
  referenceNo: string | null;
  fromRegionId: number | null;
  toRegionId: number | null;
  fromAddress: string | null;
  toAddress: string | null;
  meta: unknown;
  residentName: string | null;
  residentNationalId: string | null;
  actorName: string | null;
  gender: "male" | "female" | null;
  birthDate: string | null;
  lifeStatus: LifeStatus | null;
  religionId: number | null;
  religionName: string | null;
  familyNumber: string | null;
  familyHeadName: string | null;
  dusun: string | null;
  rw: string | null;
  rt: string | null;
}

export interface ListRiwayatParams {
  page?: number;
  perPage?: number;
  type?: MutationType | "all";
  q?: string;
  from?: string;
  to?: string;
  /** Filter riwayat penduduk. */
  year?: number | null;
  month?: number | null;
  gender?: "male" | "female" | null;
  religionId?: number | null;
  regionId?: number | null;
}

export interface ListRiwayatResult {
  rows: RiwayatPendudukRow[];
  total: number;
  page: number;
  perPage: number;
}

/** Teks CSV riwayat penduduk, memakai pemisah dan BOM yang sama dengan laporan. */
export function buildRiwayatPendudukCsv(input: {
  namaDesa: string | null;
  rows: RiwayatPendudukRow[];
}): string {
  const rows: string[][] = [
    ["Riwayat Penduduk"],
    ["Desa", input.namaDesa ?? "-"],
    [],
    ["Tanggal", "Jenis", "Nama", "NIK", "No. Surat", "Alasan", "Keterangan"],
    ...input.rows.map((row) => [
      row.eventDate,
      MUTATION_TYPE_LABELS[row.type] ?? row.type,
      row.residentName ?? "-",
      row.residentNationalId ?? "-",
      row.referenceNo ?? "-",
      row.reason ?? "-",
      row.notes ?? "-",
    ]),
  ];

  return `\uFEFF${toCsv(rows)}`;
}

export function riwayatPendudukFilename(namaDesa: string | null): string {
  const slug =
    (namaDesa ?? "desa")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "desa";
  return `riwayat-penduduk-${slug}.csv`;
}
