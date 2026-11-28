/**
 * Judul halaman konsol platform.
 *
 * Top bar konsol menampilkan identitas halaman (eyebrow, judul, deskripsi) milik
 * rute aktif. Karena layout Next.js tidak menerima metadata milik halaman, isi
 * top bar disimpan di sini sebagai sumber tunggal dan dipetakan dari pathname.
 *
 * Setiap tautan di `MENU_PLATFORM` harus punya entri di sini; test memastikan
 * keduanya tidak melenceng saat menu ditambah.
 */

interface RemahPlatform {
  readonly label: string;
  readonly href?: string;
}

interface HeaderPlatform {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  /** Induk navigasi yang ditampilkan sebelum judul halaman. */
  readonly remah?: readonly RemahPlatform[];
  /** Aksi utama halaman, bila ada. */
  readonly aksi?: { readonly label: string; readonly href: string };
}

export const HEADER_PLATFORM: Readonly<Record<string, HeaderPlatform>> = {
  "/super-admin": {
    eyebrow: "Konsol platform",
    title: "Ringkasan",
    description: "Pantau tenant desa, domain, akses platform, dan retensi data dalam satu tempat.",
  },
  "/super-admin/tenant": {
    eyebrow: "Desa & Tenant",
    title: "Tenant",
    description:
      "Kelola status, kuota media, domain, akses administrator, ekspor, dan purge tiap desa.",
    remah: [{ label: "Tenant" }],
  },
  "/super-admin/tenant/tambah": {
    eyebrow: "Tenant",
    title: "Tambah tenant",
    description:
      "Daftarkan desa baru, siapkan alamat domain, pilih template website dan paket langganan, lalu buat akun administratornya.",
    remah: [{ label: "Tenant", href: "/super-admin/tenant" }],
  },
  "/super-admin/domain": {
    eyebrow: "Desa & Tenant",
    title: "Domain",
    description:
      "Kelola domain dan alamat website publik seluruh desa/tenant pada platform FlexiDesa.",
    remah: [{ label: "Domain" }],
  },
  "/super-admin/pengguna": {
    eyebrow: "Akses & Audit",
    title: "Akun Platform",
    description:
      "Akun yang tidak terikat desa dan hanya mengelola platform. Akun administrator desa dikelola dari konsol tenant, bukan di sini.",
  },
  "/super-admin/pengguna-desa": {
    eyebrow: "Akses & Audit",
    title: "Pengguna Desa",
    description:
      "Direktori akun pengguna desa lintas tenant: cari akun, nonaktifkan, reset sandi, dan cabut sesi dengan jejak audit.",
  },
  "/super-admin/kesehatan": {
    eyebrow: "Operasional",
    title: "Kesehatan Sistem",
    description:
      "Ringkasan kondisi basis data, sertifikat SSL, DNS, dan kesiapan tenant dari pemeriksaan terakhir.",
    remah: [{ label: "Operasional" }],
  },
  "/super-admin/audit": {
    eyebrow: "Akses & Audit",
    title: "Audit Trail",
    description:
      "Rekaman aksi sensitif dari seluruh desa dan tingkat platform: aktor, waktu, alamat IP, dan sumber daya yang berubah.",
  },
  "/super-admin/template": {
    eyebrow: "Desa & Tenant",
    title: "Template Website",
    description:
      "Katalog tema website: token tampilan, status publikasi, penggunaan tenant, dan distribusi versi. Unggahan kode atau paket ZIP tidak termasuk.",
  },
  "/super-admin/template/baru": {
    eyebrow: "Template Website",
    title: "Tambah template",
    description:
      "Buat metadata tema baru dari token tampilan yang tervalidasi. Template tersimpan sebagai draf sampai diterbitkan.",
  },
  "/super-admin/template/penggunaan": {
    eyebrow: "Template Website",
    title: "Penggunaan & pembaruan",
    description:
      "Lihat tenant yang memakai setiap tema dan kirim versi terbaru hanya kepada tenant yang memakai slug template tersebut.",
  },
  "/super-admin/template/fondasi": {
    eyebrow: "Template Website",
    title: "Fondasi tenant baru",
    description:
      "Bacaan template fondasi yang disalin ke desa baru: role, modul, matriks akses, tema, dan menu publik. Diperbarui lewat rilis aplikasi.",
  },
  "/super-admin/paket": {
    eyebrow: "Desa & Tenant",
    title: "Paket Langganan",
    description: "Atur modul setiap paket dan tentukan kapan versi terbit berlaku bagi tenant.",
  },
  "/super-admin/paket/baru": {
    eyebrow: "Paket Langganan",
    title: "Buat paket",
    description: "Tambahkan paket baru beserta draf pertama daftar fiturnya.",
    remah: [{ label: "Paket Langganan", href: "/super-admin/paket" }],
  },
  "/super-admin/paket/tenant": {
    eyebrow: "Paket Langganan",
    title: "Paket tenant",
    description:
      "Tetapkan paket terbit kepada desa; modul di luar paket akan dibatasi tanpa menghapus datanya.",
    remah: [{ label: "Paket Langganan", href: "/super-admin/paket" }],
  },
  "/super-admin/backup": {
    eyebrow: "Operasional",
    title: "Backup & Restore",
    description:
      "Unduh salinan basis data platform atau pulihkan dari berkas SQL. Restore mengganti seluruh basis data dan memengaruhi semua desa.",
    remah: [{ label: "Operasional" }],
  },
  "/super-admin/pengaturan": {
    eyebrow: "Operasional",
    title: "Pengaturan",
    description:
      "Ringkasan konfigurasi aktif yang dibaca aplikasi. Nilai rahasia tidak pernah dibaca maupun ditampilkan di halaman ini.",
  },
};

const BAWAAN = HEADER_PLATFORM["/super-admin"] as HeaderPlatform;

/**
 * Header untuk pathname aktif.
 *
 * Sub-rute memakai header menu induknya (mis. `/super-admin/tenant/12` memakai
 * header `/super-admin/tenant`). Pathname yang tidak dikenal memakai ringkasan
 * agar top bar tidak pernah kosong.
 */
export function headerPlatform(pathname: string): HeaderPlatform {
  const persis = HEADER_PLATFORM[pathname];
  if (persis) return persis;

  // Detail domain memakai id dinamis; top bar tetap menampilkan konteks
  // "Desa & Domain → Detail Domain" tanpa menambah entri per id.
  if (/^\/super-admin\/domain\/\d+$/.test(pathname)) {
    return {
      eyebrow: "Desa & Tenant",
      title: "Detail Domain",
      description: "Informasi dan pengaturan domain, DNS, SSL, serta riwayat perubahan.",
      remah: [{ label: "Domain" }, { label: "Domain", href: "/super-admin/domain" }],
    };
  }

  // Detail tenant (`/super-admin/tenant/12`) memakai konteks menu Tenant.
  if (/^\/super-admin\/tenant\/\d+$/.test(pathname)) {
    return {
      eyebrow: "Tenant",
      title: "Detail Tenant",
      description:
        "Profil desa, domain, paket langganan, pengguna, kuota, dan riwayat audit tenant.",
      remah: [{ label: "Tenant", href: "/super-admin/tenant" }],
    };
  }

  const induk = Object.keys(HEADER_PLATFORM)
    .filter((href) => href !== "/super-admin" && pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return induk ? (HEADER_PLATFORM[induk] as HeaderPlatform) : BAWAAN;
}
