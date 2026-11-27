import { z } from "zod";

import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { toCsv } from "@/lib/csv";

/**
 * Slug modul untuk seluruh halaman Kesehatan (Posyandu, KIA, ibu hamil, anak,
 * PAUD, stunting).
 *
 * Harus sama dengan `modules.slug` pada template tenant sekaligus slug fitur
 * paket. Nilai lama "kesehatan" adalah grup yang dibubarkan dan tidak pernah
 * masuk daftar fitur paket, sehingga `hasPermission` selalu menolak (403).
 * Halamannya kini bernaung di modul `stunting`.
 */
export const KIA_RESOURCE = RESOURCES.stunting;

export const STATUS_KEHAMILAN = [
  { value: 1, label: "Normal" },
  { value: 2, label: "Risiko Tinggi" },
  { value: 3, label: "Kekurangan Energi Kronis" },
] as const;

export const STATUS_GIZI_ANAK = [
  { value: 1, label: "Sehat/Normal" },
  { value: 2, label: "Gizi Kurang" },
  { value: 3, label: "Gizi Buruk" },
  { value: 4, label: "Stunting" },
] as const;

export const STATUS_TIKAR_ANAK = [
  { value: 1, label: "Tidak Diukur" },
  { value: 2, label: "Merah" },
  { value: 3, label: "Kuning" },
  { value: 4, label: "Hijau" },
] as const;

export const posyanduSchema = z.object({
  id: z.number().int().positive().optional(),
  villageId: z.number().int().positive(),
  nama: z.string().min(1).max(100),
  alamat: z.string().max(200).optional().or(z.literal("")),
  namaKetua: z.string().max(100).optional().or(z.literal("")),
  namaBidan: z.string().max(100).optional().or(z.literal("")),
});

export type PosyanduInput = z.infer<typeof posyanduSchema>;
export type Posyandu = PosyanduInput & { id: number };

export const kiaSchema = z.object({
  id: z.number().int().positive().optional(),
  villageId: z.number().int().positive(),
  noKia: z.string().min(1).max(30),
  ibuId: z.number().int().positive(),
  anakId: z.number().int().positive().optional().nullable(),
  hariPerkiraanLahir: z.string().optional().or(z.literal("")),
});

export type KiaRow = {
  id: number;
  villageId: number;
  noKia: string;
  ibuId: number;
  anakId: number | null;
  hariPerkiraanLahir: string | null;
  ibuName?: string | null;
  anakName?: string | null;
  posyanduId?: number;
};

export const ibuHamilSchema = z.object({
  id: z.number().int().positive().optional(),
  villageId: z.number().int().positive(),
  posyanduId: z.number().int().positive(),
  kiaId: z.number().int().positive(),
  tanggalPeriksa: z.string().optional().or(z.literal("")),
  statusKehamilan: z.coerce.number().int().min(1).max(3).optional().nullable(),
  usiaKehamilan: z.coerce.number().int().min(0).max(42).optional().nullable(),
  tanggalMelahirkan: z.string().optional().or(z.literal("")),
  pemeriksaanKehamilan: z.coerce.boolean().optional(),
  konsumsiPilFe: z.coerce.boolean().optional(),
  butirPilFe: z.coerce.number().int().min(0).optional().nullable(),
  pemeriksaanNifas: z.coerce.boolean().optional(),
  konselingGizi: z.coerce.boolean().optional(),
  kunjunganRumah: z.coerce.boolean().optional(),
  aksesAirBersih: z.coerce.boolean().optional(),
  kepemilikanJamban: z.coerce.boolean().optional(),
  jaminanKesehatan: z.coerce.boolean().optional(),
});

export interface IbuHamilRow {
  id: number;
  posyanduId: number;
  kiaId: number;
  /** Tanggal periksa isian operator; `createdAt` dipakai bila kosong. */
  tanggalPeriksa?: string | null;
  statusKehamilan: number | null;
  usiaKehamilan: number | null;
  tanggalMelahirkan: string | null;
  // Kolom indikator boleh kosong di database; status kosong dihitung sebagai
  // `TS` (tidak seharusnya) saat rekapitulasi, sama seperti OpenSID.
  pemeriksaanKehamilan: boolean | null;
  konsumsiPilFe: boolean | null;
  butirPilFe: number | null;
  pemeriksaanNifas: boolean | null;
  konselingGizi: boolean | null;
  kunjunganRumah: boolean | null;
  aksesAirBersih: boolean | null;
  kepemilikanJamban: boolean | null;
  jaminanKesehatan: boolean | null;
}

