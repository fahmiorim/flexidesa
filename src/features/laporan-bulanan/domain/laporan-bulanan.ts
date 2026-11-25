import { toCsv } from "@/lib/csv";

/**
 * Logika murni Laporan Kependudukan Bulanan (OpenSID: Laporan Perkembangan
 * Penduduk, Lampiran A-9).
 *
 * Laporan ini membandingkan keadaan penduduk pada awal dan akhir bulan serta
 * mencatat peristiwa yang terjadi di antaranya. Angka awal/akhir dihitung
 * langsung dari data (bukan diakumulasi dari baris peristiwa), sehingga laporan
 * tetap benar walau ada peristiwa yang tidak tercatat.
 */

export const NAMA_BULAN = [
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

/** Jumlah penduduk satu baris laporan, dipisah kewarganegaraan dan gender. */
export interface JumlahBulanan {
  wniL: number;
  wniP: number;
  wnaL: number;
  wnaP: number;
  /** Kepala keluarga laki-laki. */
  kkL: number;
  /** Kepala keluarga perempuan. */
  kkP: number;
}

/** Kode baris laporan, mengikuti urutan Lampiran A-9. */
export const BARIS_LAPORAN_BULANAN = [
  { kode: "awal", label: "Penduduk/Keluarga awal bulan ini" },
  { kode: "kelahiran", label: "Kelahiran/Keluarga baru bulan ini" },
  { kode: "kematian", label: "Kematian bulan ini" },
  { kode: "pendatang", label: "Pendatang bulan ini" },
  { kode: "pindah", label: "Pindah/Keluarga pergi bulan ini" },
  { kode: "hilang", label: "Penduduk hilang bulan ini" },
  { kode: "akhir", label: "Penduduk/Keluarga akhir bulan ini" },
] as const;

export type KodeBarisBulanan = (typeof BARIS_LAPORAN_BULANAN)[number]["kode"];

/** Data mentah seluruh baris laporan. */
export type SumberLaporanBulanan = Record<KodeBarisBulanan, JumlahBulanan>;

/** Satu baris siap tampil: jumlah turunan sudah dihitung di sini. */
export interface BarisLaporanBulanan extends JumlahBulanan {
  kode: KodeBarisBulanan;
  label: string;
  /** WNI + WNA laki-laki. */
  jmlL: number;
  /** WNI + WNA perempuan. */
  jmlP: number;
  /** Total penduduk baris ini. */
  jml: number;
  /** Kepala keluarga laki-laki + perempuan. */
  kk: number;
}

/** Jumlah kosong; dipakai bila sebuah kategori tidak punya data. */
export function jumlahKosong(): JumlahBulanan {
  return { wniL: 0, wniP: 0, wnaL: 0, wnaP: 0, kkL: 0, kkP: 0 };
}

/** Susun baris laporan sesuai urutan Lampiran A-9. */
export function susunBarisLaporan(sumber: SumberLaporanBulanan): BarisLaporanBulanan[] {
  return BARIS_LAPORAN_BULANAN.map(({ kode, label }) => {
    const nilai = sumber[kode];
    const jmlL = nilai.wniL + nilai.wnaL;
    const jmlP = nilai.wniP + nilai.wnaP;

    return {
      kode,
      label,
      ...nilai,
      jmlL,
      jmlP,
      jml: jmlL + jmlP,
      kk: nilai.kkL + nilai.kkP,
    };
  });
}

/** Periode laporan yang sudah divalidasi. Bulan 1–12. */
export interface PeriodeBulanan {
  tahun: number;
  bulan: number;
}

/** Tahun paling awal yang ditawarkan di pemilih periode. */
export const TAHUN_AWAL = 2000;

/**
 * Validasi periode dari query string.
 *
 * Nilai yang tidak masuk akal diganti periode berjalan agar halaman tetap
 * tampil, bukan gagal. Tahun dibatasi `TAHUN_AWAL`–(tahun ini + 1).
 */
export function normalisasiPeriode(
  tahun: string | number | null | undefined,
  bulan: string | number | null | undefined,
  sekarang = new Date(),
): PeriodeBulanan {
  const tahunAngka = Number(tahun);
  const bulanAngka = Number(bulan);
  const batasAtas = sekarang.getFullYear() + 1;

  return {
    tahun:
      Number.isInteger(tahunAngka) && tahunAngka >= TAHUN_AWAL && tahunAngka <= batasAtas
        ? tahunAngka
        : sekarang.getFullYear(),
    bulan:
      Number.isInteger(bulanAngka) && bulanAngka >= 1 && bulanAngka <= 12
        ? bulanAngka
        : sekarang.getMonth() + 1,
  };
}

/** Label periode, mis. "Januari 2026". */
export function labelPeriode({ tahun, bulan }: PeriodeBulanan): string {
  return `${NAMA_BULAN[bulan - 1] ?? ""} ${tahun}`;
}

/**
 * Rentang tanggal setengah terbuka `[mulai, selesai)` untuk satu bulan.
 *
 * Baris laporan bulanan memakai tanggal peristiwa, sehingga batas akhir harus
 * awal bulan berikutnya — bukan hari terakhir bulan — agar peristiwa pada hari
 * terakhir ikut terhitung.
 */
export function rentangPeriode({ tahun, bulan }: PeriodeBulanan): {
  mulai: string;
  selesai: string;
} {
  const dua = (angka: number) => String(angka).padStart(2, "0");
  const tahunSelesai = bulan === 12 ? tahun + 1 : tahun;
  const bulanSelesai = bulan === 12 ? 1 : bulan + 1;

  return {
    mulai: `${tahun}-${dua(bulan)}-01`,
    selesai: `${tahunSelesai}-${dua(bulanSelesai)}-01`,
  };
}

export interface LaporanBulananCsvInput {
  namaDesa: string | null;
  kecamatan: string | null;
  periode: PeriodeBulanan;
  baris: readonly BarisLaporanBulanan[];
}

/**
 * Teks CSV laporan bulanan.
 *
 * Susunan kolom sama dengan tabel pada layar agar hasil unduhan bisa langsung
 * dipakai sebagai lampiran cetak.
 */
export function buildLaporanBulananCsv(input: LaporanBulananCsvInput): string {
  const rows: string[][] = [
    ["Laporan Perkembangan Penduduk (Lampiran A-9)"],
    ["Desa", input.namaDesa ?? "-", "Kecamatan", input.kecamatan ?? "-"],
    ["Periode", labelPeriode(input.periode)],
    [],
    [
      "No",
      "Perincian",
      "WNI Laki-laki",
      "WNI Perempuan",
      "WNA Laki-laki",
      "WNA Perempuan",
      "Jumlah Laki-laki",
      "Jumlah Perempuan",
      "Jumlah Laki-laki+Perempuan",
      "KK Laki-laki",
      "KK Perempuan",
      "KK Laki-laki+Perempuan",
    ],
    ...input.baris.map((baris, index) => [
      String(index + 1),
      baris.label,
      String(baris.wniL),
      String(baris.wniP),
      String(baris.wnaL),
      String(baris.wnaP),
      String(baris.jmlL),
      String(baris.jmlP),
      String(baris.jml),
      String(baris.kkL),
      String(baris.kkP),
      String(baris.kk),
    ]),
  ];

  return `\uFEFF${toCsv(rows)}`;
}

/** Nama berkas unduhan, mis. `laporan-bulanan-2026-01-desa-contoh.csv`. */
export function laporanBulananFilename(
  namaDesa: string | null,
  { tahun, bulan }: PeriodeBulanan,
): string {
  const slug =
    (namaDesa ?? "desa")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "desa";

  return `laporan-bulanan-${tahun}-${String(bulan).padStart(2, "0")}-${slug}.csv`;
}
