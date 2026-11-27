import type { ReactNode } from "react";
import { z } from "zod";

/**
 * Kontrak paket tema situs publik (ala OpenSID, dikompilasi saat build).
 *
 * Setiap tema di `src/themes/<slug>/<version>/` membawa `manifest.json`,
 * `config.json`, dan `layout.tsx`. Registry (`registry.ts`) adalah satu-satunya
 * pintu masuk dari slug/versi di database — tidak pernah membentuk import path
 * dari input pengguna. Komponen tema menerima data sebagai props dan tidak
 * mengakses database; tenant tetap ditentukan di server sebelum render.
 */

/** Keluarga halaman publik yang wajib disediakan setiap tema terbit. */
export const SURFACE_WAJIB = ["beranda", "profil", "konten", "data", "media", "layanan"] as const;

export type SurfaceKey = (typeof SURFACE_WAJIB)[number];

export const JENIS_OPSI_TEMA = [
  "color-picker",
  "select",
  "input-number",
  "input-text",
  "unggah",
] as const;

export type JenisOpsi = (typeof JENIS_OPSI_TEMA)[number];

export interface ThemeOptionAttributes {
  min?: number;
  max?: number;
  step?: number;
  class?: string;
  accept?: string;
}

export interface ThemeOptionDefinition {
  key: string;
  label: string;
  description: string;
  type: JenisOpsi;
  default: unknown;
  group: string;
  readonly?: boolean;
  options?: Record<string, string>;
  attributes?: ThemeOptionAttributes;
}

export interface ThemeManifest {
  slug: string;
  version: string;
  kompatibilitas: string;
  surfaces: SurfaceKey[];
  preview?: string;
}

export interface ThemeLayoutProps {
  villageId: number;
  villageName: string | null;
  location: string;
  activePath?: string;
  /** Nilai opsi tervalidasi dari `theme.opsi.templateOptions`. */
  opsi: Record<string, unknown>;
  /** Widget paket (jam, statistik, foto fallback) agar layout tidak hardcode. */
  widgets: ThemeWidgets;
  /** Token klasik (warna/font) atau null bila tema tanpa token. */
  tema: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    judulHero: string;
    layout: "klasik" | "modern" | "ringkas";
    style: "terang" | "gelap";
  } | null;
  children: ReactNode;
}

export interface ThemePageProps {
  villageId: number;
  villageName: string | null;
  location: string;
  activePath?: string;
  opsi: Record<string, unknown>;
  widgets: ThemeWidgets;
  children: ReactNode;
}

export type ThemePageComponent = (props: ThemePageProps) => ReactNode;

export interface ThemeWidgetProps {
  villageId: number;
  villageName: string | null;
  opsi: Record<string, unknown>;
}

export interface ThemeWidgets {
  jam: (props: ThemeWidgetProps) => ReactNode;
  statistik: (props: ThemeWidgetProps) => ReactNode;
  fotoFallback: (props: ThemeWidgetProps & { fotoUrl: string | null }) => ReactNode;
}

export interface ThemeDefinition {
  manifest: ThemeManifest;
  opsi: ThemeOptionDefinition[];
  layout: (props: ThemeLayoutProps) => ReactNode;
  /** Renderer per surface wajib; komponen bersama terdaftar sebagai shared. */
  pages: Record<SurfaceKey, ThemePageComponent>;
  widgets: ThemeWidgets;
  defaultOpsi: () => Record<string, unknown>;
}

const opsiTypeSchema = z.enum(JENIS_OPSI_TEMA);

export const opsiDefinisiSchema = z.object({
  key: z.string().min(1, "key opsi kosong."),
  label: z.string().min(1, "label opsi kosong."),
  description: z.string().default(""),
  type: opsiTypeSchema,
  default: z.unknown(),
  group: z.string().default("Umum"),
  readonly: z.boolean().optional(),
  options: z.record(z.string(), z.string()).nullable().optional(),
  attributes: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().optional(),
      class: z.string().optional(),
      accept: z.string().optional(),
    })
    .nullable()
    .optional(),
});

/** Parses a theme `config.json` array into option definitions. */
export function parseConfigOpsi(value: unknown): ThemeOptionDefinition[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => opsiDefinisiSchema.safeParse(item))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data as ThemeOptionDefinition);
}

const warnaSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