export const bulananAnakSchema = z.object({
  id: z.number().int().positive().optional(),
  villageId: z.number().int().positive(),
  posyanduId: z.number().int().positive(),
  kiaId: z.number().int().positive(),
  tanggalPeriksa: z.string().optional().or(z.literal("")),
  statusGizi: z.coerce.number().int().min(1).max(4),
  umurBulan: z.coerce.number().int().min(0).max(60),
  statusTikar: z.coerce.number().int().min(1).max(4),
  pemberianImunisasiDasar: z.coerce.boolean().optional(),
  pemberianImunisasiCampak: z.coerce.boolean().optional().nullable(),
  pengukuranBeratBadan: z.coerce.boolean().optional(),
  beratBadan: z.coerce.number().optional().nullable(),
  pengukuranTinggiBadan: z.coerce.boolean().optional(),
  tinggiBadan: z.coerce.number().optional().nullable(),
  konselingGiziAyah: z.coerce.boolean().optional(),
  konselingGiziIbu: z.coerce.boolean().optional(),
  kunjunganRumah: z.coerce.boolean().optional(),
  airBersih: z.coerce.boolean().optional(),
  kepemilikanJamban: z.coerce.boolean().optional(),
  aktaLahir: z.coerce.boolean().optional(),
  jaminanKesehatan: z.coerce.boolean().optional(),
  pengasuhanPaud: z.coerce.boolean().optional(),
});

export interface BulananAnakRow {
  id: number;
  posyanduId: number;
  kiaId: number;
  /** Tanggal periksa isian operator; `createdAt` dipakai bila kosong. */
  tanggalPeriksa?: string | null;
  /** Catatan bebas operator, seperti kolom keterangan di form OpenSID. */
  keterangan?: string | null;
  statusGizi: number;
  umurBulan: number;
  statusTikar: number;
  pemberianImunisasiDasar: boolean | null;
  pemberianImunisasiCampak: boolean | null;
  pengukuranBeratBadan: boolean | null;
  beratBadan: number | null;
  pengukuranTinggiBadan: boolean | null;
  tinggiBadan: number | null;
  konselingGiziAyah: boolean | null;
  konselingGiziIbu: boolean | null;
  kunjunganRumah: boolean | null;
  airBersih: boolean | null;
  kepemilikanJamban: boolean | null;
  aktaLahir: boolean | null;
  jaminanKesehatan: boolean | null;
  pengasuhanPaud: boolean | null;
}

// --- Sasaran PAUD 2-6 tahun ---

/** Kategori usia sasaran PAUD, sama dengan opsi OpenSID. */
export const KATEGORI_USIA_PAUD = [
  { value: 1, label: "Anak Usia 2 - < 3 Tahun" },
  { value: 2, label: "Anak Usia 3 - 6 Tahun" },
] as const;

/** Status keikutsertaan PAUD per bulan, sama dengan opsi OpenSID. */
export const STATUS_PAUD = [
  { value: 1, label: "Belum" },
  { value: 2, label: "Mengikuti" },
  { value: 3, label: "Tidak Mengikuti" },
] as const;

/** Urutan kolom bulan pada tabel `sasaran_paud`. */
export const BULAN_PAUD = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
] as const;

export const paudSchema = z.object({
  id: z.number().int().positive().optional(),
  villageId: z.number().int().positive(),
  posyanduId: z.number().int().positive(),
  kiaId: z.number().int().positive(),
  tanggalPeriksa: z.string().optional().or(z.literal("")),
  kategoriUsia: z.coerce.number().int().min(1).max(2),
  januari: z.coerce.number().int().min(1).max(3).optional(),
  februari: z.coerce.number().int().min(1).max(3).optional(),
  maret: z.coerce.number().int().min(1).max(3).optional(),
  april: z.coerce.number().int().min(1).max(3).optional(),
  mei: z.coerce.number().int().min(1).max(3).optional(),
  juni: z.coerce.number().int().min(1).max(3).optional(),
  juli: z.coerce.number().int().min(1).max(3).optional(),
  agustus: z.coerce.number().int().min(1).max(3).optional(),
  september: z.coerce.number().int().min(1).max(3).optional(),
  oktober: z.coerce.number().int().min(1).max(3).optional(),
  november: z.coerce.number().int().min(1).max(3).optional(),
  desember: z.coerce.number().int().min(1).max(3).optional(),
});

