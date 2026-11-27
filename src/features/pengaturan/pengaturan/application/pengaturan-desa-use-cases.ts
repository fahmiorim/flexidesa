import "server-only";

import {
  bacaIdentitasDesa,
  bacaProfilDesa,
  bacaSebutanDesa,
} from "@/features/info-desa/identitas-desa/application/kontrak";
import { simpanBerkasMedia } from "@/features/info-desa/publik/application/simpan-berkas-media";
import {
  FAQ_KONTAK_DEFAULT,
  FAQ_SURAT_DEFAULT,
  faqSchema,
  parseFaq,
} from "@/features/info-desa/publik/domain/faq";
import { hapusMedia, hitungUkuranMedia } from "@/features/media/infrastructure/media-storage";
import { tokenTemplateSchema } from "@/features/multi-desa/domain/template-website";
import { conflict, notFound, validationError } from "@/lib/errors";
import { definisiOpsiTema, migrasiOpsiUntukTema, validasiOpsiUntukTema } from "@/themes/migrasi";
import { migrasiOpsiVersi } from "@/themes/types";

import {
  backupDesaSchema,
  integrasiDesaSchema,
  kontakDesaSchema,
  layananDesaSchema,
  mediaBackupValid,
  tampilanDesaSchema,
  temaOpsiDesaSchema,
  validasiKoordinat,
  type LayananDesa,
} from "../domain/pengaturan-desa";
import {
  bacaDataBackupDesa,
  bacaKuotaMedia,
  bacaTemaAktif,
  bacaTemplateTerbit,
  createLayananDesa,
  listLayananAdminDesa,
  listLayananDesa,
  listTemplateTerbit,
  nonaktifkanLayananDesa as nonaktifkanLayananDesaRepo,
  pulihkanDataBackupDesa,
  simpanIntegrasiDesa as simpanIntegrasiDesaRepo,
  simpanKontakDesa as simpanKontakDesaRepo,
  simpanOpsiTemaDesa as simpanOpsiTemaDesaRepo,
  terapkanTemaDesa,
  updateLayananDesa,
} from "../infrastructure/pengaturan-desa-repository";
import {
  bacaNilaiPengaturan,
  simpanNilaiPengaturan,
} from "../infrastructure/pengaturan-nilai-repository";
import { bacaPengaturan, simpanPengaturanTenant } from "./pengaturan-use-cases";

/** Nilai JSON `theme.opsi` (token, branding, opsi paket). */
function parseOpsiTema(raw: string | null | undefined): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** Subtree `templateOptions` dari `theme.opsi`. */
function templateOptionsDari(opsi: Record<string, unknown>): Record<string, unknown> | null {
  const raw = opsi.templateOptions;
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null;
}

/** Data lengkap halaman Pengaturan Desa (satu kali baca paralel). */
export async function getDataPengaturanDesa(villageId: number) {
  const [desa, profil, layanan, templates, temaAktif, umum, mediaUsage, mediaQuotaMb, sebutan] =
    await Promise.all([
      bacaIdentitasDesa(villageId),
      bacaProfilDesa(villageId),
      listLayananAdminDesa(villageId),
      listTemplateTerbit(),
      bacaTemaAktif(villageId),
      bacaPengaturan(villageId),
      hitungUkuranMedia(villageId),
      bacaKuotaMedia(villageId),
      bacaSebutanDesa(villageId),
    ]);
  const [kontak, integrasi, favicon, faqKontak, faqSurat] = await Promise.all([
    bacaNilaiPengaturan(villageId, "pengaturan.kontak"),
    bacaNilaiPengaturan(villageId, "pengaturan.integrasi"),
    bacaNilaiPengaturan(villageId, "pengaturan.favicon"),
    bacaNilaiPengaturan(villageId, "pengaturan.faq_kontak"),
    bacaNilaiPengaturan(villageId, "pengaturan.faq_layanan_surat"),
  ]);

  return {
    desa,
    profil,
    layanan,
    kontak:
      typeof kontak === "object" && kontak !== null && !Array.isArray(kontak)
        ? (kontak as Record<string, unknown>)
        : {},
    integrasi:
      typeof integrasi === "object" && integrasi !== null && !Array.isArray(integrasi)
        ? (integrasi as Record<string, unknown>)
        : {},
    favicon,
    faqKontak: parseFaq(faqKontak, FAQ_KONTAK_DEFAULT),
    faqSurat: parseFaq(faqSurat, FAQ_SURAT_DEFAULT),
    templates: templates.map((template) => ({
      ...template,
      tokens: (() => {
        try {
          const parsed = tokenTemplateSchema.safeParse(JSON.parse(template.tokens));
          return parsed.success ? parsed.data : {};
        } catch {
          return {};
        }
      })(),
      tags: (() => {
        try {
          return JSON.parse(template.tags) as unknown;
        } catch {
          return [];
        }
      })(),
    })),
    temaAktif,
    temaOpsi: (() => {
      const definisi = definisiOpsiTema(temaAktif?.slug, temaAktif?.versi);
      if (!definisi) return null;
      const { opsi, peringatan } = migrasiOpsiVersi(
        templateOptionsDari(parseOpsiTema(temaAktif?.opsi)),
        definisi,
      );
      return {
        slug: temaAktif?.slug ?? null,
        versi: temaAktif?.versi ?? null,
        definisi,
        nilai: opsi,
        peringatan,
      };
    })(),
    umum,
    sebutan,
    media: { usedBytes: mediaUsage, quotaMb: mediaQuotaMb },
  };
}

