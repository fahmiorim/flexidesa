import "server-only";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { theme, villages, websiteTemplates, websiteTemplateVersions } from "@/db/schema";
import {
  tokenTemplateSchema,
  type StatusTemplate,
  type TokenTemplate,
} from "@/features/multi-desa/domain/template-website";
import { conflict, notFound } from "@/lib/errors";

/** Baris katalog beserta jumlah tenant yang memakainya. */
export interface TemplateWebsiteRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  version: string;
  status: StatusTemplate;
  tokens: TokenTemplate;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  jumlahTenant: number;
  /** Tenant yang masih memakai versi lama dari slug yang sama. */
  jumlahTertinggal: number;
}

export interface VersiTemplateWebsiteRow {
  id: number;
  version: string;
  changelog: string;
  createdAt: Date;
}

export interface PenggunaanTemplateWebsiteRow {
  villageId: number;
  namaDesa: string | null;
  domain: string | null;
  themeSlug: string;
  themeNama: string;
  versi: string;
  diperbaruiPada: Date;
}

function parseTokens(value: string): TokenTemplate {
  try {
    return tokenTemplateSchema.parse(JSON.parse(value));
  } catch {
    // Baris lama yang rusak tidak boleh membuat seluruh katalog gagal dibuka.
    return {
      primary: "#2563eb",
      secondary: "#1e40af",
      accent: "#f59e0b",
      background: "#f8fafc",
      surface: "#ffffff",
      text: "#0f172a",
      fontHeading: "sans",
      radius: "sedang",
      style: "terang",
      layout: "klasik",
      judulHero: "",
      subHero: "",
      taglineFooter: "",
    };
  }
}