export type PaudInput = z.infer<typeof paudSchema>;
export type PaudRow = Omit<PaudInput, "tanggalPeriksa" | "id"> & {
  id: number;
  /** Kosong berarti memakai `created_at` sebagai tanggal periksa. */
  tanggalPeriksa?: string | null;
  januari?: number;
  februari?: number;
  maret?: number;
  april?: number;
  mei?: number;
  juni?: number;
  juli?: number;
  agustus?: number;
  september?: number;
  oktober?: number;
  november?: number;
  desember?: number;
};

/** Menghitung rekapitulasi skorcard KIA: total, stunting, dan persentase konversi. */
export function hitungSkorcardKia(
  rows: readonly { statusGizi: number; statusTikar: number; posyanduId?: number }[],
): { total: number; stunting: number; konversi: number } {
  const total = rows.length;
  const stunting = rows.filter((row) => row.statusGizi === 4 || row.statusTikar === 4).length;
  const konversi = total === 0 ? 0 : Math.round((stunting / total) * 10000) / 100;
  return { total, stunting, konversi };
}

/** CSV KIA: header + baris data + baris jumlah. */
export function buildKiaCsv(input: {
  namaDesa: string | null;
  judulPemilihan: string;
  tanggalPemilihan: string;
  rows: readonly {
    statusGizi: number;
    statusTikar: number;
    posyanduId?: number;
    posyanduName?: string;
    ibuName: string | null;
    konversi: string;
  }[];
  total: number;
  stunting: number;
  konversiPersentase: number;
}): string {
  const header = [
    ["Rekapitulasi KIA"],
    [input.namaDesa ?? "-"],
    [input.judulPemilihan],
    [`Tanggal Pemilihan: ${input.tanggalPemilihan}`],
    [],
    ["No", "No KIA", "Ibu", "Status Gizi", "Status Tikar", "Persentase"],
  ] as const;

  const rowsArray = input.rows.map((r, i) => [
    String(i + 1),
    r.posyanduId ? String(r.posyanduId) : "-",
    r.ibuName ?? "-",
    STATUS_GIZI_ANAK.find((s) => s.value === r.statusGizi)?.label ?? "-",
    STATUS_TIKAR_ANAK.find((s) => s.value === r.statusTikar)?.label ?? "-",
    r.konversi,
  ]);

  const total = [
    "",
    "JUMLAH",
    "",
    String(input.total),
    String(input.stunting),
    "-",
    `${input.konversiPersentase}%`,
  ];

  return `\uFEFF${toCsv([...header, ...rowsArray, total])}`;
}

export function kiaRekapFilename(namaDesa: string | null): string {
  const slug =
    (namaDesa ?? "desa")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "desa";
  return `rekap-kia-${slug}.csv`;
}
// --- Skorcard Konvergensi Desa ---

/**
 * Status satu indikator layanan, mengikuti kode OpenSID (`Rekap.php`):
 * `Y` memenuhi syarat, `T` tidak memenuhi syarat, `TS` tidak seharusnya /
 * datanya belum tersedia. Di tampilan `TS` ditulis `-`, sama seperti legenda
 * dialog panduan OpenSID.
 */
export type StatusIndikator = "Y" | "T" | "TS";

export function statusIndikator(nilai: boolean | null | undefined): StatusIndikator {
  if (nilai === true) return "Y";
  if (nilai === false) return "T";
  return "TS";
}

/** Delapan indikator konvergensi ibu hamil, berurutan seperti laporan OpenSID. */
export const INDIKATOR_IBU_HAMIL_KEYS = [
  "periksa_kehamilan",
  "pil_fe",
  "pemeriksaan_nifas",
  "konseling_gizi",
  "kunjungan_rumah",
  "akses_air_bersih",
  "kepemilikan_jamban",
  "jaminan_kesehatan",
] as const;

export const KOLOM_INDIKATOR_IBU_HAMIL: Record<string, keyof IbuHamilRow> = {
  periksa_kehamilan: "pemeriksaanKehamilan",
  pil_fe: "konsumsiPilFe",
  pemeriksaan_nifas: "pemeriksaanNifas",
  konseling_gizi: "konselingGizi",
  kunjungan_rumah: "kunjunganRumah",
  akses_air_bersih: "aksesAirBersih",
  kepemilikan_jamban: "kepemilikanJamban",
  jaminan_kesehatan: "jaminanKesehatan",
};

