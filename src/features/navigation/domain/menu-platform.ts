/**
 * Menu konsol Super Admin.
 *
 * Menu desa dibangun dari tabel `modules` yang dibatasi tenant, sedangkan akun
 * platform memakai `villageId === null` dan tidak memiliki baris modul. Karena
 * itu menu platform ditulis eksplisit di sini: setiap tautan dijamin menunjuk
 * halaman yang benar-benar ada, dan urutannya mengikuti alur kerja operator
 * (ringkasan → tenant → domain → akses → audit → template → pengaturan).
 *
 * `grup` dipakai sidebar untuk mengelompokkan item (jarak antar kelompok);
 * label grup tidak dicetak. Nilainya harus berurutan agar item satu kelompok
 * tidak terpisah.
 *
 * Fungsi di file ini murni (tanpa I/O) agar dapat diuji tanpa database.
 */

interface SubmenuPlatformItem {
  readonly href: string;
  readonly label: string;
}

interface MenuPlatformItem {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
  /** Label grup pada sidebar; item dengan grup sama tampil berurutan. */
  readonly grup: string;
  /** Submenu hanya ditampilkan saat menu induk aktif. */
  readonly submenu?: readonly SubmenuPlatformItem[];
  /**
   * Rute lain yang tetap menandai menu ini aktif, mis. halaman yang dipindah
   * ke prefiks berbeda dari tautan menunya (`/super-admin/tenant/tambah`).
   */
  readonly ruteTambahan?: readonly string[];
}

export const MENU_PLATFORM: readonly MenuPlatformItem[] = [
  { href: "/super-admin", label: "Ringkasan", icon: "▦", grup: "Ringkasan" },
  {
    href: "/super-admin/tenant",
    label: "Tenant",
    icon: "⌂",
    grup: "Desa & Tenant",
  },
  {
    href: "/super-admin/paket",
    label: "Paket Langganan",
    icon: "▤",
    grup: "Desa & Tenant",
    submenu: [
      { href: "/super-admin/paket", label: "Katalog paket" },
      { href: "/super-admin/paket/tenant", label: "Paket tenant" },
    ],
  },
  {
    href: "/super-admin/domain",
    label: "Domain",
    icon: "⇄",
    grup: "Desa & Tenant",
  },
  {
    href: "/super-admin/template",
    label: "Template Website",
    icon: "◫",
    grup: "Desa & Tenant",
    submenu: [
      { href: "/super-admin/template", label: "Katalog template" },
      { href: "/super-admin/template/penggunaan", label: "Penggunaan & pembaruan" },
      { href: "/super-admin/template/fondasi", label: "Fondasi tenant baru" },
    ],
  },
  {
    href: "/super-admin/pengguna",
    label: "Akun Platform",
    icon: "☺",
    grup: "Akses & Audit",
  },
  {
    href: "/super-admin/pengguna-desa",
    label: "Pengguna Desa",
    icon: "☷",
    grup: "Akses & Audit",
  },
  { href: "/super-admin/audit", label: "Audit Trail", icon: "≡", grup: "Akses & Audit" },
  {
    href: "/super-admin/kesehatan",
    label: "Kesehatan Sistem",
    icon: "✚",
    grup: "Operasional",
  },
  {
    href: "/super-admin/backup",
    label: "Backup & Restore",
    icon: "⤓",
    grup: "Operasional",
  },
  { href: "/super-admin/pengaturan", label: "Pengaturan", icon: "⚙", grup: "Operasional" },
] as const;

/**
 * Apakah tautan menu sedang aktif untuk pathname saat ini.
 *
 * Ringkasan hanya aktif tepat di `/super-admin`; halaman lain aktif juga pada
 * sub-rutenya (mis. `/super-admin/tenant/12`) agar breadcrumb tidak hilang.
 * `ruteTambahan` pada item menu ikut dihitung, sehingga halaman yang berada di
 * prefiks lain tetap menandai menunya.
 */
export function menuPlatformAktif(href: string, pathname: string): boolean {
  if (href === "/super-admin") return pathname === "/super-admin";
  const rute = [href, ...(MENU_PLATFORM.find((item) => item.href === href)?.ruteTambahan ?? [])];
  return rute.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/**
 * Href submenu yang paling spesifik untuk pathname aktif.
 *
 * Detail domain (`/super-admin/domain/12`) tetap menandai menu induknya.
 * Submenu terpanjang yang cocok menang atas yang lebih pendek, sehingga
 * submenu tidak perlu aturan rute satu per satu.
 */
export function submenuPlatformAktif(
  submenu: readonly SubmenuPlatformItem[],
  pathname: string,
): string | null {
  const cocok = submenu
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length);

  return cocok[0]?.href ?? null;
}

/** Daftar grup unik sesuai urutan kemunculan, untuk label sidebar. */
export function grupMenuPlatform(): { readonly grup: string; readonly item: MenuPlatformItem[] }[] {
  return MENU_PLATFORM.reduce<{ grup: string; item: MenuPlatformItem[] }[]>((hasil, item) => {
    const terakhir = hasil[hasil.length - 1];
    if (terakhir?.grup === item.grup) {
      terakhir.item.push(item);
    } else {
      hasil.push({ grup: item.grup, item: [item] });
    }
    return hasil;
  }, []);
}