function parseTags(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

const kolomKatalog = {
  id: websiteTemplates.id,
  slug: websiteTemplates.slug,
  name: websiteTemplates.name,
  category: websiteTemplates.category,
  description: websiteTemplates.description,
  version: websiteTemplates.version,
  status: websiteTemplates.status,
  tokens: websiteTemplates.tokens,
  tags: websiteTemplates.tags,
  createdAt: websiteTemplates.createdAt,
  updatedAt: websiteTemplates.updatedAt,
  jumlahTenant: sql<number>`(
    SELECT COUNT(*) FROM theme t
    WHERE t.slug = website_templates.slug AND t.aktif = 1
  )`,
  jumlahTertinggal: sql<number>`(
    SELECT COUNT(*) FROM theme t
    WHERE t.slug = website_templates.slug
      AND t.aktif = 1
      AND t.versi <> website_templates.version
  )`,
};

function rapikan(row: {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  version: string;
  status: string;
  tokens: string;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
  jumlahTenant: number;
  jumlahTertinggal: number;
}): TemplateWebsiteRow {
  return {
    ...row,
    status: row.status as StatusTemplate,
    tokens: parseTokens(row.tokens),
    tags: parseTags(row.tags),
    jumlahTenant: Number(row.jumlahTenant),
    jumlahTertinggal: Number(row.jumlahTertinggal),
  };
}

/** Semua template, terbaru lebih dulu. */
export async function listTemplateWebsite(): Promise<TemplateWebsiteRow[]> {
  const rows = await db
    .select(kolomKatalog)
    .from(websiteTemplates)
    .orderBy(desc(websiteTemplates.updatedAt), asc(websiteTemplates.name));

  return rows.map(rapikan);
}

/** Satu template; `null` bila id tidak ada. */
export async function getTemplateWebsite(id: number): Promise<TemplateWebsiteRow | null> {
  const [row] = await db
    .select(kolomKatalog)
    .from(websiteTemplates)
    .where(eq(websiteTemplates.id, id))
    .limit(1);
  return row ? rapikan(row) : null;
}

/** Riwayat versi sebuah template. */
export async function listVersiTemplateWebsite(
  templateId: number,
): Promise<VersiTemplateWebsiteRow[]> {
  return db
    .select({
      id: websiteTemplateVersions.id,
      version: websiteTemplateVersions.version,
      changelog: websiteTemplateVersions.changelog,
      createdAt: websiteTemplateVersions.createdAt,
    })
    .from(websiteTemplateVersions)
    .where(eq(websiteTemplateVersions.templateId, templateId))
    .orderBy(desc(websiteTemplateVersions.createdAt), desc(websiteTemplateVersions.id));
}

/** Tenant yang memakai template ini sebagai tema aktif. */
export async function listPenggunaanTemplateWebsite(
  template: Pick<TemplateWebsiteRow, "slug">,
): Promise<PenggunaanTemplateWebsiteRow[]> {
  return db
    .select({
      villageId: villages.id,
      namaDesa: villages.name,
      domain: sql<string | null>`(
        SELECT d.domain FROM village_domains d
        WHERE d.village_id = villages.id
        ORDER BY d.is_primary DESC, d.id ASC
        LIMIT 1
      )`,
      themeSlug: theme.slug,
      themeNama: theme.nama,
      versi: theme.versi,
      diperbaruiPada: theme.updatedAt,
    })
    .from(theme)
    .innerJoin(villages, eq(theme.villageId, villages.id))
    .where(and(eq(theme.slug, template.slug), eq(theme.aktif, true)))
    .orderBy(asc(villages.name));
}

export interface DesaUntukTemplateRow {
  id: number;
  namaDesa: string | null;
}

/** Semua desa (tenant) untuk form ganti template dari Super Admin. */
export async function listDesaUntukTemplate(): Promise<DesaUntukTemplateRow[]> {
  return db
    .select({ id: villages.id, namaDesa: villages.name })
    .from(villages)
    .orderBy(asc(villages.name));
}

/**
 * Terapkan template terbit sebagai tema aktif satu desa.
 *
 * Satu-satunya sumber kebenaran tema publik adalah baris `theme` aktif per
 * `village_id`; menonaktifkan yang lama lalu mengaktifkan template baru
 * membuat situs desa langsung memakai token template tersebut.
 */
export async function terapkanTemplateKeDesaRepo(
  villageId: number,
  template: { slug: string; nama: string; versi: string; tokens: TokenTemplate },
  templateOptions?: Record<string, unknown>,
): Promise<void> {
  const options: Record<string, unknown> = {
    templateSlug: template.slug,
    templateTokens: template.tokens,
  };
  if (templateOptions) options.templateOptions = templateOptions;
  const bacaObjek = (value: string | null | undefined): Record<string, unknown> => {
    try {
      const parsed: unknown = JSON.parse(value ?? "");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  };
  await db.transaction(async (tx) => {
    const [currentActive] = await tx
      .select({ opsi: theme.opsi })
      .from(theme)
      .where(and(eq(theme.villageId, villageId), eq(theme.aktif, true)))
      .limit(1);
    await tx.update(theme).set({ aktif: false }).where(eq(theme.villageId, villageId));
    const [same] = await tx
      .select({ id: theme.id, opsi: theme.opsi })
      .from(theme)
      .where(and(eq(theme.villageId, villageId), eq(theme.slug, template.slug)))
      .limit(1);
    if (same) {
      const previous = bacaObjek(currentActive?.opsi ?? same.opsi);
      await tx
        .update(theme)
        .set({
          nama: template.nama,
          versi: template.versi,
          aktif: true,
          opsi: JSON.stringify({ ...previous, ...options }),
        })
        .where(and(eq(theme.villageId, villageId), eq(theme.id, same.id)));
    } else {
      const previous = bacaObjek(currentActive?.opsi ?? null);
      await tx.insert(theme).values({
        villageId,
        slug: template.slug,
        nama: template.nama,
        versi: template.versi,
        aktif: true,
        opsi: JSON.stringify({ ...previous, ...options }),
      });
    }
  });
}

export async function slugTemplateDipakai(slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: websiteTemplates.id })
    .from(websiteTemplates)
    .where(eq(websiteTemplates.slug, slug))
    .limit(1);
  return Boolean(row);
}

/** Buat template baru beserta snapshot versi pertamanya. */
export async function buatTemplateWebsite(input: {
  slug: string;
  name: string;
  category: string;
  description: string;
  version: string;
  tokens: TokenTemplate;
  tags: string[];
  createdBy: string;
}): Promise<{ id: number }> {
  return db.transaction(async (tx) => {
    const [baris] = await tx
      .insert(websiteTemplates)
      .values({
        slug: input.slug,
        name: input.name,
        category: input.category,
        description: input.description,
        version: input.version,
        status: "draft",
        tokens: JSON.stringify(input.tokens),
        tags: JSON.stringify(input.tags),
        createdBy: input.createdBy,
      })
      .$returningId();

    if (!baris) throw conflict("Gagal menyimpan template website.");

    await tx.insert(websiteTemplateVersions).values({
      templateId: baris.id,
      version: input.version,
      changelog: "Versi awal template.",
      tokens: JSON.stringify(input.tokens),
    });

    return { id: baris.id };
  });
}