export async function simpanKontakDesa(villageId: number, input: unknown): Promise<void> {
  const parsed = kontakDesaSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message ?? "Kontak tidak valid.");
  }
  const d = parsed.data;
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
    throw validationError("Format email desa tidak valid.");
  for (const url of [d.website, d.tautanPeta]) {
    if (!url) continue;
    try {
      const u = new URL(url);
      if (!["https:", "http:"].includes(u.protocol)) throw new Error();
    } catch {
      throw validationError(
        url === d.website
          ? "Website desa harus berupa URL HTTP/HTTPS."
          : "Tautan peta harus berupa URL HTTP/HTTPS.",
      );
    }
  }
  for (const number of [d.telepon, d.whatsapp, d.nomorOperator, d.kontakPemberitahuanTelepon]) {
    if (number && !/^[0-9+()\s-]{6,30}$/.test(number))
      throw validationError("Nomor telepon/WhatsApp tidak valid.");
  }
  const kesalahanKoordinat = validasiKoordinat(d.koordinat);
  if (kesalahanKoordinat) throw validationError(kesalahanKoordinat);
  await simpanKontakDesaRepo(villageId, d);
}

export type JenisFaq = "kontak" | "surat";

/** Simpan FAQ publik per desa; kunci ditentukan server-side, bukan dari klien. */
export async function simpanFaqDesa(
  villageId: number,
  jenis: JenisFaq,
  input: unknown,
): Promise<void> {
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message ?? "Daftar FAQ tidak valid.");
  }
  const kunci = jenis === "kontak" ? "pengaturan.faq_kontak" : "pengaturan.faq_layanan_surat";
  await simpanNilaiPengaturan(villageId, kunci, parsed.data);
}

export async function simpanIntegrasiDesa(villageId: number, input: unknown): Promise<void> {
  const parsed = integrasiDesaSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message ?? "Pengaturan integrasi tidak valid.");
  }
  const d = parsed.data;
  for (const field of ["webhookUrl", "endpointEksternal"] as const) {
    const value = d[field];
    if (!value) continue;
    try {
      const u = new URL(value);
      if (!["https:", "http:"].includes(u.protocol)) throw new Error();
    } catch {
      throw validationError("URL integrasi harus menggunakan HTTP/HTTPS.");
    }
  }
  await simpanIntegrasiDesaRepo(villageId, d);
}

/**
 * Terapkan template tampilan terbit; pesan hasil dipakai route untuk respons.
 *
 * Slug wajib punya paket kode di registry. Opsi tenant lama dimigrasikan ke
 * schema paket baru (nilai valid dipertahankan, key asing dilaporkan) agar
 * ganti tema tidak menghapus pengaturan desa secara diam-diam.
 */
