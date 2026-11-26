/**
 * Penyajian menu admin.
 *
 * RBAC menyimpan seluruh modul yang boleh dibaca sebuah role, tetapi belum
 * semuanya memiliki halaman. Menu tidak boleh menautkan rute yang belum ada
 * (menghasilkan 404), sehingga ketersediaan rute ditandai terpisah dan modul
 * yang belum siap ditampilkan sebagai label non-aktif.
 *
 * Fungsi di sini murni (tanpa I/O) agar dapat diuji tanpa database.
 */

/**
 * Rute admin yang benar-benar memiliki halaman.
 *
 * Tambahkan path di sini ketika halaman barunya dibuat. Ini sengaja berupa
 * daftar eksplisit: menebak dari `modules.url` akan menghasilkan tautan mati.
 */
export const RUTE_ADMIN_TERSEDIA: readonly string[] = [
  "/beranda",
  "/pelayanan-publik",
  "/pelayanan-publik/layanan",
  "/pelayanan-publik/pengajuan",
  "/pelayanan-publik/survei",
  "/kependudukan/penduduk",
  "/kependudukan/penduduk/suplemen",
  "/kependudukan/penduduk/suplemen/baru",
  "/kependudukan/penduduk/suplemen/[id]",
  "/kependudukan/penduduk/suplemen/[id]/ubah",
  "/kependudukan/penduduk/suplemen/[id]/impor",
  "/kependudukan/penduduk/suplemen/[id]/cetak",
  "/kependudukan/penduduk/suplemen/[id]/terdata/baru",
  "/kependudukan/penduduk/suplemen/[id]/terdata/[terdataId]/ubah",
  "/kependudukan/penduduk/dpt",
  "/kehadiran",
  "/kehadiran/absensi",
  "/kehadiran/pengaduan",
  "/kehadiran/rekapitulasi",
  "/kehadiran/hari-libur",
  "/kehadiran/jam-kerja",
  "/kehadiran/pengajuan-izin",
  "/kehadiran/persetujuan-izin",
  "/kehadiran/alasan-keluar",
  "/kehadiran/pegawai",
  "/kehadiran/cuti-izin",
  "/kependudukan/keluarga",
  "/kependudukan/rumah-tangga",
  "/kependudukan/rumah-tangga/baru",
  "/kependudukan/rumah-tangga/impor",
  // Template impor adalah route handler unduhan (`route.ts`), bukan halaman,
  // jadi tidak terdaftar di sini.
  "/kependudukan/rumah-tangga/laporan",
  "/kependudukan/rumah-tangga/[id]",
  "/kependudukan/rumah-tangga/[id]/ubah",
  "/kependudukan/rumah-tangga/[id]/cetak",
  "/kependudukan/kelompok",
  "/kependudukan/kelompok/cetak",
  "/kependudukan/kelompok/[id]",
  "/kependudukan/kelompok/[id]/cetak",
  "/kependudukan/kelompok/[id]/anggota-baru",
  "/kependudukan/kelompok/[id]/anggota/[memberId]/ubah",
  "/kependudukan/mutasi-penduduk",
  "/kependudukan/mutasi-penduduk/cetak",
  "/kependudukan/laporan-bulanan",
  "/kependudukan/statistik",
  "/kependudukan/kelompok-rentan",
  "/kependudukan/laporan-penduduk",
  "/kependudukan/mutasi-penduduk/[id]/ubah",
  "/kependudukan/penduduk/[id]/mutasi",
  "/kependudukan/statistik",
  "/kependudukan/statistik/penduduk",
  "/statistik/rentang-umur",
  "/layanan-surat/persuratan/dashboard",
  "/layanan-surat/permohonan-surat",
  "/layanan-surat/persuratan/surat",
  "/layanan-surat/persuratan/verifikasi",
  "/layanan-surat/persuratan/jenis-surat",
  "/layanan-surat/persuratan/jenis-surat/pengaturan",
  "/layanan-surat/persuratan/syarat-surat",
  "/layanan-surat/persuratan/klasifikasi-surat",
  "/layanan-surat/persuratan/cetak-surat",
  "/layanan-surat/persuratan/arsip",
  "/layanan-surat/persuratan/master",
  "/layanan-surat/persuratan/surat-masuk",
  "/layanan-surat/persuratan/surat-keluar",
  "/layanan-surat/persuratan/surat-dinas",
  "/pengaduan-admin",
  "/desa/idm",
  "/keuangan",
  "/keuangan/apbdes",
  "/keuangan/realisasi",
  "/keuangan/kegiatan",
  "/keuangan/kegiatan/[id]",
  "/keuangan/laporan",
  "/keuangan/dokumen",
  "/inventaris",
  "/inventaris/[id]",
  "/inventaris/dashboard",
  "/inventaris/pengelolaan",
  "/inventaris/mutasi",
  "/inventaris/laporan",
  "/bumindes/buku-administrasi",
  "/bumindes/buku-administrasi/[id]",
  "/bumindes/buku-administrasi/[id]/cetak",
  "/profil-desa/berita",
  "/profil-desa/galeri",
  "/satu-data/potensi",
  "/satu-data/sarana-prasarana",
  "/profil-desa/website",
  "/profil-desa/website/pengaturan",
  "/profil-desa/website/halaman",
  "/profil-desa/website/konten",
  "/profil-desa/dokumen",
  "/profil-desa/pemerintah-desa",
  "/profil-desa/lembaga-desa",
  "/profil-desa/status-desa",
  // Halaman placeholder Segera bersama untuk modul yang belum dibangun penuh;
  // rute statis `/segera/kelompok` dkk. tetap menang atas segmen dinamis ini.
  "/segera/[slug]",
  // Alias lama untuk tenant yang menunya masih menyimpan URL placeholder.
  "/segera/status-desa",
  "/segera/statistik-kependudukan",
  "/profil-desa/wilayah-administratif",
  "/pemetaan/peta",
  "/profil-desa/identitas-desa",
  "/kependudukan/stunting",
  "/pengaturan/desa",
  "/pengaturan/pengguna",
  "/pengaturan/pengguna/aktivitas",
  "/pengaturan/grup-akses",
  "/super-admin",
  "/super-admin/tenant",
  "/super-admin/domain",
  "/super-admin/pengguna",
  "/super-admin/audit",
  "/super-admin/template",
  "/super-admin/template/baru",
  "/super-admin/template/penggunaan",
  "/super-admin/template/fondasi",
  "/super-admin/pengaturan",
];

