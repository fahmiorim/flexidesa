import { z } from "zod";

import { TIPE_PETA, TIPE_PETA_DEFAULT } from "@/features/info-desa/wilayah/domain/wilayah";
import {
  validasiGeoJsonPolygon,
  validasiKoordinat,
} from "@/features/pertanahan-gis/gis/domain/peta-cetak";

/** Identitas & profil publik desa (satu transaksi). */
export const profilDesaSchema = z.object({
  namaDesa: z.string().trim().min(2).max(100),
  kodeDesa: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Kode desa harus 10 digit."),
  kodeBps: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Kode BPS harus 10 digit.")
    .or(z.literal("")),
  namaKecamatan: z.string().trim().min(2).max(100),
  namaCamat: z.string().trim().max(100),
  nipCamat: z.string().trim().max(25),
  namaKabupaten: z.string().trim().min(2).max(100),
  namaPropinsi: z.string().trim().min(2).max(100),
  kodePos: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Kode pos harus 5 digit.")
    .or(z.literal("")),
  namaKepalaDesa: z.string().trim().max(100),
  nipKepalaDesa: z.string().trim().max(25),
  visi: z.string().trim().max(5000),
  misi: z.string().trim().max(10000),
  sejarah: z.string().trim().max(10000),
  sambutan: z.string().trim().max(5000),
  /** Alamat dan koordinat kantor desa; dipakai peta publik dan halaman kontak. */
  alamat: z.string().trim().max(255).default(""),
  /**
   * Kanal kontak desa. Opsional agar
   * pemanggil lama (tab lain, pemulihan cadangan) tidak mengosongkan nilai
   * yang sudah tersimpan. String kosong tetap berarti menghapus nilai.
   */
  email: z
    .string()
    .trim()
    .max(100)
    .optional()
    // Email tidak valid ditolak; string kosong tetap boleh
    // untuk menghapus nilai lama.
    .refine(
      (nilai) => nilai === undefined || nilai === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nilai),
      {
        message: "Alamat email tidak valid.",
      },
    ),
  telepon: z.string().trim().max(30).optional(),
  nomorOperator: z.string().trim().max(30).optional(),
  website: z.string().trim().max(255).optional(),
  kontakPemberitahuanNama: z.string().trim().max(100).optional(),
  kontakPemberitahuanTelepon: z.string().trim().max(30).optional(),
  kontakPemberitahuanJabatan: z.string().trim().max(100).optional(),
  koordinat: z
    .string()
    .trim()
    .max(60)
    .default("")
    .refine((nilai) => validasiKoordinat(nilai) === null, {
      message: "Koordinat harus berupa latitude (-90 s.d. 90), longitude (-180 s.d. 180).",
    }),
  /** Tipe peta dasar pilihan terakhir untuk titik kantor desa. */
  mapTipe: z.enum(TIPE_PETA).default(TIPE_PETA_DEFAULT),
  luasWilayah: z
    .string()
    .trim()
    .max(20)
    .default("")
    .refine((nilai) => nilai === "" || (Number.isFinite(Number(nilai)) && Number(nilai) >= 0), {
      message: "Luas wilayah harus berupa angka positif.",
    }),
  batasUtara: z.string().trim().max(150).default(""),
  batasSelatan: z.string().trim().max(150).default(""),
  batasTimur: z.string().trim().max(150).default(""),
  batasBarat: z.string().trim().max(150).default(""),
  ketinggian: z.string().trim().max(100).default(""),
  suhuRataRata: z.string().trim().max(100).default(""),
  curahHujan: z.string().trim().max(100).default(""),
  topografi: z.string().trim().max(150).default(""),
  /** Profil ekologi. */
  jenisTanah: z.string().trim().max(150).default(""),
  sumberDayaAlam: z.string().trim().max(5000).default(""),
  floraFauna: z.string().trim().max(5000).default(""),
  rawanBencana: z.string().trim().max(255).default(""),
  kearifanLokal: z.string().trim().max(5000).default(""),
  /** Profil jaringan internet desa. */
  jenisJaringan: z.string().trim().max(150).default(""),
  providerInternet: z.string().trim().max(150).default(""),
  cakupanWilayah: z.string().trim().max(2000).default(""),
  kecepatanInternet: z.string().trim().max(100).default(""),
  aksesPublik: z.string().trim().max(2000).default(""),
  /** Status dan data adat. */
  statusDesa: z.enum(["", "Adat", "Bukan Adat"]).default(""),
  lembagaAdat: z.string().trim().max(150).default(""),
  wilayahAdat: z.string().trim().max(5000).default(""),
  peraturanAdat: z.string().trim().max(5000).default(""),
  regulasiPenetapanKampungAdat: z.string().trim().max(255).default(""),
  /** Tahun berdirinya desa; string kosong berarti belum diisi. */
  tahunBerdiri: z
    .string()
    .trim()
    .max(4)
    .default("")
    .refine((nilai) => nilai === "" || /^\d{4}$/.test(nilai), {
      message: "Tahun berdiri harus berupa 4 digit tahun.",
    })
    .refine((nilai) => nilai === "" || (Number(nilai) >= 1000 && Number(nilai) <= 2100), {
      message: "Tahun berdiri harus antara 1000 dan 2100.",
    }),
  /** Tujuan pembangunan, nilai dasar, dan arah kebijakan (satu per baris). */
  tujuanPembangunan: z.string().trim().max(5000).default(""),
  nilaiDasar: z.string().trim().max(5000).default(""),
  arahKebijakan: z.string().trim().max(5000).default(""),
  /** GeoJSON Polygon batas desa (satu ring atau lebih). */
  batasDesa: z
    .string()
    .trim()
    .max(200_000)
    .default("")
    .refine((nilai) => nilai === "" || validasiGeoJsonPolygon(nilai) === null, {
      message: "Batas desa harus berupa GeoJSON Polygon tertutup yang valid.",
    }),
});
export type ProfilDesa = z.infer<typeof profilDesaSchema>;

