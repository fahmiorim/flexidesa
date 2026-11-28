import configArunika from "./arunika/1.0.0/config.json";
import LayoutArunika from "./arunika/1.0.0/layout";
import manifestArunika from "./arunika/1.0.0/manifest.json";
import { halamanArunika } from "./arunika/1.0.0/pages";
import { widgetArunika } from "./arunika/1.0.0/widgets";
import { BerandaCakrawala } from "./cakrawala/1.0.0/beranda";
import configCakrawala from "./cakrawala/1.0.0/config.json";
import { FooterCakrawala } from "./cakrawala/1.0.0/footer";
import { HeroCakrawala } from "./cakrawala/1.0.0/hero";
import LayoutCakrawala from "./cakrawala/1.0.0/layout";
import manifestCakrawala from "./cakrawala/1.0.0/manifest.json";
import { halamanCakrawala } from "./cakrawala/1.0.0/pages";
import { ProfilCakrawala } from "./cakrawala/1.0.0/profil-cakrawala";
import { widgetCakrawala } from "./cakrawala/1.0.0/widgets";
import { BerandaSamudra } from "./samudra/1.0.0/beranda";
import configSamudra from "./samudra/1.0.0/config.json";
import { FooterSamudra } from "./samudra/1.0.0/footer";
import { HeroSamudra } from "./samudra/1.0.0/hero";
import LayoutSamudra from "./samudra/1.0.0/layout";
import manifestSamudra from "./samudra/1.0.0/manifest.json";
import { halamanSamudra } from "./samudra/1.0.0/pages";
import { ProfilSamudra } from "./samudra/1.0.0/profil-samudra";
import { widgetSamudra } from "./samudra/1.0.0/widgets";
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
  hero?: ThemeDefinition["hero"],
  beranda?: ThemeDefinition["beranda"],
  footer?: ThemeDefinition["footer"],
  profil?: ThemeDefinition["profil"],
): ThemeDefinition {
  const opsi = parseConfigOpsi(config);
  return {
    manifest,
    opsi,
    layout,
    pages,
    widgets,
    hero,
    beranda,
    footer,
    profil,
    defaultOpsi: () => Object.fromEntries(opsi.map((o) => [o.key, o.default])),
  };
}

const ARUNIKA: ThemeDefinition = definisi(
  manifestArunika as ThemeManifest,
  configArunika,
  LayoutArunika,
  halamanArunika,
  widgetArunika,
);
const CAKRAWALA: ThemeDefinition = definisi(
  manifestCakrawala as ThemeManifest,
  configCakrawala,
  LayoutCakrawala,
  halamanCakrawala,
  widgetCakrawala,
  HeroCakrawala,
  BerandaCakrawala,
  FooterCakrawala,
  ProfilCakrawala,
);
const SAMUDRA: ThemeDefinition = definisi(
  manifestSamudra as ThemeManifest,
  configSamudra,
  LayoutSamudra,
  halamanSamudra,
  widgetSamudra,
  HeroSamudra,
  BerandaSamudra,
  FooterSamudra,
  ProfilSamudra,
);

/** Pasangan `slug@version` → definisi paket. */
export const TEMA_REGISTRY: Record<string, ThemeDefinition> = {
  "arunika@1.0.0": ARUNIKA,
  "cakrawala@1.0.0": CAKRAWALA,
  "samudra@1.0.0": SAMUDRA,
};

/**
 * Alias slug lama → paket berkode. Kosong saat ini: `samudra` sudah
 * menjadi paket sendiri, sehingga tidak ada slug katalog yang jatuh ke tema
 * lain. Mekanisme tetap ada untuk slug legacy yang kelak perlu dipetakan.
 */
export const ALIAS_SLUG_TEMA: Record<string, string> = {};

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
