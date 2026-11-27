import configEsensi from "./esensi/1.0.0/config.json";
import LayoutEsensi from "./esensi/1.0.0/layout";
import manifestEsensi from "./esensi/1.0.0/manifest.json";
import { halamanEsensi } from "./esensi/1.0.0/pages";
import { widgetEsensi } from "./esensi/1.0.0/widgets";
import configNatra from "./natra/1.0.0/config.json";
import LayoutNatra from "./natra/1.0.0/layout";
import manifestNatra from "./natra/1.0.0/manifest.json";
import { halamanNatra } from "./natra/1.0.0/pages";
import { widgetNatra } from "./natra/1.0.0/widgets";
import {
  parseConfigOpsi,
  SURFACE_WAJIB,
  type SurfaceKey,
  type ThemeDefinition,
  type ThemeManifest,
  type ThemeWidgets,
} from "./types";

/**
 * Registry statis tema situs publik.
 *
 * Satu-satunya jalan memilih kode tema dari `slug@version` di database.
 * Tidak ada `import()` dari string database; slug/versi asing ditolak.
 */

function definisi(
  manifest: ThemeManifest,
  config: unknown,
  layout: ThemeDefinition["layout"],
  pages: ThemeDefinition["pages"],
  widgets: ThemeWidgets,
): ThemeDefinition {
  const opsi = parseConfigOpsi(config);
  return {
    manifest,
    opsi,
    layout,
    pages,
    widgets,
    defaultOpsi: () => Object.fromEntries(opsi.map((o) => [o.key, o.default])),
  };
}

const ESENSI: ThemeDefinition = definisi(
  manifestEsensi as ThemeManifest,
  configEsensi,
  LayoutEsensi,
  halamanEsensi,
  widgetEsensi,
);
const NATRA: ThemeDefinition = definisi(
  manifestNatra as ThemeManifest,
  configNatra,
  LayoutNatra,
  halamanNatra,
  widgetNatra,
);

/** Pasangan `slug@version` → definisi paket. */
export const TEMA_REGISTRY: Record<string, ThemeDefinition> = {
  "esensi@1.0.0": ESENSI,
  "natra@1.0.0": NATRA,
};

/**
 * Alias slug lama agar tidak jatuh ke fallback diam-diam:
 * `samudra-modern` (dibuat via `scripts/platform/tambah-template-samudra.mjs`)
 * dipetakan ke `natra@1.0.0`; opsi token lama tetap dibaca `muatTemaPublik`,
 * dan schema opsi natra memberi default yang setara.
 */
export const ALIAS_SLUG_TEMA: Record<string, string> = {
  "samudra-modern@1.0.0": "natra@1.0.0",
};

export function resolveTema(
  slug: string | null | undefined,
  version: string | null | undefined,
): ThemeDefinition | null {
  if (!slug || !version) return null;
  const key = `${slug}@${version}`;
  return TEMA_REGISTRY[key] ?? TEMA_REGISTRY[ALIAS_SLUG_TEMA[key] ?? ""] ?? null;
}

/** Slug/versi yang benar-benar ada dalam build registry. */
export function slugTerdaftar(): Set<string> {
  return new Set(Object.keys(TEMA_REGISTRY).map((key) => key.split("@")[0]!));
}

export function versiTerdaftar(slug: string): string[] {
  return Object.keys(TEMA_REGISTRY)
    .map((key) => {
      const [s, v] = key.split("@");
      return s === slug ? v! : null;
    })
    .filter((v): v is string => Boolean(v));
}

/** Daftar kunci registry untuk validasi/build/CI. */
export function daftarKunciRegistry(): string[] {
  return Object.keys(TEMA_REGISTRY);
}

/**
 * Paket yang bisa diterbitkan Super Admin (hanya paket berkode, bukan alias).
 * Dipakai form katalog agar slug/versi berasal dari registry, bukan isian bebas.
 */
export function daftarPaketTersedia(): { slug: string; version: string }[] {
  return Object.entries(TEMA_REGISTRY).map(([key, paket]) => ({
    slug: paket.manifest.slug || key.split("@")[0]!,
    version: paket.manifest.version || key.split("@")[1]!,
  }));
}

/** Kesalahan validasi awal registry, kosong berarti aman dipakai. */
export function validasiRegistry(): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const [key, d] of Object.entries(TEMA_REGISTRY)) {
    if (seen.has(key)) errors.push(`Duplikat registry: ${key}`);
    seen.add(key);
    if (!d.manifest.slug || !d.manifest.version) errors.push(`Manifest tidak lengkap pada ${key}`);
    const surfaces: SurfaceKey[] = d.manifest.surfaces ?? [];
    for (const surface of SURFACE_WAJIB) {
      if (!surfaces.includes(surface)) errors.push(`${key} kehilangan surface wajib ${surface}`);
    }
    if (d.opsi.length === 0) errors.push(`${key} config.json tidak ada opsi terbaca`);
    if (typeof d.layout !== "function") errors.push(`${key} layout tidak ada`);
    for (const surface of SURFACE_WAJIB) {
      if (typeof d.pages?.[surface] !== "function")
        errors.push(`${key} pages.${surface} tidak ada renderer`);
    }
    for (const widget of ["jam", "statistik", "fotoFallback"] as const) {
      if (typeof d.widgets?.[widget] !== "function")
        errors.push(`${key} widgets.${widget} tidak ada renderer`);
    }
  }
  return errors;
}

export default TEMA_REGISTRY;
