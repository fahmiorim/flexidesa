import type { NextConfig } from "next";

/**
 * Domain induk pengembangan (mis. `flexidesa.test`). Dipakai untuk mengizinkan
 * host tenant `<slug>.<domain>` mengambil aset dev.
 */
const domainDev = (process.env.DESA_BASE_DOMAIN ?? "").trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Mengaktifkan `forbidden()` dari `next/navigation` agar halaman dapat
   * merespons 403 dengan UI penjelasan (`src/app/forbidden.tsx`), bukan error
   * boundary generik. Flag ini hanya membuka API; tidak mengubah rute lain.
   */
  experimental: {
    authInterrupts: true,
    // Lampiran surat dinas, cuti, arsip pegawai, dan upload pemerintahan
    // menerima PDF hingga 20 MB, ditambah sedikit ruang untuk overhead multipart.
    serverActions: { bodySizeLimit: "25mb" },
  },

  /**
   * Cache Components dinonaktifkan dengan sengaja.
   *
   * Aplikasi ini adalah sistem administrasi yang menuntut autentikasi: hampir
   * semua rute membaca sesi per-pengguna dan data desa yang dinamis, sehingga
   * model "use cache" nyaris tidak memberi manfaat namun menambah kerumitan
   * (setiap halaman dinamis wajib dibungkus Suspense). Kita memakai model
   * dinamis klasik dan dapat mengaktifkan Cache Components kembali, per rute,
   * untuk permukaan publik yang benar-benar layak di-cache.
   */
  cacheComponents: false,

  /**
   * Kunci root Turbopack ke folder proyek. Tanpa ini, Next menelusuri ke atas
   * dan menemukan lockfile lain di luar repo (mis. D:\laragon\www).
   */
  turbopack: {
    root: process.cwd(),
  },

  /**
   * Next dev hanya mengizinkan aset dev (HMR dan boot client) dari origin
   * server. Tanpa daftar ini, membuka aplikasi lewat host tenant
   * `<slug>.flexidesa.test` membuat React tidak pernah hydrate: HTML tampil
   * tetapi seluruh tombol dan form mati. Hanya berlaku saat `next dev`.
   */
  allowedDevOrigins: domainDev ? [domainDev, `*.${domainDev}`] : [],

  /**
   * Baileys adalah paket Node murni (soket, fs, crypto). Jangan di-bundle;
   * biarkan di-resolve saat runtime oleh proses server yang persisten.
   */
  serverExternalPackages: ["@whiskeysockets/baileys", "pino"],

  /**
   * URL modul Info Desa mengikuti nama acuan. Menu pada database tenant lama
   * dan tautan yang sudah tersimpan di luar aplikasi masih memakai URL lama,
   * jadi keduanya dialihkan permanen ke URL baru agar tidak menjadi 404.
   */
  async redirects() {
    return [
      { source: "/pengaturan-desa", destination: "/profil-desa/identitas-desa", permanent: true },
      {
        source: "/pemerintahan-desa/perangkat",
        destination: "/profil-desa/pemerintah-desa",
        permanent: true,
      },
      {
        source: "/pemerintahan-desa/lembaga",
        destination: "/profil-desa/lembaga-desa",
        permanent: true,
      },
      {
        source: "/pemerintahan-desa/wilayah",
        destination: "/profil-desa/wilayah-administratif",
        permanent: true,
      },
      // Rute Kehadiran & Layanan Surat kini berprefiks grup sidebar.
      { source: "/absensi-kepegawaian/:path*", destination: "/kehadiran/:path*", permanent: true },
      {
        source: "/permohonan-surat/:path*",
        destination: "/layanan-surat/permohonan-surat/:path*",
        permanent: true,
      },
      {
        source: "/persuratan/:path*",
        destination: "/layanan-surat/persuratan/:path*",
        permanent: true,
      },
      // Rute "Profil & Website Desa" kini berprefiks grup sidebar.
      { source: "/website/dokumen", destination: "/profil-desa/dokumen", permanent: true },
      { source: "/website/:path*", destination: "/profil-desa/website/:path*", permanent: true },
      {
        source: "/identitas-desa/:path*",
        destination: "/profil-desa/identitas-desa/:path*",
        permanent: true,
      },
      {
        source: "/wilayah-administratif/:path*",
        destination: "/profil-desa/wilayah-administratif/:path*",
        permanent: true,
      },
      {
        source: "/pemerintah-desa/:path*",
        destination: "/profil-desa/pemerintah-desa/:path*",
        permanent: true,
      },
      {
        source: "/lembaga-desa/:path*",
        destination: "/profil-desa/lembaga-desa/:path*",
        permanent: true,
      },
      {
        source: "/status-desa/:path*",
        destination: "/profil-desa/status-desa/:path*",
        permanent: true,
      },
      {
        source: "/konten/berita/:path*",
        destination: "/profil-desa/berita/:path*",
        permanent: true,
      },
      {
        source: "/konten/galeri/:path*",
        destination: "/profil-desa/galeri/:path*",
        permanent: true,
      },
      {
        source: "/konten/dokumen/:path*",
        destination: "/profil-desa/dokumen/:path*",
        permanent: true,
      },
      {
        source: "/konten/potensi/:path*",
        destination: "/satu-data/potensi/:path*",
        permanent: true,
      },
      // Rute Kependudukan kini berprefiks grup sidebar. Menu pada database
      // tenant lama dan tautan tersimpan tetap memakai URL lama.
      { source: "/penduduk/:path*", destination: "/kependudukan/penduduk/:path*", permanent: true },
      { source: "/keluarga/:path*", destination: "/kependudukan/keluarga/:path*", permanent: true },
      {
        source: "/rumah-tangga/:path*",
        destination: "/kependudukan/rumah-tangga/:path*",
        permanent: true,
      },
      { source: "/kelompok/:path*", destination: "/kependudukan/kelompok/:path*", permanent: true },
      {
        source: "/laporan-bulanan/:path*",
        destination: "/kependudukan/laporan-bulanan/:path*",
        permanent: true,
      },
      {
        source: "/mutasi-penduduk/:path*",
        destination: "/kependudukan/mutasi-penduduk/:path*",
        permanent: true,
      },
      {
        source: "/statistik/kependudukan/:path*",
        destination: "/kependudukan/statistik/:path*",
        permanent: true,
      },
      {
        source: "/statistik/kelompok-rentan/:path*",
        destination: "/kependudukan/kelompok-rentan/:path*",
        permanent: true,
      },
      {
        source: "/statistik/laporan-penduduk/:path*",
        destination: "/kependudukan/laporan-penduduk/:path*",
        permanent: true,
      },
      {
        source: "/kesehatan/stunting/:path*",
        destination: "/kependudukan/stunting/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