/**
 * Rute yang sudah direncanakan tetapi halamannya belum dibuat.
 *
 * Menu menampilkannya sebagai label "Segera" (bukan tautan). Daftar ini
 * memisahkan "belum selesai" dari "tautan mati": template tenant boleh
 * menunjuk rute di sini, sedangkan `ruteTersedia` tetap mengembalikan false.
 */
export const RUTE_ADMIN_SEGERA: readonly string[] = ["/pembangunan"];

/**
 * Modul yang dihentikan dan tidak boleh tampil di sidebar.
 *
 * Baris modul milik tenant lama masih ada di database (dibuat saat
 * provisioning), jadi penyaringan dilakukan saat menu dibangun. Template tenant
 * baru sudah tidak memuat modul ini.
 */
export const MODUL_DIHENTIKAN: readonly string[] = ["pelanggan", "pendaftaran-kerjasama"];

export interface MenuNodeLike {
  slug?: string;
  label: string;
  url: string | null;
  icon?: string | null;
  children: readonly MenuNodeLike[];
}

export interface BarisMenu {
  kind: "grup" | "item";
  slug: string;
  label: string;
  url: string | null;
  icon: string | null;
  /** Hanya bermakna untuk `item`: apakah halaman tujuan sudah tersedia. */
  tersedia: boolean;
  /** Anak grup; kosong untuk item. */
  items: BarisMenu[];
}

/**
 * Alias rute lama ke rute kanonisnya.
 *
 * Tenant lama masih menyimpan URL placeholder di tabel modul. Alias diarahkan
 * oleh halaman redirect, dan menu harus mengenali keduanya sebagai tujuan yang
 * sama agar item tetap tersorot setelah redirect.
 */
