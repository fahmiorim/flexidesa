import { KELUARGA_WELFARE_CLASSES } from "@/features/keluarga/domain/keluarga";
import type { Gender } from "@/features/penduduk/domain/penduduk";
import { toCsv } from "@/lib/csv";

import { KELOMPOK_UMUR, type KelompokUmur } from "./rentang-umur";

/**
 * Katalog dan perhitungan modul **Statistik Kependudukan**.
 *
 * Acuan cakupan: menu OpenSID `statistik` (`resources/views/admin/statistik`).
 * Seluruh pengelompokan dilakukan di domain agar aturan statistik dapat diuji
 * tanpa basis data; repository hanya menyiapkan baris penduduk yang sudah
 * dinormalisasi.
 */

// --- Katalog kategori ------------------------------------------------------

export const STATISTIK_GROUPS = ["penduduk", "keluarga", "rtm", "bantuan"] as const;
export type StatistikGroupId = (typeof STATISTIK_GROUPS)[number];

export const STATISTIK_GROUP_LABELS: Readonly<Record<StatistikGroupId, string>> = {
  penduduk: "Penduduk",
  keluarga: "Keluarga",
  rtm: "RTM",
  bantuan: "Program Bantuan",
};

export type SatuanStatistik = "jiwa" | "keluarga" | "rumah tangga" | "penerima";

export interface KategoriStatistik {
  slug: string;
  label: string;
  group: StatistikGroupId;
  satuan: SatuanStatistik;
  /** `false` bila data sumber belum ada di FlexiDesa; halaman tetap menampilkan alasannya. */
  tersedia: boolean;
  keterangan?: string;
}

/**
 * Urutan kategori mengikuti urutan enum OpenSID agar operator mudah
 * menemukan statistik yang sama.
 */
