import { z } from "zod";

export const STATUS_PAKET = ["active", "archived"] as const;
export type StatusPaket = (typeof STATUS_PAKET)[number];

export const STATUS_VERSI_PAKET = ["draft", "published", "archived"] as const;
export type StatusVersiPaket = (typeof STATUS_VERSI_PAKET)[number];

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug paket minimal 3 karakter.")
  .max(50, "Slug paket maksimal 50 karakter.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug paket hanya huruf kecil, angka, dan tanda hubung.");

export const paketBaruSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional(),
});

const moduleSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug modul tidak valid.");

const fiturSlugsSchema = z
  .array(moduleSlugSchema)
  .max(150, "Paket tidak dapat memuat lebih dari 150 modul.")
  .transform((slugs) => [...new Set(slugs)]);

const idSchema = z.coerce.number().int().positive();

export const ubahPaketSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional(),
});

export const ubahStatusPaketSchema = z.object({
  id: idSchema,
  status: z.enum(STATUS_PAKET),
});

export const ubahFiturDrafPaketSchema = z.object({
  planId: idSchema,
  versionId: idSchema,
  moduleSlugs: fiturSlugsSchema,
  changelog: z.string().trim().max(500).optional(),
});

export const buatVersiDrafPaketSchema = z.object({ planId: idSchema });

export const terbitkanVersiPaketSchema = z.object({ planId: idSchema, versionId: idSchema });

export const previewRolloutVersiPaketSchema = terbitkanVersiPaketSchema;

export const rolloutVersiPaketSchema = terbitkanVersiPaketSchema.extend({
  confirmed: z.literal(true),
});

export const penetapanPaketSchema = z.object({
  villageIds: z
    .array(idSchema)
    .min(1)
    .max(500)
    .transform((ids) => [...new Set(ids)]),
  planVersionId: idSchema,
  confirmed: z.literal(true),
});

export interface ModulPaketSumber {
  slug: string;
  name: string;
  url: string | null;
  isGroup: boolean;
  isHidden: boolean;
  isActive: boolean;
  parentSlug: string | null;
  sortOrder: number;
}

export interface FiturPaket {
  slug: string;
  name: string;
  parentSlug: string | null;
  parentName: string;
  sortOrder: number;
}

/** Modul yang dapat dijual sebagai fitur: halaman nyata, aktif, dan bukan grup. */
export function katalogFiturPaket(
  modulList: readonly ModulPaketSumber[],
  routes: ReadonlySet<string>,
): FiturPaket[] {
  const namaGrup = new Map(
    modulList.filter((modul) => modul.isGroup).map((modul) => [modul.slug, modul.name]),
  );
  return modulList
    .filter(
      (modul) =>
        modul.slug !== "beranda" &&
        modul.isActive &&
        !modul.isGroup &&
        !modul.isHidden &&
        modul.url !== null &&
        routes.has(modul.url),
    )
    .map(({ slug, name, parentSlug, sortOrder }) => ({
      slug,
      name,
      parentSlug,
      parentName: parentSlug ? (namaGrup.get(parentSlug) ?? "Modul lain") : "Modul utama",
      sortOrder,
    }));
}
