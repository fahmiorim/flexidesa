import { RESOURCES, type Resource } from "./resources";

/**
 * Pemetaan resmi slug modul template tenant ke resource izin backend.
 *
 * Aturan:
 * - Setiap slug yang ada di `TENANT_TEMPLATE` wajib punya entri di sini,
 *   termasuk grup dan placeholder `/segera/*`.
 * - `resource: null` berarti menu belum punya pemeriksaan izin khusus;
 *   `catatan` wajib menjelaskan resource pemilik atau status placeholdernya.
 * - Nilai resource harus berupa nilai `RESOURCES` (bukan kunci baru). Jangan
 *   memakai string literal di pemeriksaan backend: tambahkan kunci baru lebih
 *   dahulu agar nilai yang diperiksa dan grant tenant selalu sinkron.
 */
export interface PemetaanResourceModul {
  resource: Resource | null;
  catatan?: string;
}

export const PETA_RESOURCE_MODUL = {
  beranda: {
    resource: null,
    catatan: "Dashboard agregat lintas modul; tidak punya operasi tulis sendiri.",
  },
  "profil-desa": {
    resource: RESOURCES.profilDesa,
    catatan: "Grup Profil & Website Desa; submenu memakai resource masing-masing.",
  },
  kependudukan: {
    resource: RESOURCES.penduduk,
    catatan: "Grup Kependudukan; submenu data memakai resource penduduk/keluarga/kelompok.",
  },
  statistik: {
    resource: null,
    catatan:
      "Grup statistik disembunyikan (legacy); halaman statistik hanya membaca data kependudukan.",
  },
  kesehatan: {
    resource: RESOURCES.kesehatan,
  },
  kehadiran: {
    resource: RESOURCES.kehadiran,
    catatan: "Grup Kehadiran & Kepegawaian; data pegawai memakai resource kepegawaian.",
  },
  "layanan-surat": {
    resource: RESOURCES.surat,
    catatan: "Grup Pelayanan & Persuratan; submenu memakai resource surat masing-masing.",
  },
  sekretariat: {
    resource: null,
    catatan: "Grup Administrasi Desa; operasi buku memakai resource bumindes.",
  },
  "buku-administrasi-desa": {
    resource: RESOURCES.bumindes,
  },
  keuangan: {
    resource: RESOURCES.keuangan,
    catatan: "Grup Keuangan Desa; APBDes/laporan memakai resource turunannya.",
  },
  pertanahan: {
    resource: RESOURCES.pertanahan,
  },
  pengaduan: {
    resource: RESOURCES.pengaduan,
  },
  pemetaan: {
    resource: RESOURCES.peta,
    catatan: "Grup Pertanahan & GIS; seluruh operasi peta memakai resource peta.",
  },
  "hubung-warga": {
    resource: null,
    catatan: "Grup Layanan Warga; pengaduan/pendapat memakai resource submenunya.",
  },
  pengaturan: {
    resource: RESOURCES.pengaturan,
    catatan: "Grup Pengaturan; submenu memakai resource pengguna/RBAC/aplikasi.",
  },
  "admin-web": {
    resource: RESOURCES.websitePengaturan,
    catatan: "Root lama Website yang disembunyikan; konten dikelola lewat submenu Profil Desa.",
  },
  "layanan-mandiri": {
    resource: RESOURCES.layananPublik,
  },
  "satu-data": {
    resource: null,
    catatan: "Grup Program & Data Desa; potensi/sarana/IDM memakai resource submenunya.",
  },
  "buku-tamu": {
    resource: RESOURCES.bukuTamu,
  },
  "pengaturan-desa": {
    resource: RESOURCES.pengaturanDesa,
  },
  wilayah: {
    resource: RESOURCES.wilayah,
  },
  "perangkat-desa": {
    resource: RESOURCES.perangkatDesa,
  },
  "lembaga-desa": {
    resource: RESOURCES.lembagaDesa,
  },
  "status-desa": {
    resource: RESOURCES.statusDesa,
  },
  penduduk: {
    resource: RESOURCES.penduduk,
  },
  keluarga: {
    resource: RESOURCES.keluarga,
  },
  "rumah-tangga": {
    resource: RESOURCES.rumahTangga,
  },
  kelompok: {
    resource: RESOURCES.kelompok,
  },
  suplemen: {
    resource: RESOURCES.suplemen,
  },
  "calon-pemilih": {
    resource: RESOURCES.penduduk,
    catatan: "DPT memakai resource penduduk; modul pemilihan mengatur periode pemilihannya.",
  },
  "statistik-kependudukan": {
    resource: RESOURCES.penduduk,
    catatan: "Rentang umur/statistik membaca resource penduduk; halaman tidak punya operasi tulis.",
  },
  "laporan-bulanan": {
    resource: RESOURCES.laporanBulanan,
  },
  "laporan-kelompok-rentan": {
    resource: RESOURCES.laporanKelompokRentan,
  },
  "laporan-penduduk": {
    resource: RESOURCES.laporanPenduduk,
  },
  stunting: {
    resource: RESOURCES.stunting,
    catatan: "Data KIA/Posyandu memakai modul `stunting`, bukan grup kesehatan umum.",
  },
  "rekapitulasi-kehadiran": {
    resource: RESOURCES.rekapitulasiKehadiran,
  },
  "hari-libur": {
    resource: RESOURCES.hariLibur,
  },
  "jam-kerja": {
    resource: RESOURCES.jamKerja,
  },
  "pengajuan-izin": {
    resource: RESOURCES.pengajuanIzin,
  },
  "persetujuan-izin": {
    resource: RESOURCES.persetujuanIzin,
  },
  "alasan-keluar": {
    resource: RESOURCES.alasanKeluar,
  },
  "permohonan-surat": {
    resource: RESOURCES.permohonanSurat,
  },
  "syarat-surat": {
    resource: RESOURCES.syaratSurat,
  },
  "klasifikasi-surat": {
    resource: RESOURCES.klasifikasiSurat,
  },
  "pengaturan-surat": {
    resource: RESOURCES.pengaturanSurat,
  },
  "cetak-surat": {
    resource: RESOURCES.surat,
    catatan: "Pencetakan memakai data surat yang sudah lolos verifikasi.",
  },
  inventaris: {
    resource: RESOURCES.inventaris,
  },
  arsip: {
    resource: RESOURCES.arsip,
    catatan: "Menu masih placeholder `/segera/arsip`; resource disiapkan untuk fitur arsip.",
  },
  bumindes: {
    resource: RESOURCES.bumindes,
  },
  "laporan-keuangan": {
    resource: RESOURCES.laporanKeuangan,
  },
  pembangunan: {
    resource: RESOURCES.pembangunan,
  },
  peta: {
    resource: RESOURCES.peta,
  },
  pengguna: {
    resource: RESOURCES.pengguna,
  },
  "website-pengaturan": {
    resource: RESOURCES.websitePengaturan,
  },
  berita: {
    resource: RESOURCES.berita,
  },
  galeri: {
    resource: RESOURCES.galeri,
  },
  bantuan: {
    resource: RESOURCES.bantuan,
    catatan: "Pengelolaan masih placeholder; data penerima memakai domain bantuan.",
  },
  "idm-sdgs": {
    resource: RESOURCES.idmSdgs,
  },
  surat: {
    resource: RESOURCES.surat,
  },
  "jenis-surat": {
    resource: RESOURCES.jenisSurat,
  },
  "surat-masuk": {
    resource: RESOURCES.suratMasuk,
  },
  "surat-keluar": {
    resource: RESOURCES.suratKeluar,
  },
  "surat-dinas": {
    resource: RESOURCES.suratDinas,
  },
  dokumen: {
    resource: RESOURCES.dokumenPublik,
  },
  lapak: {
    resource: RESOURCES.lapak,
    catatan: "Menu masih placeholder `/segera/lapak`; model/repository sudah ada.",
  },
  "pembangunan-aset": {
    resource: null,
    catatan:
      "Grup Pembangunan & Aset; proyek memakai resource pembangunan, aset memakai inventaris.",
  },
  "data-pegawai": {
    resource: RESOURCES.kepegawaian,
  },
  absensi: {
    resource: RESOURCES.kehadiran,
  },
  "buku-administrasi-penduduk": {
    resource: RESOURCES.bumindes,
  },
  "buku-administrasi-pembangunan": {
    resource: RESOURCES.bumindes,
    catatan: "Menu masih placeholder `/segera/buku-administrasi-pembangunan`.",
  },
  "buku-administrasi-lainnya": {
    resource: RESOURCES.bumindes,
  },
  "agenda-kegiatan": {
    resource: RESOURCES.agendaKegiatan,
    catatan: "Menu masih placeholder; agenda desa dikelola lewat Website → Konten.",
  },
  apbdes: {
    resource: RESOURCES.apbdes,
  },
  pendapatan: {
    resource: RESOURCES.keuangan,
    catatan: "Rincian pendapatan bagian dari APBDes; menu masih placeholder.",
  },
  belanja: {
    resource: RESOURCES.keuangan,
    catatan: "Rincian belanja bagian dari APBDes; menu masih placeholder.",
  },
  pembiayaan: {
    resource: RESOURCES.keuangan,
    catatan: "Rincian pembiayaan bagian dari APBDes; menu masih placeholder.",
  },
  penatausahaan: {
    resource: RESOURCES.keuangan,
    catatan: "Menu penatausahaan masih placeholder.",
  },
  "buku-kas-umum": {
    resource: RESOURCES.keuangan,
    catatan: "Menu BKU masih placeholder.",
  },
  realisasi: {
    resource: RESOURCES.keuangan,
  },
  "perencanaan-pembangunan": {
    resource: RESOURCES.pembangunan,
    catatan: "Menu perencanaan masih placeholder.",
  },
  "proyek-desa": {
    resource: RESOURCES.pembangunan,
    catatan: "Menu proyek masih placeholder; kegiatan dikelola lewat /keuangan/kegiatan.",
  },
  "aset-desa": {
    resource: RESOURCES.inventaris,
    catatan: "Menu aset desa masih placeholder; data aset dikelola lewat inventaris.",
  },
  "mutasi-aset": {
    resource: RESOURCES.mutasiInventaris,
  },
  "laporan-aset": {
    resource: RESOURCES.inventaris,
  },
  "peta-wilayah": {
    resource: RESOURCES.peta,
    catatan: "Menu masih placeholder; peta dikelola lewat /pemetaan/peta.",
  },
  "data-pertanahan": {
    resource: RESOURCES.pertanahan,
    catatan: "Menu masih placeholder.",
  },
  "batas-wilayah": {
    resource: RESOURCES.peta,
    catatan: "Menu masih placeholder; batas desa diisi dari Identitas Desa.",
  },
  "peta-penduduk": {
    resource: RESOURCES.peta,
    catatan: "Menu masih placeholder.",
  },
  "data-penerima-bantuan": {
    resource: RESOURCES.bantuan,
    catatan: "Menu masih placeholder; data penerima ada di domain bantuan.",
  },
  potensi: {
    resource: RESOURCES.potensi,
  },
  "sarana-prasarana": {
    resource: RESOURCES.saranaPrasarana,
  },
  "statistik-program-desa": {
    resource: null,
    catatan: "Menu masih placeholder; belum ada operasi/resource khusus.",
  },
  "aspirasi-warga": {
    resource: RESOURCES.pengaduan,
    catatan: "Menu masih placeholder; aspirasi memakai domain pengaduan.",
  },
  "informasi-pelayanan": {
    resource: RESOURCES.layananPublik,
  },
  "grup-akses": {
    resource: RESOURCES.grupAkses,
  },
  "pengaturan-sistem": {
    resource: RESOURCES.pengaturanAplikasi,
  },
  integrasi: {
    resource: RESOURCES.pengaturan,
    catatan: "Menu masih placeholder; integrasi dikelola sebagai bagian Pengaturan Desa.",
  },
  "template-website": {
    resource: RESOURCES.websitePengaturan,
    catatan: "Menu masih placeholder; template situs dikelola lewat Website → Pengaturan.",
  },
  "log-aktivitas": {
    resource: RESOURCES.auditLog,
  },
} as const satisfies Record<string, PemetaanResourceModul>;