export const STATISTIK_KATEGORI: readonly KategoriStatistik[] = [
  {
    slug: "rentang-umur",
    label: "Rentang Umur",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "kategori-umur",
    label: "Kategori Umur",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "pendidikan-dalam-kk",
    label: "Pendidikan Dalam KK",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "pendidikan-sedang-ditempuh",
    label: "Pendidikan Sedang Ditempuh",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "pekerjaan",
    label: "Pekerjaan",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "status-perkawinan",
    label: "Status Perkawinan",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  { slug: "agama", label: "Agama", group: "penduduk", satuan: "jiwa", tersedia: true },
  {
    slug: "jenis-kelamin",
    label: "Jenis Kelamin",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "hubungan-dalam-kk",
    label: "Hubungan Dalam KK",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "warga-negara",
    label: "Warga Negara",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "status-penduduk",
    label: "Status Penduduk",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "golongan-darah",
    label: "Golongan Darah",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "penyandang-disabilitas",
    label: "Penyandang Disabilitas",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "penyakit-menahun",
    label: "Penyakit Menahun",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "akseptor-kb",
    label: "Akseptor KB",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "akta-kelahiran",
    label: "Akta Kelahiran",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "kepemilikan-ktp",
    label: "Kepemilikan KTP",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "asuransi-kesehatan",
    label: "Asuransi Kesehatan",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "suku-etnis",
    label: "Suku / Etnis",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  { slug: "marga", label: "Marga", group: "penduduk", satuan: "jiwa", tersedia: true },
  { slug: "adat", label: "Adat", group: "penduduk", satuan: "jiwa", tersedia: true },
  {
    slug: "pekerja-migran",
    label: "Pekerja Migran",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "bpjs-ketenagakerjaan",
    label: "BPJS Ketenagakerjaan",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "status-asuransi-kesehatan",
    label: "Status Kepesertaan Asuransi Kesehatan",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "status-kehamilan",
    label: "Status Kehamilan",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "kepemilikan-kia",
    label: "Kepemilikan KIA",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: true,
  },
  {
    slug: "kepemilikan-akta-kematian",
    label: "Kepemilikan Akta Kematian",
    group: "penduduk",
    satuan: "jiwa",
    tersedia: false,
    keterangan:
      "FlexiDesa belum menyimpan nomor/berkas akta kematian pada data penduduk, sehingga statistik ini belum dapat dihitung.",
  },
  {
    slug: "kelas-sosial",
    label: "Kelas Sosial",
    group: "keluarga",
    satuan: "keluarga",
    tersedia: true,
  },
  { slug: "bdt", label: "BDT", group: "rtm", satuan: "rumah tangga", tersedia: true },
  { slug: "dtsen", label: "DTSEN", group: "rtm", satuan: "rumah tangga", tersedia: true },
  {
    slug: "bantuan-penduduk",
    label: "Bantuan Penduduk",
    group: "bantuan",
    satuan: "penerima",
    tersedia: true,
  },
  {
    slug: "bantuan-keluarga",
    label: "Bantuan Keluarga",
    group: "bantuan",
    satuan: "penerima",
    tersedia: true,
  },
];

/** Kategori awal mengikuti OpenSID (Pendidikan Dalam KK). */
export const STATISTIK_DEFAULT_KATEGORI = "pendidikan-dalam-kk";

export function kategoriStatistik(slug: string | undefined | null): KategoriStatistik | null {
  if (!slug) return null;
  return STATISTIK_KATEGORI.find((item) => item.slug === slug) ?? null;
}

export function kategoriPerGrup(group: StatistikGroupId): readonly KategoriStatistik[] {
  return STATISTIK_KATEGORI.filter((item) => item.group === group);
}

// --- Bentuk data -----------------------------------------------------------

export interface PendudukStatistik {
  id: number;
  nama: string;
  nik: string | null;
  alamat: string | null;
  wilayah: string | null;
  gender: Gender;
  umur: number | null;
  agama: string | null;
  pendidikan: string | null;
  pendidikanSedang: string | null;
  pekerjaan: string | null;
  statusKawin: string | null;
  statusKawinId: number | null;
  hubunganKk: string | null;
  wargaNegara: string | null;
  statusPenduduk: string | null;
  golonganDarah: string | null;
  disabilitas: string | null;
  penyakitMenahun: string | null;
  akseptorKb: string | null;
  aktaKelahiran: string | null;
  statusRekam: string | null;
  ktpEl: string | null;
  asuransi: string | null;
  statusAsuransi: string | null;
  suku: string | null;
  marga: string | null;
  adat: string | null;
  pekerjaMigran: string | null;
  bpjsKetenagakerjaan: string | null;
  statusKehamilan: string | null;
}

export interface KeluargaStatistik {
  welfareClass: number | null;
  kepalaGender: Gender | null;
}

export interface RtmStatistik {
  bdt: string | null;
  terdaftarDtks: boolean;
  kepalaGender: Gender | null;
}

export interface BantuanStatistik {
  slug: string;
  nama: string;
  sasaran: number;
  lakiLaki: number;
  perempuan: number;
}

export interface PejabatPenandatanganStatistik {
  id: number;
  nama: string;
  jabatan: string | null;
  jenisJabatan: string | null;
}

export interface KatalogStatistik {
  agama: string[];
  pendidikan: string[];
  pekerjaan: string[];
  statusKawin: string[];
  hubunganKk: string[];
  wargaNegara: string[];
  golonganDarah: string[];
}

export interface DataStatistikKependudukan {
  penduduk: readonly PendudukStatistik[];
  rentangUmur: readonly KelompokUmur[];
  katalog: KatalogStatistik;
  keluarga: readonly KeluargaStatistik[];
  rtm: readonly RtmStatistik[];
  bantuan: readonly BantuanStatistik[];
}

export interface BarisStatistik {
  label: string;
  lakiLaki: number;
  perempuan: number;
  jumlah: number;
}

export interface TotalStatistik {
  lakiLaki: number;
  perempuan: number;
  jumlah: number;
}

export interface HasilStatistikKependudukan {
  kategori: KategoriStatistik;
  baris: BarisStatistik[];
  /** Jumlah seluruh baris kategori. */
  jumlah: TotalStatistik;
  /** Selisih total populasi dengan jumlah baris (data kategori kosong). */
  belumMengisi: TotalStatistik;
  total: TotalStatistik;
}

// --- Perhitungan -----------------------------------------------------------

const kosong = (): TotalStatistik => ({ lakiLaki: 0, perempuan: 0, jumlah: 0 });

function tambah(
  total: TotalStatistik,
  row: Pick<BarisStatistik, "lakiLaki" | "perempuan" | "jumlah">,
) {
  total.lakiLaki += row.lakiLaki;
  total.perempuan += row.perempuan;
  total.jumlah += row.jumlah;
}

/** Total penduduk berdasarkan gender. */
export function totalPenduduk(penduduk: readonly PendudukStatistik[]): TotalStatistik {
  const total = kosong();
  for (const row of penduduk) {
    if (row.gender === "male") total.lakiLaki += 1;
    else total.perempuan += 1;
  }
  total.jumlah = total.lakiLaki + total.perempuan;
  return total;
}

/**
 * Kelompokkan penduduk menurut nilai kategori.
 *
 * `opsi` menjaga urutan katalog (mis. seluruh agama) dan menampilkan kategori
 * berjumlah nol, seperti OpenSID. Bila `opsi` kosong (kategori teks bebas),
 * baris diurutkan dari jumlah terbesar.
 */
export function kelompokkan(
  penduduk: readonly PendudukStatistik[],
  ambil: (row: PendudukStatistik) => string | null | undefined,
  opsi: readonly string[] = [],
): BarisStatistik[] {
  const peta = new Map<string, { lakiLaki: number; perempuan: number }>();
  for (const label of opsi) {
    const bersih = label.trim();
    if (bersih) peta.set(bersih, { lakiLaki: 0, perempuan: 0 });
  }

  for (const row of penduduk) {
    const label = (ambil(row) ?? "").trim();
    if (!label) continue;
    const isi = peta.get(label) ?? { lakiLaki: 0, perempuan: 0 };
    if (row.gender === "male") isi.lakiLaki += 1;
    else isi.perempuan += 1;
    peta.set(label, isi);
  }

  const hasil = [...peta.entries()].map(([label, isi]) => ({
    label,
    lakiLaki: isi.lakiLaki,
    perempuan: isi.perempuan,
    jumlah: isi.lakiLaki + isi.perempuan,
  }));

  if (opsi.length === 0) {
    return hasil.sort((a, b) => b.jumlah - a.jumlah || a.label.localeCompare(b.label, "id"));
  }

  const katalog = new Set(opsi.map((label) => label.trim()).filter(Boolean));
  const sesuaiKatalog = hasil.filter((row) => katalog.has(row.label));
  const tambahan = hasil
    .filter((row) => !katalog.has(row.label))
    .sort((a, b) => b.jumlah - a.jumlah || a.label.localeCompare(b.label, "id"));

  return [...sesuaiKatalog, ...tambahan];
}

/** Kelompokkan penduduk ke rentang umur; umur tidak diketahui tidak dihitung. */
export function kelompokkanRentang(
  penduduk: readonly PendudukStatistik[],
  rentang: readonly KelompokUmur[],
  saring: (row: PendudukStatistik) => boolean = () => true,
): BarisStatistik[] {
  const peta = new Map<string, { lakiLaki: number; perempuan: number }>();
  for (const item of rentang) peta.set(item.label, { lakiLaki: 0, perempuan: 0 });

  for (const row of penduduk) {
    if (!saring(row)) continue;
    if (row.umur === null || row.umur < 0) continue;
    const bucket = rentang.find(
      (item) =>
        row.umur !== null && row.umur >= item.min && (item.max === null || row.umur <= item.max),
    );
    if (!bucket) continue;
    const isi = peta.get(bucket.label);
    if (!isi) continue;
    if (row.gender === "male") isi.lakiLaki += 1;
    else isi.perempuan += 1;
  }

  return [...peta.entries()].map(([label, isi]) => ({
    label,
    lakiLaki: isi.lakiLaki,
    perempuan: isi.perempuan,
    jumlah: isi.lakiLaki + isi.perempuan,
  }));
}

function labelRentangUmur(umur: number | null, rentang: readonly KelompokUmur[]): string | null {
  if (umur === null || umur < 0) return null;
  const bucket = rentang.find(
    (item) => umur >= item.min && (item.max === null || umur <= item.max),
  );
  return bucket?.label ?? null;
}

/**
 * Penduduk yang masuk ke satu baris kategori statistik.
 *
 * Dipakai halaman daftar turunan saat angka pada tabel diklik. Kategori
 * non-penduduk (keluarga/RTM/bantuan) tidak memiliki daftar penduduk di sini.
 */
export function pendudukKategori(
  kategori: KategoriStatistik,
  data: DataStatistikKependudukan,
  label: string,
): PendudukStatistik[] {
  const cocok = (nilai: string | null | undefined) => (nilai ?? "").trim() === label;
  const penduduk = data.penduduk;

  if (!kategori.tersedia) return [];

  switch (kategori.slug) {
    case "rentang-umur":
      return penduduk.filter((row) => cocok(labelRentangUmur(row.umur, data.rentangUmur)));
    case "kategori-umur":
      return penduduk.filter((row) => cocok(labelRentangUmur(row.umur, KELOMPOK_UMUR)));
    case "pendidikan-dalam-kk":
      return penduduk.filter((row) => cocok(row.pendidikan));
    case "pendidikan-sedang-ditempuh":
      return penduduk.filter((row) => cocok(row.pendidikanSedang));
    case "pekerjaan":
      return penduduk.filter((row) => cocok(row.pekerjaan));
    case "status-perkawinan":
      return penduduk.filter((row) => cocok(row.statusKawin));
    case "agama":
      return penduduk.filter((row) => cocok(row.agama));
    case "jenis-kelamin":
      if (label === "Laki-laki") return penduduk.filter((row) => row.gender === "male");
      if (label === "Perempuan") return penduduk.filter((row) => row.gender === "female");
      return [];
    case "hubungan-dalam-kk":
      return penduduk.filter((row) => cocok(row.hubunganKk));
    case "warga-negara":
      return penduduk.filter((row) => cocok(row.wargaNegara));
    case "status-penduduk":
      return penduduk.filter((row) => cocok(row.statusPenduduk));
    case "golongan-darah":
      return penduduk.filter((row) => cocok(row.golonganDarah));
    case "penyandang-disabilitas":
      return penduduk.filter((row) => cocok(row.disabilitas));
    case "penyakit-menahun":
      return penduduk.filter((row) => cocok(row.penyakitMenahun));
    case "akseptor-kb":
      return penduduk.filter((row) => cocok(row.akseptorKb));
    case "akta-kelahiran":
      return penduduk.filter(
        (row) => Boolean(row.aktaKelahiran) && cocok(labelRentangUmur(row.umur, data.rentangUmur)),
      );
    case "kepemilikan-ktp":
      return penduduk.filter((row) => ktpEligible(row) && cocok(row.statusRekam));
    case "asuransi-kesehatan":
      return penduduk.filter((row) => cocok(row.asuransi));
    case "suku-etnis":
      return penduduk.filter((row) => cocok(row.suku));
    case "marga":
      return penduduk.filter((row) => cocok(row.marga));
    case "adat":
      return penduduk.filter((row) => cocok(row.adat));
    case "pekerja-migran":
      return penduduk.filter((row) => cocok(row.pekerjaMigran));
    case "bpjs-ketenagakerjaan":
      return penduduk.filter((row) => Boolean(row.bpjsKetenagakerjaan) && cocok(row.pekerjaan));
    case "status-asuransi-kesehatan":
      return penduduk.filter((row) => cocok(row.statusAsuransi));
    case "status-kehamilan":
      return penduduk.filter((row) => row.gender === "female" && cocok(row.statusKehamilan));
    case "kepemilikan-kia":
      return penduduk.filter((row) => row.umur !== null && row.umur <= 17 && cocok(row.ktpEl));
    default:
      return [];
  }
}

function totalBaris(baris: readonly BarisStatistik[]): TotalStatistik {
  const total = kosong();
  for (const row of baris) tambah(total, row);
  return total;
}

/** Susun hasil lengkap: baris kategori, jumlah, belum mengisi, dan total populasi. */
export function susunHasil(
  kategori: KategoriStatistik,
  baris: readonly BarisStatistik[],
  total: TotalStatistik,
): HasilStatistikKependudukan {
  const jumlah = totalBaris(baris);
  return {
    kategori,
    baris: [...baris],
    jumlah,
    belumMengisi: {
      lakiLaki: Math.max(0, total.lakiLaki - jumlah.lakiLaki),
      perempuan: Math.max(0, total.perempuan - jumlah.perempuan),
      jumlah: Math.max(0, total.jumlah - jumlah.jumlah),
    },
    total,
  };
}

function totalGenderKepala(rows: readonly { kepalaGender: Gender | null }[]): TotalStatistik {
  const total = kosong();
  for (const row of rows) {
    if (row.kepalaGender === "male") total.lakiLaki += 1;
    else if (row.kepalaGender === "female") total.perempuan += 1;
  }
  total.jumlah = rows.length;
  return total;
}

function barisDariHitungan(
  rows: readonly { label: string; lakiLaki: number; perempuan: number }[],
): BarisStatistik[] {
  return rows.map((row) => ({
    label: row.label,
    lakiLaki: row.lakiLaki,
    perempuan: row.perempuan,
    jumlah: row.lakiLaki + row.perempuan,
  }));
}

function barisKelompokKepala(
  rows: readonly { kepalaGender: Gender | null; label: string }[],
  katalog: readonly string[],
): BarisStatistik[] {
  const peta = new Map<string, { lakiLaki: number; perempuan: number }>();
  for (const label of katalog) peta.set(label, { lakiLaki: 0, perempuan: 0 });
  for (const row of rows) {
    const isi = peta.get(row.label) ?? { lakiLaki: 0, perempuan: 0 };
    if (row.kepalaGender === "male") isi.lakiLaki += 1;
    else if (row.kepalaGender === "female") isi.perempuan += 1;
    peta.set(row.label, isi);
  }
  return [...peta.entries()].map(([label, isi]) => ({
    label,
    lakiLaki: isi.lakiLaki,
    perempuan: isi.perempuan,
    jumlah: isi.lakiLaki + isi.perempuan,
  }));
}

function bantuanUntukSasaran(data: DataStatistikKependudukan, sasaran: number): BantuanStatistik[] {
  return data.bantuan.filter((item) => item.sasaran === sasaran);
}

function hasilBantuan(
  kategori: KategoriStatistik,
  programs: readonly BantuanStatistik[],
  total: TotalStatistik,
): HasilStatistikKependudukan {
  const baris = barisDariHitungan(
    programs.map((program) => ({
      label: program.nama,
      lakiLaki: program.lakiLaki,
      perempuan: program.perempuan,
    })),
  );
  return susunHasil(kategori, baris, total);
}

function ktpEligible(row: PendudukStatistik): boolean {
  if (row.umur !== null && row.umur >= 17) return true;
  return row.statusKawinId !== null && row.statusKawinId !== 1;
}

/**
 * Hitung satu kategori statistik dari data yang sudah dimuat.
 *
 * Kategori tanpa data sumber tetap mengembalikan hasil kosong beserta total
 * populasi agar halaman dapat menampilkan alasan gap secara konsisten.
 */
export function hitungStatistikKependudukan(
  kategori: KategoriStatistik,
  data: DataStatistikKependudukan,
): HasilStatistikKependudukan {
  const penduduk = data.penduduk;
  const total = totalPenduduk(penduduk);

  if (!kategori.tersedia) return susunHasil(kategori, [], total);

  switch (kategori.slug) {
    case "rentang-umur":
      return susunHasil(kategori, kelompokkanRentang(penduduk, data.rentangUmur), total);

    case "kategori-umur":
      return susunHasil(kategori, kelompokkanRentang(penduduk, KELOMPOK_UMUR), total);

    case "pendidikan-dalam-kk":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.pendidikan, data.katalog.pendidikan),
        total,
      );

    case "pendidikan-sedang-ditempuh":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.pendidikanSedang, data.katalog.pendidikan),
        total,
      );

    case "pekerjaan":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.pekerjaan, data.katalog.pekerjaan),
        total,
      );

    case "status-perkawinan":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.statusKawin, data.katalog.statusKawin),
        total,
      );

    case "agama":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.agama, data.katalog.agama),
        total,
      );

    case "jenis-kelamin":
      return susunHasil(
        kategori,
        [
          { label: "Laki-laki", lakiLaki: total.lakiLaki, perempuan: 0, jumlah: total.lakiLaki },
          {
            label: "Perempuan",
            lakiLaki: 0,
            perempuan: total.perempuan,
            jumlah: total.perempuan,
          },
        ],
        total,
      );

    case "hubungan-dalam-kk":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.hubunganKk, data.katalog.hubunganKk),
        total,
      );

    case "warga-negara":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.wargaNegara, data.katalog.wargaNegara),
        total,
      );

    case "status-penduduk":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.statusPenduduk),
        total,
      );

    case "golongan-darah":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.golonganDarah, data.katalog.golonganDarah),
        total,
      );

    case "penyandang-disabilitas":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.disabilitas),
        total,
      );

    case "penyakit-menahun":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.penyakitMenahun),
        total,
      );

    case "akseptor-kb":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.akseptorKb),
        total,
      );

    case "akta-kelahiran":
      return susunHasil(
        kategori,
        kelompokkanRentang(penduduk, data.rentangUmur, (row) => Boolean(row.aktaKelahiran)),
        total,
      );

    case "kepemilikan-ktp":
      return susunHasil(
        kategori,
        kelompokkan(penduduk.filter(ktpEligible), (row) => row.statusRekam),
        total,
      );

    case "asuransi-kesehatan":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.asuransi),
        total,
      );

    case "suku-etnis":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.suku),
        total,
      );

    case "marga":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.marga),
        total,
      );

    case "adat":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.adat),
        total,
      );

    case "pekerja-migran":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.pekerjaMigran),
        total,
      );

    case "bpjs-ketenagakerjaan":
      return susunHasil(
        kategori,
        kelompokkan(
          penduduk.filter((row) => Boolean(row.bpjsKetenagakerjaan)),
          (row) => row.pekerjaan,
          data.katalog.pekerjaan,
        ),
        total,
      );

    case "status-asuransi-kesehatan":
      return susunHasil(
        kategori,
        kelompokkan(penduduk, (row) => row.statusAsuransi),
        total,
      );

    case "status-kehamilan": {
      const perempuan = penduduk.filter((row) => row.gender === "female");
      return susunHasil(
        kategori,
        kelompokkan(perempuan, (row) => row.statusKehamilan),
        totalPenduduk(perempuan),
      );
    }

    case "kepemilikan-kia": {
      const anak = penduduk.filter((row) => row.umur !== null && row.umur <= 17);
      return susunHasil(
        kategori,
        kelompokkan(anak, (row) => row.ktpEl),
        totalPenduduk(anak),
      );
    }

    case "kelas-sosial": {
      const katalog = [...KELUARGA_WELFARE_CLASSES.map((item) => item.label), "Belum ditetapkan"];
      const baris = barisKelompokKepala(
        data.keluarga.map((row) => ({
          kepalaGender: row.kepalaGender,
          label:
            KELUARGA_WELFARE_CLASSES.find((item) => item.value === row.welfareClass)?.label ??
            "Belum ditetapkan",
        })),
        katalog,
      );
      return susunHasil(kategori, baris, totalGenderKepala(data.keluarga));
    }

    case "bdt": {
      const baris = barisKelompokKepala(
        data.rtm.map((row) => ({
          kepalaGender: row.kepalaGender,
          label: row.bdt ? "Terdaftar BDT" : "Tidak Terdaftar",
        })),
        ["Terdaftar BDT", "Tidak Terdaftar"],
      );
      return susunHasil(kategori, baris, totalGenderKepala(data.rtm));
    }

    case "dtsen": {
      const baris = barisKelompokKepala(
        data.rtm.map((row) => ({
          kepalaGender: row.kepalaGender,
          label: row.terdaftarDtks ? "Terdaftar DTKS" : "Tidak Terdaftar",
        })),
        ["Terdaftar DTKS", "Tidak Terdaftar"],
      );
      return susunHasil(kategori, baris, totalGenderKepala(data.rtm));
    }

    case "bantuan-penduduk":
      return hasilBantuan(kategori, bantuanUntukSasaran(data, 1), total);

    case "bantuan-keluarga":
      return hasilBantuan(kategori, bantuanUntukSasaran(data, 2), totalGenderKepala(data.keluarga));

    default:
      return susunHasil(kategori, [], total);
  }
}

