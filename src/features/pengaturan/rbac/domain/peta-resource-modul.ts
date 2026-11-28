/**
 * Guard aktif: menjaga setiap slug TENANT_TEMPLATE punya entri resource RBAC. Jangan hapus.
 */
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
interface PemetaanResourceModul {
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
  "verifikasi-surat": {
    resource: RESOURCES.surat,
    catatan: "Verifikasi memakai izin perubahan surat.",
  },
  "master-surat": {
    resource: RESOURCES.klasifikasiSurat,
    catatan: "Master referensi menggabungkan klasifikasi dan syarat surat.",
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
    catatan: "Arsip surat desa; halaman tersedia di /layanan-surat/persuratan/arsip.",
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
  "website-konten": {
    resource: RESOURCES.websiteKonten,
    catatan: "Halaman konten memeriksa izin berita, agenda, galeri, dan slider masing-masing.",
  },
  "website-halaman": {
    resource: RESOURCES.websiteHalaman,
    catatan: "Halaman website memeriksa izin halaman, menu publik, dan widget.",
  },
  "mutasi-penduduk": {
    resource: RESOURCES.mutasiPenduduk,
    catatan: "Halaman mutasi memakai izin penduduk untuk baca dan ubah.",
  },
  "dokumen-keuangan": {
    resource: RESOURCES.dokumenKeuangan,
    catatan: "Dokumen laporan keuangan memakai izin laporan-keuangan.",
  },
  "pengajuan-layanan": {
    resource: RESOURCES.pengajuanLayanan,
  },
  "analisis-survei": {
    resource: RESOURCES.analisisSurvei,
  },
  "cuti-izin": {
    resource: RESOURCES.cutiIzin,
    catatan: "Pengajuan cuti memakai izin persetujuan-izin untuk keputusan.",
  },
  berita: {
    resource: RESOURCES.berita,
  },
  galeri: {
    resource: RESOURCES.galeri,
  },
  bantuan: {
    resource: RESOURCES.bantuan,
    catatan: "Halaman /satu-data/bantuan mengelola program dan peserta bantuan.",
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
    catatan: "Halaman /pelayanan-publik/lapak mengelola lapak dan produknya.",
  },
  "pembangunan-aset": {
    resource: null,
    catatan:
      "Grup Pembangunan & Aset; proyek memakai resource pembangunan, aset memakai inventaris.",
  },
  "data-pegawai": {
    resource: RESOURCES.dataPegawai,
  },
  absensi: {
    resource: RESOURCES.kehadiran,
  },
  "buku-administrasi-penduduk": {
    resource: RESOURCES.bumindes,
  },
  "buku-administrasi-pembangunan": {
    resource: RESOURCES.pembangunan,
    catatan: "Halaman /pembangunan/buku memakai use case pembangunan untuk merekap proyek.",
  },
  "buku-administrasi-lainnya": {
    resource: RESOURCES.bumindes,
  },
  "agenda-kegiatan": {
    resource: RESOURCES.agendaKegiatan,
    catatan: "Agenda desa punya halaman sendiri di /profil-desa/website/agenda.",
  },
  apbdes: {
    resource: RESOURCES.apbdes,
  },
  pendapatan: {
    resource: RESOURCES.keuangan,
    catatan: "Halaman /keuangan/pendapatan menampilkan rincian akun 4 dari data APBDes.",
  },
  belanja: {
    resource: RESOURCES.keuangan,
    catatan: "Halaman /keuangan/belanja menampilkan rincian akun 5 dari data APBDes.",
  },
  pembiayaan: {
    resource: RESOURCES.keuangan,
    catatan: "Halaman /keuangan/pembiayaan menampilkan rincian akun 6 dari data APBDes.",
  },
  penatausahaan: {
    resource: RESOURCES.keuangan,
    catatan: "Halaman /keuangan/penatausahaan mengelola jurnal kas dan saldo awal bank.",
  },
  "buku-kas-umum": {
    resource: RESOURCES.keuangan,
    catatan: "Halaman /keuangan/buku-kas-umum menurunkan saldo berjalan dari jurnal.",
  },
  realisasi: {
    resource: RESOURCES.keuangan,
  },
  "perencanaan-pembangunan": {
    resource: RESOURCES.pembangunan,
    catatan: "Menu izin saja: perencanaan & anggaran dikelola lewat /keuangan/kegiatan.",
  },
  "proyek-desa": {
    resource: RESOURCES.pembangunan,
    catatan: "Menu izin saja: proyek dikelola lewat /keuangan/kegiatan.",
  },
  "aset-desa": {
    resource: RESOURCES.inventaris,
    catatan: "Menu izin saja: aset desa dikelola lewat /inventaris.",
  },
  "mutasi-aset": {
    resource: RESOURCES.mutasiInventaris,
  },
  "laporan-aset": {
    resource: RESOURCES.inventaris,
  },
  "peta-wilayah": {
    resource: RESOURCES.peta,
    catatan: "Menu izin saja: peta dikelola lewat /pemetaan/peta.",
  },
  "data-pertanahan": {
    resource: RESOURCES.pertanahan,
    catatan: "Halaman /pemetaan/data-pertanahan mengelola persil desa.",
  },
  "batas-wilayah": {
    resource: RESOURCES.peta,
    catatan: "Menu izin saja: batas desa diisi dari Identitas Desa dan area peta.",
  },
  "peta-penduduk": {
    resource: RESOURCES.peta,
    catatan: "Halaman /pemetaan/peta-penduduk menampilkan sebaran penduduk per dusun.",
  },
  "data-penerima-bantuan": {
    resource: RESOURCES.bantuan,
    catatan: "Menu izin saja: data penerima ada di halaman /satu-data/bantuan.",
  },
  potensi: {
    resource: RESOURCES.potensi,
  },
  "sarana-prasarana": {
    resource: RESOURCES.saranaPrasarana,
  },
  "statistik-program-desa": {
    resource: null,
    catatan: "Halaman statistik program membaca statistik bantuan memakai resource bantuan.",
  },
  "aspirasi-warga": {
    resource: RESOURCES.pengaduan,
    catatan: "Menu izin saja: aspirasi diterima lewat alur pengaduan (/pengaduan-admin).",
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
    catatan: "Menu membuka tab Integrasi di /pengaturan/desa?bagian=integrasi.",
  },
  "template-website": {
    resource: RESOURCES.websitePengaturan,
    catatan: "Menu membuka tab Tampilan (template situs) di /pengaturan/desa?bagian=tampilan.",
  },
  "log-aktivitas": {
    resource: RESOURCES.auditLog,
  },
} as const satisfies Record<string, PemetaanResourceModul>;
