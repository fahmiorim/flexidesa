import { z } from "zod";

import { validasiKoordinat } from "@/features/pertanahan-gis/gis/domain/peta-cetak";

export { validasiKoordinat };
export {
  kodeWilayahDariKodeDesa,
  profilDesaSchema,
  SEBUTAN_DESA_DEFAULT,
  sebutanDesaSchema,
} from "@/features/info-desa/identitas-desa/domain/identitas-desa";
export type {
  ProfilDesa,
  SebutanDesa,
} from "@/features/info-desa/identitas-desa/domain/identitas-desa";

/** Data kontak & lokasi desa pada halaman Pengaturan Desa. */
export const kontakDesaSchema = z.object({
  whatsapp: z.string().trim().max(30).default(""),
  telepon: z.string().trim().max(30).default(""),
  nomorOperator: z.string().trim().max(30).default(""),
  kontakPemberitahuanNama: z.string().trim().max(100).default(""),
  kontakPemberitahuanTelepon: z.string().trim().max(30).default(""),
  kontakPemberitahuanJabatan: z.string().trim().max(100).default(""),
  email: z.string().trim().max(100).default(""),
  alamat: z.string().trim().max(255).default(""),
  website: z.string().trim().max(255).default(""),
  instagram: z.string().trim().max(150).default(""),
  facebook: z.string().trim().max(255).default(""),
  youtube: z.string().trim().max(255).default(""),
  koordinat: z.string().trim().max(60).default(""),
  tautanPeta: z.string().trim().max(500).default(""),
  jamLayanan: z.string().trim().max(150).default(""),
});
export type KontakDesa = z.infer<typeof kontakDesaSchema>;

export const integrasiDesaSchema = z.object({
  webhookUrl: z.string().trim().max(500).default(""),
  webhookAktif: z.boolean().default(false),
  endpointEksternal: z.string().trim().max(500).default(""),
  catatan: z.string().trim().max(1000).default(""),
});
export type IntegrasiDesa = z.infer<typeof integrasiDesaSchema>;

export const tampilanDesaSchema = z.object({ templateSlug: z.string().trim().min(1).max(50) });

/**
 * Opsi tema tenant.
 * Nilai mentah divalidasi terhadap schema paket tema di use case, bukan di
 * sini, agar default/min/max berasal dari kode tema dan bukan dari klien.
 */
export const temaOpsiDesaSchema = z.object({
  opsi: z.record(z.string(), z.unknown()),
});

export const layananDesaSchema = z.object({
  nama: z.string().trim().min(2).max(180),
  kategori: z.string().trim().min(2).max(60).default("administrasi"),
  deskripsi: z.string().trim().max(3000).default(""),
  persyaratan: z.string().trim().max(5000).default(""),
  estimasiHari: z.coerce.number().int().min(0).max(365).default(1),
  biaya: z.coerce.number().int().min(0).max(2_000_000_000).default(0),
  metode: z.enum(["online", "langsung", "online_dan_langsung"]).default("online_dan_langsung"),
  aktif: z.boolean().default(true),
});
export type LayananDesa = z.infer<typeof layananDesaSchema>;

