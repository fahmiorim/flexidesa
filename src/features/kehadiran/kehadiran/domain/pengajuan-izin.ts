import { z } from "zod";

import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";

/**
 * Domain Pengajuan Izin Kehadiran.
 *
 * Meniru modul Kehadiran OpenSID (`kehadiran_pengajuan_izin_pamong` untuk
 * pengajuan dan `kehadiran_pengajuan_izin` untuk persetujuan). Data disimpan
 * pada tabel `cuti_pegawai` yang sudah dipakai halaman Absensi & Kepegawaian →
 * Cuti & Izin, sehingga tidak ada dua model pengajuan yang berjalan paralel.
 */

/** Slug resource RBAC untuk pengajuan milik pegawai sendiri. */
export const PENGAJUAN_IZIN_RESOURCE = RESOURCES.pengajuanIzin;

/** Slug resource RBAC untuk keputusan pejabat/operator. */
export const PERSETUJUAN_IZIN_RESOURCE = RESOURCES.persetujuanIzin;

/** Batas keterangan; sama dengan `maxlength="500"` form OpenSID. */
export const KETERANGAN_PENGAJUAN_MAKS = 500;

/**
 * Jenis pengajuan yang ditawarkan, mengikuti `JenisIzin` OpenSID.
 *
 * `nilai` adalah kode yang disimpan pada `cuti_pegawai.jenis`; empat nilai
 * pertama sudah dikenal mesin cuti/izin, dua sisanya ditambahkan agar seluruh
 * pilihan OpenSID tersedia.
 */
export const JENIS_PENGAJUAN_IZIN = [
  { nilai: "izin", label: "Izin", keterangan: "Izin karena keperluan pribadi atau keluarga" },
  {
    nilai: "cuti_sakit",
    label: "Sakit",
    keterangan: "Tidak masuk karena sakit atau kondisi kesehatan",
  },
  {
    nilai: "dinas_luar_kota",
    label: "Dinas Luar Kota",
    keterangan: "Perjalanan dinas ke luar kota atau wilayah",
  },
  { nilai: "cuti_tahunan", label: "Cuti", keterangan: "Cuti tahunan atau cuti khusus" },
  { nilai: "lainnya", label: "Lainnya", keterangan: "Alasan lain yang sah" },
] as const;

export type JenisPengajuanIzin = (typeof JENIS_PENGAJUAN_IZIN)[number]["nilai"];

export const JENIS_PENGAJUAN_NILAI: readonly JenisPengajuanIzin[] = JENIS_PENGAJUAN_IZIN.map(
  (item) => item.nilai,
);

/** Label jenis untuk tampilan; nilai tak dikenal ditampilkan apa adanya. */
export function labelJenisPengajuan(jenis: string): string {
  return JENIS_PENGAJUAN_IZIN.find((item) => item.nilai === jenis)?.label ?? jenis;
}

/** Lampiran surat dokter wajib untuk pengajuan sakit (aturan OpenSID). */
export function lampiranWajib(jenis: string): boolean {
  return jenis === "cuti_sakit";
}

export const STATUS_PENGAJUAN = ["menunggu", "disetujui", "ditolak"] as const;
export type StatusPengajuan = (typeof STATUS_PENGAJUAN)[number];

const STATUS_LABEL: Readonly<Record<string, string>> = {
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export function labelStatusPengajuan(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

/** Apakah string berupa tanggal ISO `YYYY-MM-DD` yang benar-benar ada. */
export function tanggalIsoValid(nilai: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nilai)) return false;
  const [teksTahun, teksBulan, teksHari] = nilai.split("-");
  const tahun = Number(teksTahun);
  const bulan = Number(teksBulan);
  const hari = Number(teksHari);
  const tanggal = new Date(Date.UTC(tahun, bulan - 1, hari));
  return (
    tanggal.getUTCFullYear() === tahun &&
    tanggal.getUTCMonth() === bulan - 1 &&
    tanggal.getUTCDate() === hari
  );
}

export const pengajuanIzinFormSchema = z
  .object({
    jenis: z.enum(JENIS_PENGAJUAN_NILAI as unknown as [string, ...string[]], {
      message: "Jenis izin harus dipilih.",
    }),
    mulai: z.string().trim().refine(tanggalIsoValid, "Tanggal mulai tidak valid."),
    selesai: z.string().trim().refine(tanggalIsoValid, "Tanggal selesai tidak valid."),
    keterangan: z
      .string()
      .trim()
      .min(1, "Keterangan wajib diisi.")
      .max(KETERANGAN_PENGAJUAN_MAKS, `Keterangan maksimal ${KETERANGAN_PENGAJUAN_MAKS} karakter.`),
  })
  .refine((values) => values.selesai >= values.mulai, {
    message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
    path: ["selesai"],
  });

export type PengajuanIzinFormInput = z.input<typeof pengajuanIzinFormSchema>;
export type PengajuanIzinFormValues = z.infer<typeof pengajuanIzinFormSchema>;

/**
 * Aturan lampiran: wajib untuk sakit, opsional untuk jenis lain.
 *
 * Dipisah dari skema karena lampiran diunggah sebagai berkas, bukan teks.
 */
export function validasiLampiranPengajuan(jenis: string, adaLampiran: boolean): string | null {
  if (lampiranWajib(jenis) && !adaLampiran)
    return "Lampiran surat dokter wajib untuk pengajuan sakit.";
  return null;
}

/** Satu baris pengajuan untuk UI. */
export interface PengajuanIzinRow {
  id: number;
  pegawaiId: number;
  nama: string;
  jabatan: string | null;
  jenis: string;
  mulai: string;
  selesai: string;
  durasi: number;
  keterangan: string;
  lampiran: string | null;
  status: string;
  catatan: string | null;
  /** Waktu pengajuan dalam ISO 8601; ditampilkan pada kolom Tanggal Pengajuan. */
  createdAt: string;
}

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Ubah `YYYY-MM-DD` menjadi "25 Desember 2026" tanpa bergeser zona waktu. */
export function formatTanggal(tanggal: string): string {
  if (!tanggalIsoValid(tanggal)) return tanggal;
  return FORMAT_TANGGAL.format(new Date(`${tanggal}T00:00:00.000Z`));
}

/** Rentang tanggal siap tampil, mis. "1 – 3 Desember 2026". */
export function formatRentang(mulai: string, selesai: string): string {
  if (mulai === selesai) return formatTanggal(mulai);
  return `${formatTanggal(mulai)} – ${formatTanggal(selesai)}`;
}

const FORMAT_WAKTU = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/** Waktu pengajuan siap tampil, mis. "25 November 2026 pukul 09.15". */
export function formatWaktuPengajuan(nilai: string): string {
  const parsed = new Date(nilai);
  if (Number.isNaN(parsed.getTime())) return nilai;
  return `${FORMAT_WAKTU.format(parsed).replace(".", ":")} WIB`;
}
