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
  "/penduduk",
  "/penduduk/suplemen",
  "/penduduk/suplemen/baru",
  "/penduduk/suplemen/[id]",
  "/penduduk/suplemen/[id]/ubah",
  "/penduduk/suplemen/[id]/impor",
  "/penduduk/suplemen/[id]/cetak",
  "/penduduk/suplemen/[id]/terdata/baru",
  "/penduduk/suplemen/[id]/terdata/[terdataId]/ubah",
  "/penduduk/dpt",
  "/absensi-kepegawaian",
  "/absensi-kepegawaian/absensi",
  "/kehadiran/pengaduan",
  "/kehadiran/rekapitulasi",
  "/kehadiran/hari-libur",
  "/kehadiran/jam-kerja",
  "/kehadiran/pengajuan-izin",
  "/kehadiran/persetujuan-izin",
  "/kehadiran/alasan-keluar",
  "/absensi-kepegawaian/pegawai",
  "/absensi-kepegawaian/cuti-izin",
  "/keluarga",
  "/rumah-tangga",
  "/rumah-tangga/baru",
  "/rumah-tangga/impor",
  "/rumah-tangga/impor/template",
  "/rumah-tangga/laporan",
  "/rumah-tangga/[id]",
  "/rumah-tangga/[id]/ubah",
  "/rumah-tangga/[id]/cetak",
  "/kelompok",
  "/kelompok/baru",
  "/kelompok/kategori",
  "/kelompok/kategori/baru",
  "/kelompok/kategori/[id]/ubah",
  "/kelompok/cetak",
  "/kelompok/[id]",
  "/kelompok/[id]/ubah",
  "/kelompok/[id]/cetak",
  "/kelompok/[id]/anggota-baru",
  "/kelompok/[id]/anggota/[memberId]/ubah",
  "/mutasi-penduduk",
  "/mutasi-penduduk/cetak",
  "/laporan-bulanan",
  "/statistik/kependudukan",
  "/statistik/kelompok-rentan",
  "/statistik/laporan-penduduk",
  "/mutasi-penduduk/[id]/ubah",
  "/penduduk/[id]/mutasi",
  "/statistik/kependudukan",
  "/statistik/kependudukan/penduduk",
  "/statistik/rentang-umur",
  "/persuratan/dashboard",
  "/permohonan-surat",
  "/persuratan/surat",
  "/persuratan/verifikasi",
  "/persuratan/jenis-surat",
  "/persuratan/jenis-surat/pengaturan",
  "/persuratan/syarat-surat",
  "/persuratan/klasifikasi-surat",
  "/persuratan/cetak-surat",
  "/persuratan/arsip",
  "/persuratan/master",
  "/persuratan/surat-masuk",
  "/persuratan/surat-keluar",
  "/persuratan/surat-dinas",
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
  "/konten/berita",
  "/konten/galeri",
  "/konten/potensi",
  "/website",
  "/website/pengaturan",
  "/website/halaman",
  "/website/konten",
  "/website/dokumen",
  "/pemerintah-desa",
  "/lembaga-desa",
  "/status-desa",
  // Halaman placeholder Segera bersama untuk modul yang belum dibangun penuh;
  // rute statis `/segera/kelompok` dkk. tetap menang atas segmen dinamis ini.
  "/segera/[slug]",
  // Alias lama untuk tenant yang menunya masih menyimpan URL placeholder.
  "/segera/status-desa",
  "/segera/statistik-kependudukan",
  "/wilayah-administratif",
  "/pemetaan/peta",
  "/identitas-desa",
  "/kesehatan/stunting",
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
  "/segera/status-desa": "/status-desa",
  "/segera/statistik-kependudukan": "/statistik/kependudukan",
  "/segera/rumah-tangga": "/rumah-tangga",
  "/segera/kelompok": "/kelompok",
  "/segera/suplemen": "/penduduk/suplemen",
  "/segera/laporan-bulanan": "/laporan-bulanan",
  "/segera/laporan-kelompok-rentan": "/statistik/kelompok-rentan",
  "/segera/hari-libur": "/kehadiran/hari-libur",
  "/segera/jam-kerja": "/kehadiran/jam-kerja",
  "/segera/persetujuan-izin": "/kehadiran/persetujuan-izin",
  "/segera/alasan-keluar": "/kehadiran/alasan-keluar",
  "/segera/cetak-surat": "/persuratan/cetak-surat",
};

/** Normalisasi path: buang query dan garis miring di akhir, lalu pakai rute kanonis. */
export function pathMenu(url: string | null | undefined): string | null {
  if (!url) return null;
  const tanpaQuery = url.split("?")[0] ?? "";
  const path = tanpaQuery.replace(/\/+$/, "");
  if (path === "") return "/";
  return ALIAS_RUTE_MENU[path] ?? path;
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