/**
 * Perbarui metadata template.
 *
 * Slug tidak dapat diubah karena menjadi kunci pencocokan tema tenant. Versi
 * baru hanya ditambahkan bila nomor versi berubah; perubahan deskripsi kecil
 * tidak memaksa penerbitan versi baru.
 */
export async function ubahTemplateWebsite(input: {
  id: number;
  name: string;
  category: string;
  description: string;
  version: string;
  tokens: TokenTemplate;
  tags: string[];
  changelog: string;
}): Promise<{ versiBaru: boolean }> {
  return db.transaction(async (tx) => {
    const [sebelum] = await tx
      .select({ version: websiteTemplates.version })
      .from(websiteTemplates)
      .where(eq(websiteTemplates.id, input.id))
      .limit(1);
    if (!sebelum) throw notFound("Template website tidak ditemukan.");

    await tx
      .update(websiteTemplates)
      .set({
        name: input.name,
        category: input.category,
        description: input.description,
        version: input.version,
        tokens: JSON.stringify(input.tokens),
        tags: JSON.stringify(input.tags),
      })
      .where(eq(websiteTemplates.id, input.id));

    if (sebelum.version === input.version) return { versiBaru: false };

    await tx.insert(websiteTemplateVersions).values({
      templateId: input.id,
      version: input.version,
      changelog: input.changelog.trim() || "Pembaruan template.",
      tokens: JSON.stringify(input.tokens),
    });

    return { versiBaru: true };
  });
}

/** Ubah status publikasi tanpa menghapus riwayat versi. */
export async function setStatusTemplateWebsite(id: number, status: StatusTemplate): Promise<void> {
  const hasil = await db
    .update(websiteTemplates)
    .set({ status })
    .where(eq(websiteTemplates.id, id));
  if (hasil[0].affectedRows === 0) throw notFound("Template website tidak ditemukan.");
}

/** Baris `theme.opsi` tenant terpilih; dipakai migrasi opsi saat distribusi versi. */
export async function opsiTemaTenant(
  villageIds: number[],
): Promise<{ villageId: number; slug: string; versi: string; opsi: string | null }[]> {
  if (villageIds.length === 0) return [];
  return db
    .select({ villageId: theme.villageId, slug: theme.slug, versi: theme.versi, opsi: theme.opsi })
    .from(theme)
    .where(and(eq(theme.aktif, true), inArray(theme.villageId, villageIds)));
}

/**
 * Perbarui versi tema tenant terpilih.
 *
 * Hanya baris `theme` dengan slug template yang sama dan masih aktif yang
 * disentuh. Id desa yang tidak memakai template ini diabaikan, sehingga form
 * yang dimanipulasi tidak dapat mengubah tema tenant lain. `opsiBaru` berisi
 * hasil migrasi schema opsi per tenant agar versi baru tidak menghapus nilai
 * yang masih valid atau menyimpan key asing.
 */
export async function distribusikanVersiTemplate(
  template: Pick<TemplateWebsiteRow, "slug" | "name" | "version">,
  villageIds: number[],
  opsiBaru?: Map<number, Record<string, unknown>>,
): Promise<number> {
  if (villageIds.length === 0) return 0;

  return db.transaction(async (tx) => {
    let jumlah = 0;
    for (const villageId of villageIds) {
      const [row] = await tx
        .select({ id: theme.id, opsi: theme.opsi })
        .from(theme)
        .where(
          and(eq(theme.slug, template.slug), eq(theme.aktif, true), eq(theme.villageId, villageId)),
        )
        .limit(1);
      if (!row) continue;
      let opsi = row.opsi;
      if (opsiBaru?.has(villageId)) {
        let root: Record<string, unknown> = {};
        try {
          const parsed: unknown = JSON.parse(row.opsi ?? "{}");
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
            root = parsed as Record<string, unknown>;
        } catch {
          root = {};
        }
        opsi = JSON.stringify({ ...root, templateOptions: opsiBaru.get(villageId) });
      }
      await tx
        .update(theme)
        .set({ nama: template.name, versi: template.version, opsi })
        .where(eq(theme.id, row.id));
      jumlah += 1;
    }
    return jumlah;
  });
}
