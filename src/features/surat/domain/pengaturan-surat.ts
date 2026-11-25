import type { z } from "zod";

import {
  FIELD_PENDUDUK_LUAR,
  FORMAT_TANGGAL_SURAT,
  pengaturanSchema,
  type FieldPendudukLuar,
  type FormatTanggalSurat,
  type PosisiLogoSurat,
} from "@/features/pengaturan/domain/pengaturan";

/**
 * Bagian pengaturan global surat.
 *
 * Hanya kunci `surat.*` yang boleh diubah dari halaman Pengaturan Surat;
 * pengaturan lain (komentar, berita beranda, pendaftaran warga) disimpan ulang
 * apa adanya agar tidak ikut ter-reset.
 */
export const skemaPengaturanSurat = pengaturanSchema.pick({
  suratTinggiHeader: true,
  suratTinggiFooter: true,
  suratTemplateHeader: true,
  suratTemplateFooter: true,
  suratVerifikasiSekdes: true,
  suratVerifikasiKades: true,
  suratGantiDataKosong: true,
  suratFormatTanggal: true,
  suratPanjangNomor: true,
  suratMarginKiri: true,
  suratMarginAtas: true,
  suratMarginKanan: true,
  suratMarginBawah: true,
  suratPendudukLuarField: true,
  // `suratLogo` sengaja tidak dapat diisi lewat payload: nilainya hanya berasal
  // dari unggahan berkas yang divalidasi server.
  suratGarisGanda: true,
  suratLogoLebar: true,
  suratLogoPosisi: true,
});

export type PengaturanSuratPatch = z.infer<typeof skemaPengaturanSurat>;

/** Label isian penduduk luar pada formulir surat. */
export const LABEL_FIELD_PENDUDUK_LUAR: Readonly<Record<FieldPendudukLuar, string>> = {
  nik: "NIK",
  jenisKelamin: "Jenis kelamin",
  tempatLahir: "Tempat lahir",
  tanggalLahir: "Tanggal lahir",
  pekerjaan: "Pekerjaan",
  alamat: "Alamat",
  keterangan: "Keterangan",
};

/** Nama pilihan format tanggal surat. */
export const LABEL_FORMAT_TANGGAL: Readonly<Record<FormatTanggalSurat, string>> = {
  indonesia: "5 Oktober 2026",
  dmy: "05-10-2026",
  iso: "2026-10-05",
};

/** Nama pilihan posisi logo kop. */
export const LABEL_POSISI_LOGO: Readonly<Record<PosisiLogoSurat, string>> = {
  kiri: "Kiri",
  tengah: "Tengah",
};

export { FIELD_PENDUDUK_LUAR, FORMAT_TANGGAL_SURAT };