function validasiNilai(item: ThemeOptionDefinition, value: unknown): unknown {
  let parsed: unknown = value;
  if (parsed === null || parsed === undefined) parsed = item.default;
  switch (item.type) {
    case "color-picker": {
      const text = String(parsed ?? "").trim();
      return warnaSchema.safeParse(text).success ? text : String(item.default);
    }
    case "select": {
      const text = String(parsed ?? "").trim();
      return item.options && text in item.options ? text : String(item.default);
    }
    case "input-number": {
      const num = Number(parsed);
      if (!Number.isFinite(num)) return item.default;
      const { min, max } = item.attributes ?? {};
      const clamped = Math.min(
        max ?? Number.MAX_SAFE_INTEGER,
        Math.max(min ?? Number.MIN_SAFE_INTEGER, num),
      );
      return clamped;
    }
    default:
      return typeof parsed === "string" ? parsed : item.default;
  }
}

/**
 * Validasi + normalisasi nilai opsi tenant terhadap definisi paket.
 * Nilai asing yang tidak terdefinisi dibuang; yang tak valid jatuh ke default.
 */
export function validasiOpsiTenant(
  definisi: ThemeOptionDefinition[],
  nilai: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const fallback = Object.fromEntries(definisi.map((d) => [d.key, d.default]));
  if (!nilai || typeof nilai !== "object" || Array.isArray(nilai)) return fallback;
  const out: Record<string, unknown> = {};
  for (const d of definisi) {
    out[d.key] = d.key in nilai ? validasiNilai(d, nilai[d.key]) : d.default;
  }
  return out;
}

/**
 * Catatan: migrasi opsi versi lama ke schema versi baru.
 * Nilai lama yang masih valid dipertahankan, key lama dipetakan bila ada,
 * sisanya memakai default terdokumentasi. Nilai yang tak dapat dipetakan
 * dikumpulkan agar admin bisa ditampilkan sebagai peringatan.
 */
export function migrasiOpsiVersi(
  lama: Record<string, unknown> | null | undefined,
  definisiBaru: ThemeOptionDefinition[],
  petaKeyLama: Record<string, string> = {},
): { opsi: Record<string, unknown>; peringatan: string[] } {
  const peringatan: string[] = [];
  const dipetakan: Record<string, unknown> = {};
  const nilai = lama ?? {};
  for (const [key, value] of Object.entries(nilai)) {
    const target = petaKeyLama[key] ?? key;
    if (definisiBaru.some((d) => d.key === target)) dipetakan[target] = value;
    else peringatan.push(`Opsi '${key}' tidak ada pada schema baru dan dihapus.`);
  }
  return { opsi: validasiOpsiTenant(definisiBaru, dipetakan), peringatan };
}

/** Helper baca opsi bertipe angka (page-size); dijepit ke rentang valid. */
export function opsiAngka(opsi: Record<string, unknown>, key: string, fallback: number): number {
  const n = Number(opsi[key]);
  return Number.isFinite(n) && n > 0 ? Math.min(50, Math.max(1, Math.floor(n))) : fallback;
}

/** Warna dasar tervalidasi dari opsi `warna_dasar`, null bila tidak ada/tidak valid. */
export function warnaDasarDari(opsi: Record<string, unknown>): string | null {
  const v = String(opsi.warna_dasar ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : null;
}

/** Opsi ya/tidak bertipe select (`"1"`/`"0"`); default `true` bila kunci tak ada (Esensi). */
export function opsiYa(opsi: Record<string, unknown>, key: string, defaultYa = true): boolean {
  if (!(key in opsi)) return defaultYa;
  return String(opsi[key]) === "1";
}

/**
 * URL publik untuk opsi `foto_tidak_tersedia` (path media tenant).
 * Hanya path relatif tanpa `..` dan tanpa URL absolut yang diterima;
 * nilai lain (termasuk binari JSON) ditolak -> null.
 */
export function fotoFallbackUrl(opsi: Record<string, unknown>, villageId: number): string | null {
  const raw = opsi.foto_tidak_tersedia;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const path = raw.trim().replace(/^\/+/, "");
  if (path.includes("..") || path.includes("://") || path.includes("\\")) return null;
  const parts = path.split("/").filter(Boolean);
  const safe = parts[0] === String(villageId) ? parts : [String(villageId), ...parts];
  return "/api/publik/media/" + safe.map(encodeURIComponent).join("/");
}

/** Apakah (slug, version) terdaftar pada registry. */
export function terdaftar(
  registry: Record<string, ThemeDefinition>,
  slug: string,
  version: string,
): boolean {
  return Boolean(registry[`${slug}@${version}`]);
}
