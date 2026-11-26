import "server-only";

import { getIdentitasDesa } from "@/features/info-desa/desa/application/kontrak";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  IZIN_WEBSITE,
  MODUL_WEBSITE,
  MODUL_WEBSITE_HALAMAN,
  MODUL_WEBSITE_KONTEN,
  MODUL_WEBSITE_PENGATURAN,
} from "@/features/info-desa/publik/domain/izin-website";
import { listAgendaAdmin } from "@/features/info-desa/publik/infrastructure/agenda-admin-repository";
import {
  listBeritaAdmin,
  listBeritaKontenAdmin,
  listKategoriBeritaAdmin,
} from "@/features/info-desa/publik/infrastructure/berita-admin-repository";
import { listDokumenAdmin } from "@/features/info-desa/publik/infrastructure/dokumen-admin-repository";
import {
  getHalamanBySlug,
  type HalamanRingkas,
} from "@/features/info-desa/publik/infrastructure/dokumen-repository";
import {
  hitungFotoPerAlbum,
  listAlbumAdmin,
  listFotoAdmin,
  listSliderAdmin,
} from "@/features/info-desa/publik/infrastructure/galeri-admin-repository";
import {
  listHalamanStatisAdmin,
  listHalamanStatisLengkap,
} from "@/features/info-desa/publik/infrastructure/halaman-admin-repository";
import {
  ambilTemaAktif,
  ambilTemaAktifDenganOpsi,
  barisKunjunganSejak,
  totalKunjungan,
  totalKunjunganSejak,
} from "@/features/info-desa/publik/infrastructure/situs-admin-repository";
import {
  listMenuPublik,
  listWidget,
  type MenuPublikRingkas,
} from "@/features/info-desa/publik/infrastructure/tampilan-repository";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { requireAnyPermission, type CurrentUser } from "@/lib/dal";

/** Izin pengguna atas satu modul, dipakai halaman untuk menyembunyikan form/aksi. */
export interface IzinBagian {
  baca: boolean;
  tambah: boolean;
  ubah: boolean;
  hapus: boolean;
}

function izinBagian(user: CurrentUser, resource: string): IzinBagian {
  return {
    baca: hasPermission(user.permissions, resource, "read"),
    tambah: hasPermission(user.permissions, resource, "create"),
    ubah: hasPermission(user.permissions, resource, "update"),
    hapus: hasPermission(user.permissions, resource, "delete"),
  };
}

/**
 * Desa aktif untuk halaman admin Website.
 *
 * Halaman Website menggabungkan beberapa menu pemilik (berita, galeri, agenda,
 * dokumen, pengaturan website), jadi pintu masuknya memakai izin "salah satu"
 * modul tersebut. Aksi tulis tetap diperiksa per resource spesifiknya.
 */
async function tenantWebsite(modul: readonly string[]) {
  const user = await requireAnyPermission(modul, "read");
  return { user, villageId: await resolveVillageId(user) };
}