export async function terapkanTemplateDesa(villageId: number, input: unknown): Promise<string> {
  const parsed = tampilanDesaSchema.safeParse(input);
  if (!parsed.success) throw validationError("Template tidak valid.");
  const template = await bacaTemplateTerbit(parsed.data.templateSlug);
  if (!template) throw notFound("Template tidak tersedia atau belum diterbitkan.");
  const lama = await bacaTemaAktif(villageId);
  const migrasi = migrasiOpsiUntukTema(
    template.slug,
    template.version,
    templateOptionsDari(parseOpsiTema(lama?.opsi)),
  );
  if (!migrasi) {
    throw conflict("Template ini belum memiliki paket tema berkode di registry aplikasi.");
  }
  let rawTokens: unknown;
  try {
    rawTokens = JSON.parse(template.tokens);
  } catch {
    throw validationError("Token template tidak valid.");
  }
  const tokens = tokenTemplateSchema.safeParse(rawTokens);
  if (!tokens.success) throw validationError("Token template tidak sesuai skema tampilan.");
  await terapkanTemaDesa(
    villageId,
    {
      slug: template.slug,
      nama: template.name,
      versi: template.version,
      tokens: tokens.data,
    },
    migrasi.opsi,
  );
  const catatan = migrasi.peringatan.length
    ? ` Opsi lama tidak dipakai: ${migrasi.peringatan.join(" ")}`
    : "";
  return `Preferensi template website berhasil diterapkan. Tampilan menggunakan komponen website publik FlexiDes dengan token tema yang dipilih.${catatan}`;
}

/**
 * Simpan opsi tema tenant (mis. warna dasar, jam, statistik, jumlah per halaman).
 * Nilai divalidasi terhadap `config.json` paket tema aktif, bukan terhadap
 * kiriman klien, lalu disimpan pada `theme.opsi.templateOptions`.
 */
export async function simpanOpsiTemaDesa(
  villageId: number,
  input: unknown,
): Promise<{ peringatan: string[] }> {
  const parsed = temaOpsiDesaSchema.safeParse(input);
  if (!parsed.success) throw validationError("Opsi tema tidak valid.");
  const aktif = await bacaTemaAktif(villageId);
  if (!aktif) throw notFound("Desa belum memiliki tema website aktif.");
  const definisi = definisiOpsiTema(aktif.slug, aktif.versi);
  if (!definisi) {
    throw conflict("Tema aktif tidak memiliki paket kode terdaftar; opsi tidak dapat disimpan.");
  }
  for (const item of definisi) {
    if (item.type !== "unggah") continue;
    const kiriman = parsed.data.opsi[item.key];
    if (kiriman === undefined || kiriman === null || kiriman === "") continue;
    if (!pathMediaTenant(villageId, kiriman)) {
      throw validationError(
        `Aset opsi "${item.label}" harus berasal dari unggahan desa ini, bukan path bebas.`,
      );
    }
  }
  const nilai = validasiOpsiUntukTema(aktif.slug, aktif.versi, parsed.data.opsi);
  if (!nilai) throw conflict("Schema opsi tema tidak ditemukan.");
  const { peringatan } = migrasiOpsiVersi(parsed.data.opsi, definisi);
  await simpanOpsiTemaDesaRepo(villageId, nilai);
  return { peringatan };
}

/**
 * Path media opsi tema yang sah harus berada di ruang tenant (`<villageId>/...`).
 * Nilai dari database maupun kiriman klien tidak dipercaya: path di luar ruang
 * tenant diabaikan agar berkas tenant lain tidak pernah dihapus/dipakai.
 */
function pathMediaTenant(villageId: number, nilai: unknown): string | null {
  if (typeof nilai !== "string") return null;
  const jalur = nilai.trim().replace(/\\/g, "/");
  if (!jalur || jalur.includes("..")) return null;
  return jalur.startsWith(`${villageId}/`) ? jalur : null;
}

/** Opsi paket bertipe `unggah` (mis. foto fallback) yang boleh diubah tenant. */
async function opsiUnggahan(villageId: number, key: string) {
  const aktif = await bacaTemaAktif(villageId);
  if (!aktif) throw notFound("Desa belum memiliki tema website aktif.");
  const definisi = definisiOpsiTema(aktif.slug, aktif.versi);
  if (!definisi) throw conflict("Tema aktif tidak memiliki paket kode terdaftar.");
  const item = definisi.find((d) => d.key === key);
  if (!item || item.type !== "unggah") throw validationError("Opsi media tema tidak dikenal.");
  if (item.readonly) throw conflict("Opsi media tema ini tidak dapat diubah.");
  return { aktif, definisi, opsi: templateOptionsDari(parseOpsiTema(aktif.opsi)) ?? {} };
}

/**
 * Unggah aset opsi tema (bukan source paket): validasi MIME/ukuran, simpan di
 * ruang media tenant, tulis path ke `templateOptions`, lalu hapus berkas lama.
 */