/** Format berkas backup konfigurasi desa (restore). */
export const backupDesaSchema = z.object({
  format: z.literal("flexidesa-village-settings"),
  version: z.literal(1),
  desa: z.object({
    nama: z.string().nullable(),
    kode: z.string().nullable(),
    kecamatan: z.string().nullable(),
    kabupaten: z.string().nullable(),
    provinsi: z.string().nullable(),
    kodePos: z.string().nullable(),
    alamat: z.string().nullable(),
    email: z.string().nullable(),
    telepon: z.string().nullable(),
    website: z.string().nullable(),
    logo: z.string().nullable(),
    kepalaDesa: z.string().nullable(),
    nip: z.string().nullable(),
    kodeBps: z.string().nullable().optional(),
    namaCamat: z.string().nullable().optional(),
    nipCamat: z.string().nullable().optional(),
    nomorOperator: z.string().nullable().optional(),
    kontakPemberitahuanNama: z.string().nullable().optional(),
    kontakPemberitahuanTelepon: z.string().nullable().optional(),
    kontakPemberitahuanJabatan: z.string().nullable().optional(),
    fotoKantor: z.string().nullable().optional(),
  }),
  profil: z
    .object({
      visi: z.string().nullable(),
      misi: z.string().nullable(),
      sejarah: z.string().nullable(),
      sambutan: z.string().nullable(),
      koordinat: z.string().nullable(),
      luasWilayah: z.string().nullable(),
      batasUtara: z.string().nullable(),
      batasSelatan: z.string().nullable(),
      batasTimur: z.string().nullable(),
      batasBarat: z.string().nullable(),
      ketinggian: z.string().nullable(),
      suhuRataRata: z.string().nullable(),
      curahHujan: z.string().nullable(),
      topografi: z.string().nullable(),
      jenisTanah: z.string().nullable().optional(),
      sumberDayaAlam: z.string().nullable().optional(),
      floraFauna: z.string().nullable().optional(),
      rawanBencana: z.string().nullable().optional(),
      kearifanLokal: z.string().nullable().optional(),
      jenisJaringan: z.string().nullable().optional(),
      providerInternet: z.string().nullable().optional(),
      cakupanWilayah: z.string().nullable().optional(),
      kecepatanInternet: z.string().nullable().optional(),
      aksesPublik: z.string().nullable().optional(),
      statusDesa: z.string().nullable().optional(),
      lembagaAdat: z.string().nullable().optional(),
      strukturAdat: z.string().nullable().optional(),
      wilayahAdat: z.string().nullable().optional(),
      peraturanAdat: z.string().nullable().optional(),
      regulasiPenetapanKampungAdat: z.string().nullable().optional(),
      dokumenRegulasiPenetapanKampungAdat: z.string().nullable().optional(),
    })
    .nullable(),
  tema: z
    .object({
      slug: z.string().max(50),
      nama: z.string().max(100),
      versi: z.string().max(20),
      opsi: z.string().nullable(),
    })
    .nullable(),
  layanan: z
    .array(
      z.object({
        nama: z.string().min(2).max(180),
        kategori: z.string().max(60),
        deskripsi: z.string().nullable(),
        persyaratan: z.string().nullable(),
        estimasiHari: z.number().int().min(0),
        biaya: z.number().int().min(0),
        metode: z.string().max(80),
        aktif: z.boolean(),
      }),
    )
    .max(500),
  kontak: z.record(z.string(), z.unknown()).nullable(),
  integrasi: z.record(z.string(), z.unknown()).nullable(),
  favicon: z.string().nullable(),
  template: z.string().nullable(),
  umum: z.object({
    komentarAktif: z.boolean(),
    beritaBeranda: z.number().int().min(1).max(12),
    pendaftaranWargaAktif: z.boolean(),
    penomoranSurat: z.number().int().min(1).max(4),
  }),
});
export type BackupDesa = z.infer<typeof backupDesaSchema>;

/** Referensi media backup hanya sah bila berada di folder tenant yang sama. */
export function mediaBackupValid(
  path: string | null,
  villageId: number,
  extensions: readonly string[],
): boolean {
  if (path === null) return true;
  const parts = path.split("/");
  if (parts.length !== 3 || parts[0] !== String(villageId) || parts[1] !== "umum") return false;
  if (parts.some((part) => part === "." || part === ".." || part.includes("\\"))) return false;
  const namaBerkas = parts[2];
  if (!namaBerkas) return false;
  const extensionPattern = extensions.join("|");
  return new RegExp("^\\d+-[a-z0-9-]+\\.(" + extensionPattern + ")$", "i").test(namaBerkas);
}