export async function getWebsiteDashboardData() {
  const { villageId } = await tenantWebsite(MODUL_WEBSITE);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sixMonthsKey = `${sixMonthsStart.getFullYear()}-${String(sixMonthsStart.getMonth() + 1).padStart(2, "0")}-01`;
  const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}-01`;
  const [
    identitas,
    pages,
    articles,
    agenda,
    albums,
    photoCounts,
    documents,
    menus,
    visits,
    visitsThisMonth,
    visitRows,
    activeTheme,
  ] = await Promise.all([
    getIdentitasDesa(villageId),
    listHalamanStatisAdmin(villageId),
    listBeritaAdmin(villageId),
    listAgendaAdmin(villageId),
    listAlbumAdmin(villageId),
    hitungFotoPerAlbum(villageId),
    listDokumenAdmin(villageId),
    listMenuPublik(villageId, true),
    totalKunjungan(villageId),
    totalKunjunganSejak(villageId, monthKey),
    barisKunjunganSejak(villageId, sixMonthsKey),
    ambilTemaAktif(villageId),
  ]);
  const trend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(sixMonthsStart.getFullYear(), sixMonthsStart.getMonth() + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date),
      total: visitRows
        .filter((row) => row.tanggal.slice(0, 7) === key)
        .reduce((total, row) => total + row.jumlah, 0),
    };
  });
  const albumWithCount = albums.map((album) => ({
    ...album,
    jumlahFoto: photoCounts.find((row) => row.albumId === album.id)?.jumlah ?? 0,
  }));
  return {
    identitas,
    pages,
    berita: articles,
    agenda,
    album: albumWithCount,
    dokumen: documents,
    menu: menus,
    totalKunjungan: visits,
    kunjunganBulan: visitsThisMonth,
    trenKunjungan: trend,
    temaAktif: activeTheme ?? null,
  };
}

export async function getWebsiteSettingsData() {
  const { villageId } = await tenantWebsite(MODUL_WEBSITE_PENGATURAN);
  const [identitas, selectedTheme] = await Promise.all([
    getIdentitasDesa(villageId),
    ambilTemaAktifDenganOpsi(villageId),
  ]);
  return { identitas, tema: selectedTheme ?? null };
}

export async function getWebsitePagesData() {
  const { user, villageId } = await tenantWebsite(MODUL_WEBSITE_HALAMAN);
  const [menu, widget, pages] = await Promise.all([
    listMenuPublik(villageId, true),
    listWidget(villageId, true),
    listHalamanStatisLengkap(villageId),
  ]);
  return {
    menu,
    widget,
    pages,
    izin: {
      halaman: izinBagian(user, IZIN_WEBSITE.halaman),
      menu: izinBagian(user, IZIN_WEBSITE.menu),
      widget: izinBagian(user, IZIN_WEBSITE.widget),
    },
  };
}

export async function getWebsiteContentData() {
  const { user, villageId } = await tenantWebsite(MODUL_WEBSITE_KONTEN);
  const [articles, albums, photoCounts, photos, slides, agenda, categories] = await Promise.all([
    listBeritaKontenAdmin(villageId),
    listAlbumAdmin(villageId),
    hitungFotoPerAlbum(villageId),
    listFotoAdmin(villageId),
    listSliderAdmin(villageId),
    listAgendaAdmin(villageId),
    listKategoriBeritaAdmin(villageId),
  ]);
  const albumWithCount = albums.map((album) => ({
    ...album,
    jumlahFoto: photoCounts.find((row) => row.albumId === album.id)?.jumlah ?? 0,
  }));
  return {
    berita: articles,
    album: albumWithCount,
    photos,
    slider: slides,
    agenda,
    categories,
    izin: {
      berita: izinBagian(user, IZIN_WEBSITE.berita),
      galeri: izinBagian(user, IZIN_WEBSITE.galeri),
      agenda: izinBagian(user, IZIN_WEBSITE.agenda),
      slider: izinBagian(user, IZIN_WEBSITE.slider),
    },
  };
}

/* ------------------------------------------------------------ situs publik */

/**
 * Halaman statis tenant untuk route publik.
 *
 * Route tidak boleh menyentuh repository langsung; use case ini yang memilih
 * tenant dari host dan hanya mengembalikan halaman aktif milik desa tersebut.
 */
export async function muatHalamanPublik(
  villageId: number,
  slug: string,
): Promise<HalamanRingkas | null> {
  return getHalamanBySlug(villageId, slug);
}

/** Menu publik aktif tenant; dipakai header situs. */
export async function muatMenuPublik(villageId: number): Promise<MenuPublikRingkas[]> {
  return listMenuPublik(villageId);
}

/** Token tema aktif tenant untuk rendering situs publik; hanya nilai HEX/enum tervalidasi yang diteruskan ke CSS. */
export async function muatTemaPublik(villageId: number) {
  const active = await ambilTemaAktifDenganOpsi(villageId);
  if (!active?.opsi) return null;
  try {
    const parsed: unknown = JSON.parse(active.opsi);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const root = parsed as Record<string, unknown>;
    const raw = root.templateTokens;
    const token =
      raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const brandingRaw = root.branding;
    const branding =
      brandingRaw && typeof brandingRaw === "object" && !Array.isArray(brandingRaw)
        ? (brandingRaw as Record<string, unknown>)
        : {};
    const color = (key: string, fallback: string, brandingKey?: string) => {
      const value =
        brandingKey && typeof branding[brandingKey] === "string"
          ? branding[brandingKey]
          : token[key];
      return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
    };
    return {
      primary: color("primary", "#075cf0", "warnaUtama"),
      secondary: color("secondary", "#0d2136"),
      accent: color("accent", "#7a20f0", "warnaAksen"),
      background: color("background", "#f1f6ff"),
      surface: color("surface", "#ffffff"),
      text: color("text", "#101b4b"),
      fontHeading:
        branding.font === "serif"
          ? "serif"
          : branding.font === "sans" || branding.font === "system"
            ? "sans"
            : token.fontHeading === "serif"
              ? "serif"
              : "sans",
      logoTampil: typeof branding.logoTampil === "boolean" ? branding.logoTampil : true,
      radius: token.radius === "kecil" ? "10px" : token.radius === "besar" ? "22px" : "15px",
      style: token.style === "gelap" ? "gelap" : "terang",
      templateName: active.nama,
    };
  } catch {
    return null;
  }
}
