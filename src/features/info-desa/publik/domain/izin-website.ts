import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";

/**
 * Modul RBAC pemilik setiap bagian admin Website.
 *
 * Halaman Website → Konten dan Website → Halaman dulu memakai slug
 * `website-konten`, `website-halaman`, dan `website-dashboard`. Ketiganya
 * **bukan** modul pada template tenant, sehingga `requirePermission` menolaknya
 * untuk semua role desa dan halaman itu hanya bisa dipakai superadmin.
 *
 * Setiap bagian kini memakai modul menu yang benar-benar ada beserta grant-nya:
 * - berita & kategori → `berita`
 * - album & foto galeri → `galeri`
 * - agenda kegiatan → `agenda-kegiatan` (menu Sekretariat)
 * - halaman statis → `dokumen` (Dokumen & Informasi Publik)
 * - slider, menu navigasi, dan widget → `website-pengaturan` (tampilan/struktur situs)
 *
 * Jangan menambah slug baru di sini tanpa menambah modul (dan grant) yang sama
 * pada `TENANT_TEMPLATE`; test `website-izin.test.ts` memeriksa kesetaraan itu.
 */
export const IZIN_WEBSITE = {
  identitas: RESOURCES.pengaturanDesa,
  pengaturan: RESOURCES.websitePengaturan,
  berita: RESOURCES.berita,
  galeri: RESOURCES.galeri,
  agenda: RESOURCES.agendaKegiatan,
  halaman: RESOURCES.dokumenPublik,
  slider: RESOURCES.websitePengaturan,
  menu: RESOURCES.websitePengaturan,
  widget: RESOURCES.websitePengaturan,
} as const;

/** Bagian Website → Halaman: halaman statis dan navigasi/tampilan situs. */
export const MODUL_WEBSITE_HALAMAN = [IZIN_WEBSITE.halaman, IZIN_WEBSITE.pengaturan] as const;

/** Bagian Website → Konten: berita, galeri, agenda, dan slider beranda. */
export const MODUL_WEBSITE_KONTEN = [
  IZIN_WEBSITE.berita,
  IZIN_WEBSITE.galeri,
  IZIN_WEBSITE.agenda,
  IZIN_WEBSITE.pengaturan,
] as const;

/** Bagian Website → Pengaturan: tampilan situs dan identitas desa. */
export const MODUL_WEBSITE_PENGATURAN = [IZIN_WEBSITE.pengaturan, IZIN_WEBSITE.identitas] as const;

/** Seluruh modul yang berhak membuka data admin Website (untuk cek baca). */
export const MODUL_WEBSITE = [
  IZIN_WEBSITE.identitas,
  IZIN_WEBSITE.berita,
  IZIN_WEBSITE.galeri,
  IZIN_WEBSITE.agenda,
  IZIN_WEBSITE.halaman,
  IZIN_WEBSITE.pengaturan,
] as const;
