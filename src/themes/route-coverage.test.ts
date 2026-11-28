import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SURFACE_WAJIB } from "./types";

/**
 * 35 route situs publik. Setiap route wajib memakai adapter tema yang
 * disetujui:
 * TemaRenderer, PublicShell, GalleryShell, atau header/footer bersama
 * PublicSiteHeader/PublicSiteFooter (komponen bersama terdaftar), atau
 * mengimpor komponen halaman utama (alias).
 */
const ROUTE_PUBLIK = [
  "src/app/page.tsx",
  "src/app/profil/page.tsx",
  "src/app/sejarah/page.tsx",
  "src/app/visi-misi/page.tsx",
  "src/app/wilayah/page.tsx",
  "src/app/pemerintahan/page.tsx",
  "src/app/perangkat/[id]/page.tsx",
  "src/app/desa/status-des/page.tsx",
  "src/app/profil/sejarah/page.tsx",
  "src/app/profil/visi-misi/page.tsx",
  "src/app/informasi/page.tsx",
  "src/app/halaman/[slug]/page.tsx",
  "src/app/berita/page.tsx",
  "src/app/berita/[slug]/page.tsx",
  "src/app/pengumuman/page.tsx",
  "src/app/pengumuman/[slug]/page.tsx",
  "src/app/agenda/page.tsx",
  "src/app/agenda/[id]/page.tsx",
  "src/app/dokumen/page.tsx",
  "src/app/statistik/page.tsx",
  "src/app/data/statistik/page.tsx",
  "src/app/pembangunan/page.tsx",
  "src/app/pembangunan/[slug]/page.tsx",
  "src/app/potensi/page.tsx",
  "src/app/transparansi/apbdes/page.tsx",
  "src/app/transparansi/laporan-keuangan/page.tsx",
  "src/app/galeri/page.tsx",
  "src/app/galeri/[slug]/page.tsx",
  "src/app/layanan/page.tsx",
  "src/app/layanan/surat/page.tsx",
  "src/app/pengaduan/page.tsx",
  "src/app/pengaduan/baru/page.tsx",
  "src/app/pengaduan/berhasil/page.tsx",
  "src/app/pengaduan/lacak/page.tsx",
  "src/app/kontak/page.tsx",
];

const ADAPTER = [
  "TemaRenderer",
  "PublicShell",
  "GalleryShell",
  "PublicSiteHeader",
  "PublicSiteFooter",
];

/** Baca source route; bila route hanya alias ke halaman lain, ikuti import-nya. */
function sumberEfektif(rel: string, kedalaman = 0): string {
  const abs = join(process.cwd(), rel);
  const source = readFileSync(abs, "utf8");
  if (ADAPTER.some((a) => source.includes(a)) || kedalaman > 3) return source;
  const alias = /from "(\.[^"]*\/page)"/.exec(source);
  if (!alias) return source;
  const berikut = join(rel, "..", alias[1]!).replace(/\\/g, "/") + ".tsx";
  return existsSync(join(process.cwd(), berikut)) ? sumberEfektif(berikut, kedalaman + 1) : source;
}

describe("route coverage tema", () => {
  it("semua 35 route publik memakai adapter tema yang disetujui", () => {
    expect(ROUTE_PUBLIK).toHaveLength(35);
    for (const rel of ROUTE_PUBLIK) {
      expect(existsSync(join(process.cwd(), rel)), `${rel} tidak ada`).toBe(true);
      const source = sumberEfektif(rel);
      expect(
        ADAPTER.some((a) => source.includes(a)),
        `${rel} tidak memakai adapter tema`,
      ).toBe(true);
    }
  });

  it("setiap surface wajib terpetakan ke keluarga route", () => {
    expect(SURFACE_WAJIB).toEqual(["beranda", "profil", "konten", "data", "media", "layanan"]);
  });
});
