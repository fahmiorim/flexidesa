import { DISABILITIES, type Disability } from "@/features/penduduk/domain/penduduk";

/**
 * Kategori disabilitas pada laporan kelompok rentan.
 *
 * Mengikuti Lampiran A-9 OpenSID: kategori "Tidak Cacat" tidak dihitung dari
 * isian, melainkan sisa total penduduk setelah seluruh kategori disabilitas.
 */
export const DISABILITAS_RENTAN = DISABILITIES.filter(
  (value): value is Exclude<Disability, "none"> => value !== "none",
);

export type DisabilitasRentan = (typeof DISABILITAS_RENTAN)[number];

/** Label kolom cacat, sama persis dengan judul kolom OpenSID. */
export const DISABILITAS_RENTAN_LABELS: Record<DisabilitasRentan, string> = {
  physical: "Cacat Fisik",
  blind: "Cacat Netra/ Buta",
  deafSpeech: "Cacat Rungu/ Wicara",
  mental: "Cacat Mental/ Jiwa",
  physicalMental: "Cacat Fisik dan Mental",
  other: "Cacat Lainnya",
};

/** Kelompok umur yang dilaporkan (batas dan label mengikuti OpenSID). */
export const KELOMPOK_UMUR_RENTAN = [
  { key: "bayi", label: "Di bawah 1 Tahun", min: 0, max: 0 },
  { key: "balita", label: "1-5 Tahun", min: 1, max: 5 },
  { key: "sd", label: "6-12 Tahun", min: 6, max: 12 },
  { key: "smp", label: "13-15 Tahun", min: 13, max: 15 },
  { key: "sma", label: "16-18 Tahun", min: 16, max: 18 },
  { key: "lansia", label: "Di atas 60 Tahun", min: 61, max: null },
] as const;

export type KelompokUmurRentan = (typeof KELOMPOK_UMUR_RENTAN)[number]["key"];

/** Angka mentah satu baris laporan, sebelum turunan dihitung. */
export interface AngkaKelompokRentan {
  lakiLaki: number;
  perempuan: number;
  bayi: number;
  balita: number;
  sd: number;
  smp: number;
  sma: number;
  lansia: number;
  disabilitas: Record<DisabilitasRentan, number>;
  sakitLakiLaki: number;
  sakitPerempuan: number;
  hamil: number;
}

/** Satu baris laporan: satu wilayah RT. */
export interface BarisKelompokRentan extends AngkaKelompokRentan {
  regionId: number;
  dusun: string;
  rw: string;
  rt: string;
  total: number;
  tidakCacat: number;
}

export interface LaporanKelompokRentan {
  rows: BarisKelompokRentan[];
  total: BarisKelompokRentan;
}

/** Total penduduk pada satu baris (laki-laki + perempuan). */
export function totalPendudukBaris(baris: AngkaKelompokRentan): number {
  return baris.lakiLaki + baris.perempuan;
}

/** Jumlah penduduk dengan disabilitas tercatat. */
export function jumlahDisabilitasBaris(baris: AngkaKelompokRentan): number {
  return DISABILITAS_RENTAN.reduce((jumlah, value) => jumlah + baris.disabilitas[value], 0);
}

/**
 * Lengkapi angka mentah menjadi baris laporan.
 *
 * "Tidak cacat" = total penduduk − penduduk dengan disabilitas, sama seperti
 * perhitungan OpenSID; nilainya tidak pernah negatif meski data isian tidak
 * konsisten.
 */
export function lengkapiBarisKelompokRentan(
  baris: Omit<BarisKelompokRentan, "total" | "tidakCacat">,
): BarisKelompokRentan {
  const total = totalPendudukBaris(baris);
  const tidakCacat = Math.max(0, total - jumlahDisabilitasBaris(baris));
  return { ...baris, total, tidakCacat };
}

