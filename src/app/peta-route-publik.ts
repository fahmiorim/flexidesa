import type { SurfaceKey } from "@/themes/types";

/**
 * Peta route situs publik → mekanisme penerapan tema.
 *
 * Setiap route publik harus memakai salah satu jalur berikut:
 *
 * - `renderer`: halaman memanggil `TemaRenderer` langsung (beranda).
 * - `shell`: halaman memakai `PublicShell`/`GalleryShell`, yang di dalamnya
 *   memanggil `TemaRenderer` dengan surface yang sama.
 * - `header`: halaman memakai `PublicSiteHeader`/`PublicSiteFooter` (adapter
 *   bersama) yang membaca token tema dan opsi paket aktif tenant.
 * - `alias`: route meneruskan komponen halaman lain; tema mengikuti halaman
 *   sumber yang tercatat pada `sumber`.
 *
 * `src/app/peta-route-publik.test.ts` membaca setiap berkas dan membuktikan
 * mekanismenya benar-benar diimpor, sehingga route baru yang lupa memakai tema
 * akan gagal di test.
 */
export type MekanismeTema = "renderer" | "shell" | "header" | "alias";

export interface RouteTemaPublik {
  route: string;
  berkas: string;
  mekanisme: MekanismeTema;
  surface: SurfaceKey;
  /** Halaman sumber untuk route alias. */
  sumber?: string;
}

/** 35 route situs publik di luar portal layanan mandiri warga. */
export const PETA_ROUTE_PUBLIK: readonly RouteTemaPublik[] = [
  { route: "/", berkas: "src/app/page.tsx", mekanisme: "renderer", surface: "beranda" },

  { route: "/profil", berkas: "src/app/profil/page.tsx", mekanisme: "header", surface: "profil" },
  { route: "/sejarah", berkas: "src/app/sejarah/page.tsx", mekanisme: "header", surface: "profil" },
  {
    route: "/visi-misi",
    berkas: "src/app/visi-misi/page.tsx",
    mekanisme: "header",
    surface: "profil",
  },
  { route: "/wilayah", berkas: "src/app/wilayah/page.tsx", mekanisme: "header", surface: "profil" },
  {
    route: "/pemerintahan",
    berkas: "src/app/pemerintahan/page.tsx",
    mekanisme: "header",
    surface: "profil",
  },
  {
    route: "/perangkat/[id]",
    berkas: "src/app/perangkat/[id]/page.tsx",
    mekanisme: "header",
    surface: "profil",
  },
  {
    route: "/desa/status-des",
    berkas: "src/app/desa/status-des/page.tsx",
    mekanisme: "header",
    surface: "profil",
  },
  {
    route: "/profil/sejarah",
    berkas: "src/app/profil/sejarah/page.tsx",
    mekanisme: "alias",
    surface: "profil",
    sumber: "src/app/sejarah/page.tsx",
  },
  {
    route: "/profil/visi-misi",
    berkas: "src/app/profil/visi-misi/page.tsx",
    mekanisme: "alias",
    surface: "profil",
    sumber: "src/app/visi-misi/page.tsx",
  },

  {
    route: "/informasi",
    berkas: "src/app/informasi/page.tsx",
    mekanisme: "header",
    surface: "konten",
  },
  {
    route: "/halaman/[slug]",
    berkas: "src/app/halaman/[slug]/page.tsx",
    mekanisme: "header",
    surface: "konten",
  },
  { route: "/berita", berkas: "src/app/berita/page.tsx", mekanisme: "header", surface: "konten" },
  {
    route: "/berita/[slug]",
    berkas: "src/app/berita/[slug]/page.tsx",
    mekanisme: "header",
    surface: "konten",
  },
  {
    route: "/pengumuman",
    berkas: "src/app/pengumuman/page.tsx",
    mekanisme: "header",
    surface: "konten",
  },
  {
    route: "/pengumuman/[slug]",
    berkas: "src/app/pengumuman/[slug]/page.tsx",
    mekanisme: "header",
    surface: "konten",
  },
  { route: "/agenda", berkas: "src/app/agenda/page.tsx", mekanisme: "header", surface: "konten" },
  {
    route: "/agenda/[id]",
    berkas: "src/app/agenda/[id]/page.tsx",
    mekanisme: "header",
    surface: "konten",
  },
  { route: "/dokumen", berkas: "src/app/dokumen/page.tsx", mekanisme: "shell", surface: "konten" },

  {
    route: "/statistik",
    berkas: "src/app/statistik/page.tsx",
    mekanisme: "header",
    surface: "data",
  },
  {
    route: "/data/statistik",
    berkas: "src/app/data/statistik/page.tsx",
    mekanisme: "alias",
    surface: "data",
    sumber: "src/app/statistik/page.tsx",
  },
  {
    route: "/pembangunan",
    berkas: "src/app/pembangunan/page.tsx",
    mekanisme: "header",
    surface: "data",
  },
  {
    route: "/pembangunan/[slug]",
    berkas: "src/app/pembangunan/[slug]/page.tsx",
    mekanisme: "header",
    surface: "data",
  },
  { route: "/potensi", berkas: "src/app/potensi/page.tsx", mekanisme: "header", surface: "data" },
  {
    route: "/transparansi/apbdes",
    berkas: "src/app/transparansi/apbdes/page.tsx",
    mekanisme: "header",
    surface: "data",
  },
  {
    route: "/transparansi/laporan-keuangan",
    berkas: "src/app/transparansi/laporan-keuangan/page.tsx",
    mekanisme: "header",
    surface: "data",
  },

  { route: "/galeri", berkas: "src/app/galeri/page.tsx", mekanisme: "header", surface: "media" },
  {
    route: "/galeri/[slug]",
    berkas: "src/app/galeri/[slug]/page.tsx",
    mekanisme: "shell",
    surface: "media",
  },

  {
    route: "/layanan",
    berkas: "src/app/layanan/page.tsx",
    mekanisme: "header",
    surface: "layanan",
  },
  {
    route: "/layanan/surat",
    berkas: "src/app/layanan/surat/page.tsx",
    mekanisme: "header",
    surface: "layanan",
  },
  {
    route: "/pengaduan",
    berkas: "src/app/pengaduan/page.tsx",
    mekanisme: "shell",
    surface: "layanan",
  },
  {
    route: "/pengaduan/baru",
    berkas: "src/app/pengaduan/baru/page.tsx",
    mekanisme: "shell",
    surface: "layanan",
  },
  {
    route: "/pengaduan/berhasil",
    berkas: "src/app/pengaduan/berhasil/page.tsx",
    mekanisme: "shell",
    surface: "layanan",
  },
  {
    route: "/pengaduan/lacak",
    berkas: "src/app/pengaduan/lacak/page.tsx",
    mekanisme: "shell",
    surface: "layanan",
  },
  { route: "/kontak", berkas: "src/app/kontak/page.tsx", mekanisme: "header", surface: "layanan" },
];

/** Simbol yang harus diimpor setiap mekanisme (dipakai test peta route). */
export const SIMBOL_MEKANISME: Record<Exclude<MekanismeTema, "alias">, string> = {
  renderer: "TemaRenderer",
  shell: "PublicShell",
  header: "PublicSiteHeader",
};

export const SIMBOL_SHELL_GALERI = "GalleryShell";