/** Sepuluh indikator konvergensi anak 0-23 bulan, berurutan seperti OpenSID. */
export const INDIKATOR_ANAK_KEYS = [
  "imunisasi",
  "pengukuran_berat_badan",
  "pengukuran_tinggi_badan",
  "konseling_gizi",
  "kunjungan_rumah",
  "air_bersih",
  "jamban_sehat",
  "akta_lahir",
  "jaminan_kesehatan",
  "pengasuhan_paud",
] as const;

export const KOLOM_INDIKATOR_ANAK: Record<string, keyof BulananAnakRow> = {
  imunisasi: "pemberianImunisasiDasar",
  pengukuran_berat_badan: "pengukuranBeratBadan",
  pengukuran_tinggi_badan: "pengukuranTinggiBadan",
  konseling_gizi: "konselingGiziIbu",
  kunjungan_rumah: "kunjunganRumah",
  air_bersih: "airBersih",
  jamban_sehat: "kepemilikanJamban",
  akta_lahir: "aktaLahir",
  jaminan_kesehatan: "jaminanKesehatan",
  pengasuhan_paud: "pengasuhanPaud",
};

export interface CapaianIndikator {
  Y: number;
  T: number;
  TS: number;
  jumlah_diterima: number;
  jumlah_seharusnya: number;
  persen: number;
}

/** Tingkat konvergensi satu baris sasaran (kolom Diterima/Seharusnya/% OpenSID). */
export interface KonvergensiBaris {
  jumlah_diterima_lengkap: number;
  jumlah_seharusnya: number;
  persen: number;
}

/**
 * Menghitung konvergensi satu baris. Indikator berstatus `TS` tidak dihitung
 * sebagai kewajiban, sama seperti `jumlah_seharusnya = jumlah layanan - TS`
 * pada `Rekap.php` OpenSID.
 */
export function hitungKonvergensiBaris(
  row: IbuHamilRow | BulananAnakRow,
  kunci: readonly string[],
  kolom: Record<string, string>,
): KonvergensiBaris {
  let diterima = 0;
  let seharusnya = 0;
  for (const key of kunci) {
    const col = kolom[key];
    const nilai = col ? (row as unknown as Record<string, unknown>)[col] : undefined;
    const status = statusIndikator(nilai as boolean | null | undefined);
    if (status === "TS") continue;
    seharusnya++;
    if (status === "Y") diterima++;
  }
  return {
    jumlah_diterima_lengkap: diterima,
    jumlah_seharusnya: seharusnya,
    persen: seharusnya === 0 ? 0 : Math.round((diterima / seharusnya) * 10000) / 100,
  };
}

/** Label kategori usia anak pada laporan rekapitulasi OpenSID. */
export function kategoriUsiaAnak(umurBulan: number | null | undefined): string {
  const umur = umurBulan ?? 0;
  if (umur < 6) return "0 - < 6 Bulan";
  if (umur <= 12) return "6 - 12 Bulan";
  if (umur < 18) return "> 12 - < 18 Bulan";
  return "> 18 - 23 Bulan";
}

export interface SkorcardKonvergensiIbuHamil {
  capaianKonvergensi: Record<string, CapaianIndikator> | null;
  tingkatKonvergensiDesa: {
    jumlah_diterima: number;
    jumlah_seharusnya: number;
    persen: number;
  } | null;
}

export interface SkorcardKonvergensiAnak {
  capaianKonvergensi: Record<string, CapaianIndikator> | null;
  tingkatKonvergensiDesa: {
    jumlah_diterima: number;
    jumlah_seharusnya: number;
    persen: number;
  } | null;
}

export interface SkorcardKonvergensiResult {
  jumlahTotalRt: number;
  ibuHamilTotal: number;
  jumlahKekRisti: number;
  bulananAnakTotal: number;
  jumlahGiziBukanNormal: number;
  tikar: { H: number; K: number; M: number };
  ibuHamil: SkorcardKonvergensiIbuHamil;
  bulananAnak: SkorcardKonvergensiAnak;
}

/**
 * Menghitung rekapitulasi skorcard konvergensi desa dari data ibu hamil dan anak.
 * Mengikuti pola laporan kesehatan: Tabel 1 (sasaran), Tabel 2 (tikar pertumbuhan),
 * Tabel 3 (kele玲apan konvergensi), Tabel 4 (tingkat konvergensi desa).
 */