const ALIAS_RUTE_MENU: Readonly<Record<string, string>> = {
  "/website/dokumen": "/profil-desa/dokumen",
  // Rute sebelum dikelompokkan mengikuti sidebar.
  "/absensi-kepegawaian": "/kehadiran",
  "/absensi-kepegawaian/pegawai": "/kehadiran/pegawai",
  "/absensi-kepegawaian/absensi": "/kehadiran/absensi",
  "/permohonan-surat": "/layanan-surat/permohonan-surat",
  "/persuratan": "/layanan-surat/persuratan",
  "/identitas-desa": "/profil-desa/identitas-desa",
  "/wilayah-administratif": "/profil-desa/wilayah-administratif",
  "/pemerintah-desa": "/profil-desa/pemerintah-desa",
  "/lembaga-desa": "/profil-desa/lembaga-desa",
  "/status-desa": "/profil-desa/status-desa",
  "/website": "/profil-desa/website",
  "/website/pengaturan": "/profil-desa/website/pengaturan",
  "/konten/berita": "/profil-desa/berita",
  "/konten/galeri": "/profil-desa/galeri",
  "/konten/dokumen": "/profil-desa/dokumen",
  "/konten/potensi": "/satu-data/potensi",
  // Rute Kependudukan sebelum dikelompokkan mengikuti sidebar.
  "/penduduk": "/kependudukan/penduduk",
  "/penduduk/suplemen": "/kependudukan/penduduk/suplemen",
  "/penduduk/dpt": "/kependudukan/penduduk/dpt",
  "/keluarga": "/kependudukan/keluarga",
  "/rumah-tangga": "/kependudukan/rumah-tangga",
  "/kelompok": "/kependudukan/kelompok",
  "/laporan-bulanan": "/kependudukan/laporan-bulanan",
  "/mutasi-penduduk": "/kependudukan/mutasi-penduduk",
  "/statistik/kependudukan": "/kependudukan/statistik",
  "/statistik/kelompok-rentan": "/kependudukan/kelompok-rentan",
  "/statistik/laporan-penduduk": "/kependudukan/laporan-penduduk",
  "/kesehatan/stunting": "/kependudukan/stunting",
  "/segera/status-desa": "/profil-desa/status-desa",
  "/segera/statistik-kependudukan": "/kependudukan/statistik",
  "/segera/rumah-tangga": "/kependudukan/rumah-tangga",
  "/segera/kelompok": "/kependudukan/kelompok",
  "/segera/suplemen": "/kependudukan/penduduk/suplemen",
  "/segera/laporan-bulanan": "/kependudukan/laporan-bulanan",
  "/segera/laporan-kelompok-rentan": "/kependudukan/kelompok-rentan",
  "/segera/hari-libur": "/kehadiran/hari-libur",
  "/segera/jam-kerja": "/kehadiran/jam-kerja",
  "/segera/persetujuan-izin": "/kehadiran/persetujuan-izin",
  "/segera/alasan-keluar": "/kehadiran/alasan-keluar",
  "/segera/cetak-surat": "/layanan-surat/persuratan/cetak-surat",
};

/** Normalisasi path: buang query dan garis miring di akhir, lalu pakai rute kanonis. */
export function pathMenu(url: string | null | undefined): string | null {
  if (!url) return null;
  const tanpaQuery = url.split("?")[0] ?? "";
  const path = tanpaQuery.replace(/\/+$/, "");
  if (path === "") return "/";
  const langsung = ALIAS_RUTE_MENU[path];
  if (langsung) return langsung;
  // URL menu lama sering berupa subpath (mis. /persuratan/surat-masuk),
  // sedangkan alias hanya mencatat prefiksnya.
  for (const [lama, baru] of Object.entries(ALIAS_RUTE_MENU)) {
    if (path.startsWith(`${lama}/`)) return baru + path.slice(lama.length);
  }
  return path;
}

/** URL tujuan menu dengan rute kanonis; query string dipertahankan. */
function urlMenuTujuan(url: string | null): string | null {
  const path = pathMenu(url);
  if (!path || !url) return url;
  const queryIndex = url.indexOf("?");
  return queryIndex === -1 ? path : `${path}${url.slice(queryIndex)}`;
}

/** Apakah URL menu menunjuk halaman admin yang sudah diimplementasikan. */
export function ruteTersedia(url: string | null | undefined): boolean {
  const path = pathMenu(url);
  if (!path) return false;
  return RUTE_ADMIN_TERSEDIA.some((route) => {
    const pattern = route.split("/");
    const segments = path.split("/");
    return (
      pattern.length === segments.length &&
      pattern.every((segment, index) =>
        /^\[[^/]+\]$/.test(segment) ? Boolean(segments[index]) : segment === segments[index],
      )
    );
  });
}

/**
 * Susun menu bersarang menjadi baris siap render.
 *
 * Simpul yang punya anak menjadi grup (dropdown); daun menjadi item. Grup tidak
 * memakai `url`-nya sendiri karena sidebar merender kepala grup sebagai tombol
 * buka/tutup, bukan tautan; halaman ringkasan grup, bila ada, didaftarkan
 * sebagai anaknya. Urutan mengikuti hasil `buildMenu` (sudah diurutkan menurut
 * `sortOrder` lalu label).
 */
export function susunMenuTampil(menu: readonly MenuNodeLike[]): BarisMenu[] {
  return menu.map((node) => {
    const items = susunMenuTampil(node.children);
    const grup = items.length > 0;

    return {
      kind: grup ? "grup" : "item",
      slug: node.slug ?? node.label,
      label: node.label,
      url: grup ? null : urlMenuTujuan(node.url),
      icon: node.icon ?? null,
      tersedia: grup ? false : ruteTersedia(node.url),
      items,
    };
  });
}