export async function simpanOpsiTemaMedia(
  villageId: number,
  key: string,
  berkas: File,
): Promise<{ path: string }> {
  const { aktif, opsi } = await opsiUnggahan(villageId, key);
  const path = await simpanBerkasMedia(
    villageId,
    {
      nama: berkas.name,
      mime: berkas.type,
      ukuran: berkas.size,
      isi: new Uint8Array(await berkas.arrayBuffer()),
    },
    "umum",
    key,
  );
  const lama = pathMediaTenant(villageId, opsi[key]);
  const nilai = validasiOpsiUntukTema(aktif.slug, aktif.versi, { ...opsi, [key]: path });
  if (!nilai) throw conflict("Schema opsi tema tidak ditemukan.");
  await simpanOpsiTemaDesaRepo(villageId, nilai);
  if (lama && lama !== path) await hapusMedia(lama).catch(() => undefined);
  return { path };
}

/** Hapus aset opsi tema beserta berkasnya. */
export async function hapusOpsiTemaMedia(villageId: number, key: string): Promise<void> {
  const { aktif, opsi } = await opsiUnggahan(villageId, key);
  const lama = pathMediaTenant(villageId, opsi[key]);
  const nilai = validasiOpsiUntukTema(aktif.slug, aktif.versi, { ...opsi, [key]: null });
  if (!nilai) throw conflict("Schema opsi tema tidak ditemukan.");
  await simpanOpsiTemaDesaRepo(villageId, nilai);
  if (lama) await hapusMedia(lama).catch(() => undefined);
}

export async function listLayananDesaAdmin(villageId: number) {
  return listLayananDesa(villageId);
}

function parseLayanan(input: unknown): LayananDesa {
  const parsed = layananDesaSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message ?? "Data layanan tidak valid.");
  }
  return parsed.data;
}

export async function tambahLayananDesa(
  villageId: number,
  input: unknown,
): Promise<number | undefined> {
  return createLayananDesa(villageId, parseLayanan(input));
}

export async function ubahLayananDesa(
  villageId: number,
  id: number,
  input: unknown,
): Promise<boolean> {
  return updateLayananDesa(villageId, id, parseLayanan(input));
}

export async function nonaktifkanLayananDesa(villageId: number, id: number): Promise<boolean> {
  return nonaktifkanLayananDesaRepo(villageId, id);
}

/** Simpan path media identitas baru dan kembalikan path lama untuk dihapus. */
export async function getDataBackupDesa(villageId: number) {
  const [data, umum] = await Promise.all([
    bacaDataBackupDesa(villageId),
    bacaPengaturan(villageId),
  ]);
  return { ...data, umum };
}

export type HasilPulihkanBackup =
  | { status: "ok" }
  | { status: "media-logo-tidak-valid" }
  | { status: "media-favicon-tidak-valid" }
  | { status: "media-foto-kantor-tidak-valid" }
  | { status: "media-struktur-adat-tidak-valid" }
  | { status: "media-dokumen-adat-tidak-valid" };

/** Validasi berkas backup, pulihkan konfigurasi, lalu simpan preferensi umum. */
export async function pulihkanBackupDesa(
  villageId: number,
  input: unknown,
  actorId?: string,
): Promise<HasilPulihkanBackup> {
  const parsed = backupDesaSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message ?? "Format backup tidak sesuai.");
  }
  const backup = parsed.data;
  if (!mediaBackupValid(backup.desa.logo, villageId, ["jpg", "png", "svg"]))
    return { status: "media-logo-tidak-valid" };
  if (!mediaBackupValid(backup.favicon, villageId, ["png"]))
    return { status: "media-favicon-tidak-valid" };
  if (!mediaBackupValid(backup.desa.fotoKantor ?? null, villageId, ["jpg", "jpeg", "png", "webp"]))
    return { status: "media-foto-kantor-tidak-valid" };
  if (
    backup.profil?.strukturAdat &&
    !mediaBackupValid(backup.profil.strukturAdat, villageId, ["jpg", "jpeg", "png", "webp"])
  )
    return { status: "media-struktur-adat-tidak-valid" };
  if (
    backup.profil?.dokumenRegulasiPenetapanKampungAdat &&
    !mediaBackupValid(backup.profil.dokumenRegulasiPenetapanKampungAdat, villageId, ["pdf"])
  )
    return { status: "media-dokumen-adat-tidak-valid" };
  await pulihkanDataBackupDesa(villageId, backup);
  await simpanPengaturanTenant(villageId, backup.umum, actorId);
  return { status: "ok" };
}