export function buildSkorcardKonvergensi(
  ibuHamilRows: readonly IbuHamilRow[],
  bulananAnakRows: readonly BulananAnakRow[],
): SkorcardKonvergensiResult {
  const ibuHamilTotal = ibuHamilRows.length;
  const bulananAnakTotal = bulananAnakRows.length;
  const jumlahKekRisti = ibuHamilRows.filter((r) => r.statusKehamilan === 3).length;
  const jumlahGiziBukanNormal = bulananAnakRows.filter(
    (r) => r.statusGizi === 2 || r.statusGizi === 3 || r.statusGizi === 4,
  ).length;

  // Tabel 2: Tikar pertumbuhan
  const tikar = { H: 0, K: 0, M: 0 };
  for (const row of bulananAnakRows) {
    if (row.statusTikar === 4) tikar.H++;
    else if (row.statusTikar === 3) tikar.K++;
    else if (row.statusTikar === 2) tikar.M++;
  }

  // Tabel 3: Capaian konvergensi Ibu Hamil (8 indikator)
  const ibuIndicators = INDIKATOR_IBU_HAMIL_KEYS;
  const ibuIndicatorsMap = KOLOM_INDIKATOR_IBU_HAMIL;
  const ibuCapaian = hitungCapaianIndikator(
    ibuHamilRows as unknown as Record<string, unknown>[],
    ibuIndicators,
    ibuIndicatorsMap,
  );

  // Tabel 3: Capaian konvergensi Anak (10 indikator)
  const anakIndicators = INDIKATOR_ANAK_KEYS;
  const indicatorsMap = KOLOM_INDIKATOR_ANAK;
  const anakCapaian = hitungCapaianIndikator(
    bulananAnakRows as unknown as Record<string, unknown>[],
    anakIndicators,
    indicatorsMap,
  );

  // Tingkat konvergensi desa
  const ibuTingkatKonvergensi = hitungTingkatKonvergensi(ibuHamilTotal, ibuIndicators, ibuCapaian);
  const anakTingkatKonvergensi = hitungTingkatKonvergensi(
    bulananAnakTotal,
    anakIndicators,
    anakCapaian,
  );

  return {
    jumlahTotalRt: ibuHamilTotal + bulananAnakTotal,
    ibuHamilTotal,
    jumlahKekRisti,
    bulananAnakTotal,
    jumlahGiziBukanNormal,
    tikar,
    ibuHamil: { capaianKonvergensi: ibuCapaian, tingkatKonvergensiDesa: ibuTingkatKonvergensi },
    bulananAnak: {
      capaianKonvergensi: anakCapaian,
      tingkatKonvergensiDesa: anakTingkatKonvergensi,
    },
  };
}

/**
 * Menghitung capaian tiap indikator untuk footer tabel rekapitulasi.
 * `jumlah_seharusnya` mengikuti OpenSID: seluruh baris dikurangi status `TS`.
 */
function hitungCapaianIndikator(
  rows: readonly Record<string, unknown>[],
  indicators: readonly string[],
  indicatorsMap: Record<string, string>,
): Record<string, CapaianIndikator> {
  const hasil: Record<string, CapaianIndikator> = {};
  for (const key of indicators) {
    const col = indicatorsMap[key];
    const hitung = { Y: 0, T: 0, TS: 0 };
    for (const row of rows) {
      const nilai = col ? row[col] : undefined;
      hitung[statusIndikator(nilai as boolean | null | undefined)]++;
    }
    const jumlahSeharusnya = hitung.Y + hitung.T;
    hasil[key] = {
      ...hitung,
      jumlah_diterima: hitung.Y,
      jumlah_seharusnya: jumlahSeharusnya,
      persen: jumlahSeharusnya === 0 ? 0 : Math.round((hitung.Y / jumlahSeharusnya) * 10000) / 100,
    };
  }
  return hasil;
}

function hitungTingkatKonvergensi(
  total: number,
  indicators: readonly string[],
  capaian: Record<string, CapaianIndikator>,
): { jumlah_diterima: number; jumlah_seharusnya: number; persen: number } | null {
  if (total === 0) return null;
  let jumlahDiterima = 0;
  let jumlahSeharusnya = 0;
  for (const key of indicators) {
    const item = capaian[key];
    if (!item) continue;
    jumlahDiterima += item.jumlah_diterima;
    jumlahSeharusnya += item.jumlah_seharusnya;
  }
  const persen =
    jumlahSeharusnya === 0 ? 0 : Math.round((jumlahDiterima / jumlahSeharusnya) * 10000) / 100;
  return { jumlah_diterima: jumlahDiterima, jumlah_seharusnya: jumlahSeharusnya, persen };
}