/**
 * Gabungkan hanya nilai kontak yang dikirim pemanggil ke blob
 * `pengaturan.kontak`. Kanal lain (WhatsApp, media sosial, tautan peta, jam
 * layanan) dipertahankan; `undefined` tidak pernah menimpa nilai lama.
 */
export function gabungKontakProfil(
  lama: Record<string, unknown>,
  baru: Record<string, string | undefined>,
): Record<string, unknown> {
  const hasil = { ...lama };
  for (const [kunci, nilai] of Object.entries(baru)) {
    if (nilai !== undefined) hasil[kunci] = nilai;
  }
  return hasil;
}

/** Sebutan wilayah yang dipakai pada label antarmuka (mis. Desa/Nagari). */
export const sebutanDesaSchema = z.object({
  desa: z.string().trim().min(1).max(40).default("Desa"),
  desaSingkat: z.string().trim().max(20).default("Desa"),
  kecamatan: z.string().trim().min(1).max(40).default("Kecamatan"),
  kecamatanSingkat: z.string().trim().max(20).default("Kec."),
  camat: z.string().trim().min(1).max(40).default("Camat"),
  kabupaten: z.string().trim().min(1).max(40).default("Kabupaten"),
  kabupatenSingkat: z.string().trim().max(20).default("Kab."),
});
export type SebutanDesa = z.infer<typeof sebutanDesaSchema>;

export const SEBUTAN_DESA_DEFAULT: SebutanDesa = sebutanDesaSchema.parse({});

/**
 * Turunkan kode provinsi/kabupaten/kecamatan dari kode desa Kemendagri.
 *
 * Kode desa 10 digit tersusun 2 digit provinsi + 2 digit kabupaten + 2 digit
 * kecamatan + 4 digit desa. `null` bila kode belum lengkap/valid.
 */
export function kodeWilayahDariKodeDesa(kode: string): {
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
} | null {
  const digit = kode.replace(/\D/g, "");
  if (digit.length !== 10) return null;
  return {
    provinsi: digit.slice(0, 2),
    kabupaten: digit.slice(0, 4),
    kecamatan: digit.slice(0, 6),
  };
}
