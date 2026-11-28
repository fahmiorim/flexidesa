/**
 * Berkas pendukung data suplemen: isian dinamis, kolom impor, ekspor, rekap.
 *
 * Suplemen mengikuti perilaku data desa: setiap suplemen boleh punya kolom isian
 * tambahan sendiri (`data_form_isian`). Kolom itu tidak didefinisikan lebih
 * dulu — dibentuk dari pasangan nama/nilai yang diisi petugas — sehingga helper
 * di sini bekerja dengan kunci dinamis, bukan skema tetap.
 */

import { labelKolomIsian } from "@/features/kependudukan/penduduk/domain/suplemen";
import { toCsv } from "@/lib/csv";
import type { KolomImpor } from "@/lib/spreadsheet";

/** Panjang maksimum nama kolom isian dan nilai teksnya. */
export const MAKS_PANJANG_KOLOM_ISIAN = 60;
const MAKS_PANJANG_NILAI_ISIAN = 200;
/** Batas jumlah kolom isian per suplemen agar tabel tetap terbaca. */
const MAKS_KOLOM_ISIAN = 20;

/** Satu pasangan nama kolom → nilai isian. */
interface IsianPasangan {
  nama: string;
  nilai: string;
}

/** Data isian satu baris terdata. */
type IsianTerdata = Record<string, string>;

/**
 * Rapikan pasangan isian menjadi objek.
 *
 * Aturan: nama kolom dipangkas, baris tanpa nama diabaikan, nilai dipangkas,
 * dan nama yang berulang mengambil nilai yang terakhir diisi.
 */
export function normalisasiIsian(pasangan: readonly IsianPasangan[]): IsianTerdata {
  const hasil: IsianTerdata = {};

  for (const item of pasangan) {
    const nama = item.nama.trim().slice(0, MAKS_PANJANG_KOLOM_ISIAN);
    if (nama === "") continue;
    hasil[nama] = item.nilai.trim().slice(0, MAKS_PANJANG_NILAI_ISIAN);
  }

  return hasil;
}

/** Baca `data_form_isian` dari basis data (JSON, string JSON, atau kosong). */
export function bacaIsian(nilai: unknown): IsianTerdata {
  if (nilai === null || nilai === undefined) return {};

  if (typeof nilai === "string") {
    try {
      const parsed = JSON.parse(nilai) as unknown;
      return bacaIsian(parsed);
    } catch {
      return {};
    }
  }

  if (typeof nilai === "object") {
    const hasil: IsianTerdata = {};
    for (const [kunci, isi] of Object.entries(nilai as Record<string, unknown>)) {
      if (isi === null || isi === undefined) continue;
      if (typeof isi === "object") continue;
      const nama = kunci.trim();
      if (nama === "") continue;
      hasil[nama] = String(isi).slice(0, MAKS_PANJANG_NILAI_ISIAN);
    }
    return hasil;
  }

  return {};
}

/** Kumpulan nama kolom isian yang muncul di seluruh baris (urut abjad). */
export function kolomIsian(rows: readonly { isian: IsianTerdata }[]): string[] {
  const kunci = new Set<string>();
  for (const row of rows) {
    for (const nama of Object.keys(row.isian)) kunci.add(nama);
  }
  return [...kunci].sort((a, b) => a.localeCompare(b, "id")).slice(0, MAKS_KOLOM_ISIAN);
}

// --- Impor ------------------------------------------------------------------

/** Kunci kolom impor terdata suplemen. */
type KunciImporSuplemen = "sasaran";

/**
 * Kolom tetap pada berkas impor terdata.
 *
 * Kolom di luar daftar ini diperlakukan sebagai isian dinamis: dengan begitu
 * template suplemen apa pun (disabilitas, penerima bantuan, dst.) — termasuk
 * kolom Keterangan — bisa diimpor tanpa mengubah kode.
 */
export const KOLOM_IMPOR_SUPLEMEN: readonly KolomImpor<KunciImporSuplemen>[] = [
  {
    kunci: "sasaran",
    label: "NIK / No. KK",
    alias: ["nik", "no. kk", "no kk", "sasaran"],
    wajib: true,
  },
];

// --- Ekspor & laporan -------------------------------------------------------

/** Satu baris terdata untuk ekspor. */
export interface SuplemenEksporRow {
  /** NIK penduduk atau nomor KK, sesuai sasaran. */
  peserta: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  keterangan: string;
  isian: IsianTerdata;
}

/**
 * Catatan kaki berkas ekspor.
 * Ditulis di bawah tabel agar berkas hasil ekspor bisa dipakai ulang sebagai
 * berkas impor setelah kolom peserta disesuaikan.
 */