/** Peta disabilitas bernilai nol, dipakai sebelum agregasi. */
export function disabilitasKosong(): Record<DisabilitasRentan, number> {
  return DISABILITAS_RENTAN.reduce(
    (hasil, value) => {
      hasil[value] = 0;
      return hasil;
    },
    {} as Record<DisabilitasRentan, number>,
  );
}

/** Baris total semu untuk baris terakhir tabel. */
export function jumlahkanKelompokRentan(rows: readonly BarisKelompokRentan[]): BarisKelompokRentan {
  const disabilitas = disabilitasKosong();
  const total: BarisKelompokRentan = {
    regionId: 0,
    dusun: "",
    rw: "",
    rt: "",
    lakiLaki: 0,
    perempuan: 0,
    bayi: 0,
    balita: 0,
    sd: 0,
    smp: 0,
    sma: 0,
    lansia: 0,
    disabilitas,
    sakitLakiLaki: 0,
    sakitPerempuan: 0,
    hamil: 0,
    total: 0,
    tidakCacat: 0,
  };

  for (const baris of rows) {
    total.lakiLaki += baris.lakiLaki;
    total.perempuan += baris.perempuan;
    total.bayi += baris.bayi;
    total.balita += baris.balita;
    total.sd += baris.sd;
    total.smp += baris.smp;
    total.sma += baris.sma;
    total.lansia += baris.lansia;
    total.sakitLakiLaki += baris.sakitLakiLaki;
    total.sakitPerempuan += baris.sakitPerempuan;
    total.hamil += baris.hamil;
    total.tidakCacat += baris.tidakCacat;
    for (const value of DISABILITAS_RENTAN) {
      disabilitas[value] += baris.disabilitas[value];
    }
  }

  total.total = total.lakiLaki + total.perempuan;
  return total;
}

/** Urutkan per dusun/RW/RT. */
export function urutkanKelompokRentan(a: BarisKelompokRentan, b: BarisKelompokRentan): number {
  return (
    a.dusun.localeCompare(b.dusun, "id", { numeric: true }) ||
    a.rw.localeCompare(b.rw, "id", { numeric: true }) ||
    a.rt.localeCompare(b.rt, "id", { numeric: true })
  );
}

const JUDUL_CSV = [
  "Dusun",
  "RW",
  "RT",
  "KK L",
  "KK P",
  ...KELOMPOK_UMUR_RENTAN.map((umur) => umur.label),
  ...DISABILITAS_RENTAN.map((value) => DISABILITAS_RENTAN_LABELS[value]),
  "Tidak Cacat",
  "Sakit Menahun L",
  "Sakit Menahun P",
  "Hamil",
];

function barisCsv(nilai: readonly (string | number)[]): string {
  return nilai.map((sel) => String(sel)).join(";");
}

/**
 * CSV laporan kelompok rentan (pemisah `;` agar cocok dengan Excel Indonesia).
 * BOM ditambahkan pemanggil agar kolom UTF-8 terbaca benar.
 */
export function buildKelompokRentanCsv(input: {
  rows: readonly BarisKelompokRentan[];
  total: BarisKelompokRentan;
}): string {
  const angka = (baris: BarisKelompokRentan) => [
    baris.lakiLaki,
    baris.perempuan,
    baris.bayi,
    baris.balita,
    baris.sd,
    baris.smp,
    baris.sma,
    baris.lansia,
    ...DISABILITAS_RENTAN.map((value) => baris.disabilitas[value]),
    baris.tidakCacat,
    baris.sakitLakiLaki,
    baris.sakitPerempuan,
    baris.hamil,
  ];

  const isi = input.rows.map((baris) =>
    barisCsv([baris.dusun, baris.rw, baris.rt, ...angka(baris)]),
  );

  // Total mengikuti tfoot OpenSID: mulai dari kolom kelompok umur.
  const total = barisCsv(["Total", "", "", "", "", ...angka(input.total).slice(2)]);

  return [barisCsv(JUDUL_CSV), ...isi, total].join("\r\n");
}
