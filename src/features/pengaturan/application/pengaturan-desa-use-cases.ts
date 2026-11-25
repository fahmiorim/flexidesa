import "server-only";

import {
  bacaIdentitasDesa,
  bacaProfilDesa,
  bacaSebutanDesa,
} from "@/features/identitas-desa/infrastructure/identitas-desa-repository";
import { tokenTemplateSchema } from "@/features/multi-desa/domain/template-website";
import { hitungUkuranMedia } from "@/features/publik/infrastructure/media-storage";
import { notFound, validationError } from "@/lib/errors";

import {
  backupDesaSchema,
  integrasiDesaSchema,
  kontakDesaSchema,
  layananDesaSchema,
  mediaBackupValid,
  tampilanDesaSchema,
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
  terapkanTemaDesa,
  updateLayananDesa,
} from "../infrastructure/pengaturan-desa-repository";
import { bacaNilaiPengaturan } from "../infrastructure/pengaturan-nilai-repository";
import { bacaPengaturan, simpanPengaturanTenant } from "./pengaturan-use-cases";

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
  const [kontak, integrasi, favicon] = await Promise.all([
    bacaNilaiPengaturan(villageId, "pengaturan.kontak"),
    bacaNilaiPengaturan(villageId, "pengaturan.integrasi"),
    bacaNilaiPengaturan(villageId, "pengaturan.favicon"),
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

/** Terapkan template tampilan terbit; pesan hasil dipakai route untuk respons. */
export async function terapkanTemplateDesa(villageId: number, input: unknown): Promise<string> {
  const parsed = tampilanDesaSchema.safeParse(input);
  if (!parsed.success) throw validationError("Template tidak valid.");
  const template = await bacaTemplateTerbit(parsed.data.templateSlug);
  if (!template) throw notFound("Template tidak tersedia atau belum diterbitkan.");
  let rawTokens: unknown;
  try {
    rawTokens = JSON.parse(template.tokens);
  } catch {
    throw validationError("Token template tidak valid.");
  }
  const tokens = tokenTemplateSchema.safeParse(rawTokens);
  if (!tokens.success) throw validationError("Token template tidak sesuai skema tampilan.");
  await terapkanTemaDesa(villageId, {
    slug: template.slug,
    nama: template.name,
    versi: template.version,
    tokens: tokens.data,
  });
  return "Preferensi template website berhasil diterapkan. Tampilan menggunakan komponen website publik FlexiDes dengan token tema yang dipilih.";
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