const CATATAN_EKSPOR_SUPLEMEN: readonly string[] = [
  "Catatan:",
  "1. Sesuaikan kolom peserta (A) berdasarkan sasaran : - penduduk = nik, - keluarga = no. kk",
  "2. Kolom Peserta (A) wajib di isi",
  "3. Kolom (B, C, D, E) diambil dari database kependudukan",
  "4. Kolom (F) opsional",
];

/** CSV daftar terdata sebuah suplemen (kolom isian mengikuti data). */
export function buildSuplemenCsv(input: {
  namaDesa: string | null;
  namaSuplemen: string;
  sasaranLabel: string;
  keterangan?: string | null;
  rows: readonly SuplemenEksporRow[];
}): string {
  const kolom = kolomIsian(input.rows);
  const header = [
    "Peserta",
    "Nama",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Alamat",
    "Keterangan",
    ...kolom.map((nama) => labelKolomIsian(nama)),
  ];

  const data = input.rows.map((row) => [
    row.peserta || "-",
    row.nama.toUpperCase(),
    row.tempatLahir || "-",
    row.tanggalLahir || "-",
    row.alamat || "-",
    row.keterangan || "-",
    ...kolom.map((nama) => row.isian[nama] ?? "-"),
  ]);

  return `\uFEFF${toCsv([
    ["Data Suplemen"],
    [input.namaSuplemen],
    [`Sasaran: ${input.sasaranLabel}`],
    [`Keterangan: ${input.keterangan ?? "-"}`],
    [input.namaDesa ?? "-"],
    [],
    header,
    ...data,
    ["###"],
    [],
    ...CATATAN_EKSPOR_SUPLEMEN.map((baris) => [baris]),
  ])}`;
}

/**
 * CSV contoh format impor terdata.
 *
 * Kolom pertama selalu NIK / No. KK (mengikuti sasaran), kolom kedua
 * Keterangan, lalu kolom isian dinamis suplemen bila sudah didefinisikan.
 */
export function buildSuplemenImporTemplateCsv(input: {
  sasaranLabel: string;
  kolomIsian?: readonly string[];
}): string {
  const header = [
    input.sasaranLabel === "Penduduk" ? "NIK" : "No. KK",
    "Keterangan",
    ...(input.kolomIsian ?? []),
  ];
  return `\uFEFF${toCsv([header, ["###"]])}`;
}

export function suplemenFilename(namaSuplemen: string): string {
  const slug =
    namaSuplemen
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "suplemen";
  return `suplemen-${slug}.csv`;
}

/** Rekapitulasi seluruh suplemen desa. */
interface SuplemenRekapInput {
  id: number;
  nama: string;
  sasaran: number;
  jumlahTerdata: number;
}

interface SuplemenRekapRow {
  nama: string;
  sasaran: string;
  jumlahTerdata: number;
  percentage: number;
}

interface SuplemenRekap {
  totalSuplemen: number;
  totalTerdata: number;
  rows: SuplemenRekapRow[];
}

/** Hitung rekapitulasi suplemen (fungsi murni). */
export function hitungRekapSuplemen(
  rows: readonly SuplemenRekapInput[],
  labelSasaran: (sasaran: number) => string,
): SuplemenRekap {
  const totalTerdata = rows.reduce((jumlah, row) => jumlah + row.jumlahTerdata, 0);

  return {
    totalSuplemen: rows.length,
    totalTerdata,
    rows: [...rows]
      .sort((a, b) => b.jumlahTerdata - a.jumlahTerdata || a.nama.localeCompare(b.nama, "id"))
      .map((row) => ({
        nama: row.nama,
        sasaran: labelSasaran(row.sasaran),
        jumlahTerdata: row.jumlahTerdata,
        percentage:
          totalTerdata === 0 ? 0 : Math.round((row.jumlahTerdata / totalTerdata) * 10000) / 100,
      })),
  };
}

/** CSV rekapitulasi suplemen. */
export function buildSuplemenRekapCsv(input: {
  namaDesa: string | null;
  rekap: SuplemenRekap;
}): string {
  const baris: string[][] = [
    ["Rekapitulasi Data Suplemen"],
    [input.namaDesa ?? "-"],
    [],
    ["Jumlah suplemen", String(input.rekap.totalSuplemen)],
    ["Jumlah terdata", String(input.rekap.totalTerdata)],
    [],
    ["Suplemen", "Sasaran", "Terdata", "Persentase"],
  ];

  for (const row of input.rekap.rows) {
    baris.push([row.nama, row.sasaran, String(row.jumlahTerdata), `${row.percentage}%`]);
  }

  return `\uFEFF${toCsv(baris)}`;
}

export function suplemenRekapFilename(namaDesa: string | null): string {
  const slug =
    (namaDesa ?? "desa")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "desa";
  return `rekap-suplemen-${slug}.csv`;
}