// --- Ekspor ---------------------------------------------------------------

/** Persentase dengan maksimal dua angka desimal, tanpa tanda `%`. */
export function persen(bagian: number, total: number): string {
  if (!total) return "0";
  return ((bagian / total) * 100).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

export interface StatistikCsvInput {
  namaDesa: string | null;
  hasil: HasilStatistikKependudukan;
  filter: string;
}

/** CSV statistik kependudukan dengan kolom setara tabel OpenSID. */
export function buildStatistikKependudukanCsv(input: StatistikCsvInput): string {
  const { hasil } = input;
  const total = hasil.total.jumlah;
  const rows: string[][] = [
    ["Statistik Kependudukan"],
    ["Desa", input.namaDesa ?? "-"],
    ["Kategori", hasil.kategori.label],
    ["Filter", input.filter || "Semua wilayah"],
    ["Satuan", hasil.kategori.satuan],
    [],
    ["Kelompok", "Jumlah", "Persen", "Laki-laki", "Persen L", "Perempuan", "Persen P"],
    ...hasil.baris.map((row) => [
      row.label,
      String(row.jumlah),
      persen(row.jumlah, total),
      String(row.lakiLaki),
      persen(row.lakiLaki, total),
      String(row.perempuan),
      persen(row.perempuan, total),
    ]),
    [
      "JUMLAH",
      String(hasil.jumlah.jumlah),
      persen(hasil.jumlah.jumlah, total),
      String(hasil.jumlah.lakiLaki),
      persen(hasil.jumlah.lakiLaki, total),
      String(hasil.jumlah.perempuan),
      persen(hasil.jumlah.perempuan, total),
    ],
    [
      "BELUM MENGISI",
      String(hasil.belumMengisi.jumlah),
      persen(hasil.belumMengisi.jumlah, total),
      String(hasil.belumMengisi.lakiLaki),
      persen(hasil.belumMengisi.lakiLaki, total),
      String(hasil.belumMengisi.perempuan),
      persen(hasil.belumMengisi.perempuan, total),
    ],
    [
      "TOTAL",
      String(hasil.total.jumlah),
      persen(hasil.total.jumlah, total),
      String(hasil.total.lakiLaki),
      persen(hasil.total.lakiLaki, total),
      String(hasil.total.perempuan),
      persen(hasil.total.perempuan, total),
    ],
  ];

  return `\uFEFF${toCsv(rows)}`;
}

/** Nama berkas CSV yang aman. */
export function statistikKependudukanFilename(slug: string): string {
  return `statistik-kependudukan-${slug}.csv`;
}
