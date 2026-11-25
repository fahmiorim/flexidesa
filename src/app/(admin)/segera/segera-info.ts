/**
 * Info halaman "Segera" untuk modul tenant yang halamannya belum dibangun penuh.
 *
 * Data ini hanya untuk presentasi: judul, grup menu, ringkasan fungsi yang
 * akan tersedia, padanan OpenSID, dan rencana fitur. Halaman dinamis
 * `/segera/[slug]` me-render data ini; slug yang tidak ada di peta ini akan
 * mengembalikan 404. Test `template-tenant.test.ts` memastikan setiap modul
 * ber-URL `/segera/<slug>` memiliki entri di peta ini.
 */

export interface InfoSegera {
  /** Judul halaman (sama dengan nama modul di menu). */
  judul: string;
  /** Label grup menu induk di sidebar. */
  grup: string;
  /** Ringkasan fungsi yang akan tersedia di halaman ini. */
  ringkasan: string;
  /** Acuan fitur pada OpenSID. */
  padanan: string;
  /** Rencana kemampuan yang akan dibangun. */
  rencana: readonly string[];
}

export const SEGERA_INFO: Readonly<Record<string, InfoSegera>> = {
  "arsip-layanan": {
    judul: "Arsip Layanan",
    grup: "Persuratan",
    ringkasan:
      "Arsip layanan surat yang sudah diproses: riwayat permohonan, surat terbit, dan dokumen lampiran dalam satu tempat.",
    padanan: "Padanan arsip layanan pada OpenSID (arsip surat dan layanan).",
    rencana: [
      "Daftar arsip layanan dengan pencarian dan filter tahun/jenis surat",
      "Tautan ke detail surat, PDF, dan lampiran",
      "Ekspor CSV arsip layanan",
    ],
  },
  arsip: {
    judul: "Arsip Desa",
    grup: "Administrasi Desa",
    ringkasan:
      "Penyimpanan arsip desa: dokumen masuk, keluar, dan berkas administrasi yang dapat ditelusur kembali.",
    padanan: "Padanan arsip desa pada OpenSID.",
    rencana: [
      "Katalog arsip berdasarkan kategori dan tahun",
      "Unggah, unduh, dan hapus berkas arsip",
      "Pencarian arsip berdasarkan judul dan nomor",
    ],
  },
  pembangunan: {
    judul: "Pembangunan",
    grup: "Keuangan",
    ringkasan:
      "Pencatatan kegiatan pembangunan desa: usulan, tahapan, realisasi, dan foto dokumentasi.",
    padanan: "Padanan modul pembangunan pada OpenSID.",
    rencana: [
      "Daftar kegiatan pembangunan beserta status tahapan",
      "Catatan realisasi anggaran dan foto dokumentasi",
      "Laporan pembangunan untuk publik",
    ],
  },
  "impor-data": {
    judul: "Impor Data",
    grup: "Keuangan",
    ringkasan:
      "Impor data massal (mis. data keuangan atau penduduk) dari berkas CSV/Excel ke sistem.",
    padanan: "Padanan fitur impor data pada OpenSID.",
    rencana: [
      "Unggah berkas CSV/Excel dengan pratinjau data",
      "Pemetaan kolom dan validasi baris sebelum simpan",
      "Laporan baris berhasil/gagal diimpor",
    ],
  },
  "laporan-manual": {
    judul: "Laporan Manual",
    grup: "Keuangan",
    ringkasan:
      "Susun laporan keuangan manual di luar APBDes terstruktur, misalnya laporan kegiatan khusus.",
    padanan: "Padanan laporan manual pada OpenSID.",
    rencana: [
      "Buat laporan manual dari pos-pos anggaran bebas",
      "Lampirkan dokumen pendukung",
      "Cetak dan ekspor laporan",
    ],
  },
  "laporan-apbdes": {
    judul: "Laporan APBDes",
    grup: "Keuangan",
    ringkasan: "Laporan APBDes dan realisasi anggaran yang disusun dari data keuangan desa.",
    padanan: "Padanan laporan APBDes pada OpenSID.",
    rencana: [
      "Laporan APBDes per tahun anggaran dan per bidang",
      "Perbandingan anggaran vs realisasi",
      "Ekspor PDF dan CSV untuk pelaporan ke kecamatan",
    ],
  },
  "master-analisis": {
    judul: "Master Analisis",
    grup: "Analisis",
    ringkasan: "Master data untuk analisis: indikator, kategori, dan bobot perhitungan IDM/SDGs.",
    padanan: "Padanan master analisis pada OpenSID.",
    rencana: [
      "Kelola indikator dan kategori analisis",
      "Atur bobot dan rumus perhitungan",
      "Riwayat perubahan master",
    ],
  },
  "pengaturan-analisis": {
    judul: "Pengaturan Analisis",
    grup: "Analisis",
    ringkasan:
      "Pengaturan periode, status aktif, dan ambang nilai untuk perhitungan analisis desa.",
    padanan: "Padanan pengaturan analisis pada OpenSID.",
    rencana: [
      "Atur periode analisis aktif",
      "Ubah ambang kategori status desa",
      "Hitung ulang status desa dari data terbaru",
    ],
  },
  "c-desa": {
    judul: "C-Desa",
    grup: "Pertanahan & GIS",
    ringkasan: "Buku C desa: pendaftaran tanah milik desa beserta riwayat perubahannya.",
    padanan: "Padanan buku C pada OpenSID.",
    rencana: [
      "Daftar bidang tanah milik desa (C-Desa)",
      "Riwayat mutasi dan perubahan kepemilikan",
      "Cetak buku C per dusun/wilayah",
    ],
  },
  "daftar-persil": {
    judul: "Daftar Persil",
    grup: "Pertanahan & GIS",
    ringkasan: "Daftar persil (bidang tanah) warga beserta pemilik, luas, dan status sertifikat.",
    padanan: "Padanan daftar persil pada OpenSID.",
    rencana: [
      "Daftar persil dengan pemilik dan luas bidang",
      "Filter per dusun, kelas tanah, dan status sertifikat",
      "Impor dan ekspor data persil",
    ],
  },
  "pengaturan-peta": {
    judul: "Pengaturan Peta",
    grup: "Pertanahan & GIS",
    ringkasan: "Pengaturan tampilan dan lapisan peta desa pada halaman peta.",
    padanan: "Padanan pengaturan peta pada OpenSID.",
    rencana: [
      "Atur titik pusat dan zoom awal peta",
      "Kelola lapisan batas wilayah dan titik penting",
      "Pratinjau peta sebelum disimpan",
    ],
  },
  "pesan-warga": {
    judul: "Kirim Pesan",
    grup: "Layanan Warga",
    ringkasan: "Kirim pesan massal atau perorangan ke warga melalui kanal yang tersedia.",
    padanan: "Padanan kirim pesan pada OpenSID.",
    rencana: [
      "Komposisi pesan massal ke grup warga atau perorangan",
      "Riwayat pesan terkirim dan statusnya",
      "Template pesan siap pakai",
    ],
  },
  "daftar-kontak": {
    judul: "Daftar Kontak",
    grup: "Layanan Warga",
    ringkasan:
      "Daftar kontak warga dan perangkat desa untuk keperluan pengiriman pesan dan pengumuman.",
    padanan: "Padanan daftar kontak pada OpenSID.",
    rencana: [
      "Daftar kontak dengan nomor HP dan kategori",
      "Tambah, ubah, dan hapus kontak",
      "Kelompokkan kontak untuk pengiriman massal",
    ],
  },
  "pengaturan-aplikasi": {
    judul: "Aplikasi",
    grup: "Pengaturan",
    ringkasan: "Pengaturan umum aplikasi: identitas aplikasi, logo, dan opsi tampilan admin.",
    padanan: "Padanan pengaturan aplikasi pada OpenSID.",
    rencana: [
      "Ubah nama dan logo aplikasi",
      "Atur tema dan tampilan admin",
      "Simpan pengaturan per desa",
    ],
  },
  modul: {
    judul: "Modul",
    grup: "Pengaturan",
    ringkasan: "Aktif/nonaktifkan modul per desa sesuai paket langganan.",
    padanan: "Padanan manajemen modul pada OpenSID.",
    rencana: [
      "Daftar modul beserta status aktifnya",
      "Aktif/nonaktifkan modul sesuai paket",
      "Sinkronisasi menu sidebar setelah perubahan",
    ],
  },
  database: {
    judul: "Database",
    grup: "Pengaturan",
    ringkasan: "Pemeliharaan database desa: cadangan, optimasi, dan pemeriksaan integritas data.",
    padanan: "Padanan pemeliharaan database pada OpenSID.",
    rencana: [
      "Cadangkan database desa",
      "Optimasi dan periksa tabel",
      "Riwayat cadangan dan pemulihan",
    ],
  },
  "info-sistem": {
    judul: "Info Sistem",
    grup: "Pengaturan",
    ringkasan: "Informasi sistem: versi aplikasi, kebutuhan server, dan status layanan.",
    padanan: "Padanan info sistem pada OpenSID.",
    rencana: [
      "Tampilkan versi aplikasi dan environment",
      "Status koneksi database dan layanan pendukung",
      "Informasi kebutuhan server minimum",
    ],
  },
  "qr-code": {
    judul: "QR Code",
    grup: "Pengaturan",
    ringkasan: "Buat dan kelola QR code untuk tautan dan layanan desa.",
    padanan: "Padanan QR code pada OpenSID.",
    rencana: [
      "Buat QR code untuk URL dan teks bebas",
      "Unduh QR code sebagai gambar",
      "Daftar QR code yang pernah dibuat",
    ],
  },
  "optimasi-gambar": {
    judul: "Optimasi Gambar",
    grup: "Pengaturan",
    ringkasan: "Optimasi ukuran berkas gambar yang diunggah ke website desa.",
    padanan: "Padanan optimasi gambar pada OpenSID.",
    rencana: [
      "Kompresi gambar massal pada galeri dan konten",
      "Atur kualitas dan ukuran maksimum",
      "Laporan penghematan ukuran berkas",
    ],
  },
  slider: {
    judul: "Slider",
    grup: "Info Desa",
    ringkasan: "Kelola gambar slider pada beranda website desa.",
    padanan: "Padanan slider website pada OpenSID.",
    rencana: [
      "Tambah, ubah, dan urutkan slide",
      "Atur judul, tautan, dan durasi tampil",
      "Pratinjau slider pada website",
    ],
  },
  "menu-publik": {
    judul: "Menu Website",
    grup: "Info Desa",
    ringkasan: "Susun menu navigasi website publik desa.",
    padanan: "Padanan menu website pada OpenSID.",
    rencana: [
      "Tambah dan urutkan menu website",
      "Atur tautan internal atau eksternal",
      "Sembunyikan menu yang tidak perlu tampil",
    ],
  },
  widget: {
    judul: "Widget",
    grup: "Info Desa",
    ringkasan: "Kelola widget pada website desa, misalnya statistik, pengumuman, dan tautan cepat.",
    padanan: "Padanan widget website pada OpenSID.",
    rencana: [
      "Aktif/nonaktifkan widget per posisi",
      "Atur isi dan urutan widget",
      "Pratinjau widget pada website",
    ],
  },
  komentar: {
    judul: "Komentar",
    grup: "Info Desa",
    ringkasan: "Moderasi komentar warga pada berita dan konten website.",
    padanan: "Padanan komentar website pada OpenSID.",
    rencana: [
      "Daftar komentar berdasarkan konten",
      "Setujui, tolak, atau hapus komentar",
      "Notifikasi komentar baru",
    ],
  },
  "media-sosial": {
    judul: "Media Sosial",
    grup: "Info Desa",
    ringkasan: "Atur tautan media sosial resmi desa yang tampil di website.",
    padanan: "Padanan media sosial pada OpenSID.",
    rencana: [
      "Tambah tautan media sosial desa",
      "Atur ikon dan urutan tampil",
      "Pratinjau pada website publik",
    ],
  },
  "teks-berjalan": {
    judul: "Teks Berjalan",
    grup: "Info Desa",
    ringkasan: "Kelola teks berjalan (running text) pengumuman pada website desa.",
    padanan: "Padanan teks berjalan pada OpenSID.",
    rencana: [
      "Tambah dan urutkan teks pengumuman",
      "Atur kecepatan dan status tampil",
      "Pratinjau teks pada website",
    ],
  },
  pengunjung: {
    judul: "Pengunjung",
    grup: "Info Desa",
    ringkasan: "Statistik kunjungan website desa: harian, bulanan, dan halaman terpopuler.",
    padanan: "Padanan statistik pengunjung pada OpenSID.",
    rencana: [
      "Grafik kunjungan harian dan bulanan",
      "Halaman dan asal kunjungan terbanyak",
      "Ekspor laporan pengunjung",
    ],
  },
  "kotak-pesan": {
    judul: "Kotak Pesan",
    grup: "Layanan Warga",
    ringkasan: "Pesan masuk dari warga melalui formulir website desa.",
    padanan: "Padanan kotak pesan pada OpenSID.",
    rencana: [
      "Daftar pesan masuk beserta pengirimnya",
      "Balas atau tandai pesan selesai",
      "Pencarian dan arsip pesan",
    ],
  },
  "pendaftar-layanan-mandiri": {
    judul: "Pendaftar Layanan Mandiri",
    grup: "Layanan Warga",
    ringkasan: "Daftar warga yang mendaftar layanan mandiri (akses mandiri warga).",
    padanan: "Padanan pendaftar layanan mandiri pada OpenSID.",
    rencana: [
      "Daftar pendaftar beserta status aktifnya",
      "Setujui atau tolak pendaftaran baru",
      "Blokir dan aktifkan kembali akun warga",
    ],
  },
  "gawai-layanan": {
    judul: "Gawai Layanan",
    grup: "Layanan Warga",
    ringkasan: "Kelola perangkat (gawai) yang terdaftar untuk layanan mandiri warga.",
    padanan: "Padanan gawai layanan pada OpenSID.",
    rencana: [
      "Daftar perangkat terdaftar per warga",
      "Lepas perangkat yang tidak lagi dipakai",
      "Riwayat aktivitas perangkat",
    ],
  },
  pendapat: {
    judul: "Pendapat",
    grup: "Layanan Warga",
    ringkasan: "Pendapat dan masukan warga dari survei kepuasan layanan.",
    padanan: "Padanan pendapat warga pada OpenSID.",
    rencana: [
      "Daftar pendapat beserta kategori layanan",
      "Rekap penilaian kepuasan",
      "Ekspor data pendapat",
    ],
  },
  "pengaturan-layanan-mandiri": {
    judul: "Pengaturan Layanan Mandiri",
    grup: "Layanan Warga",
    ringkasan: "Pengaturan fitur layanan mandiri: pendaftaran terbuka, syarat, dan tampilan.",
    padanan: "Padanan pengaturan layanan mandiri pada OpenSID.",
    rencana: [
      "Buka/tutup pendaftaran layanan mandiri",
      "Atur syarat dan pesan pendaftaran",
      "Atur layanan yang dapat diakses warga",
    ],
  },
  "daftar-anjungan": {
    judul: "Daftar Anjungan",
    grup: "Anjungan",
    ringkasan: "Daftar anjungan mandiri (kiosk) yang terhubung ke sistem desa.",
    padanan: "Padanan daftar anjungan pada OpenSID.",
    rencana: [
      "Daftar anjungan beserta lokasi dan status",
      "Tambah dan hapus anjungan",
      "Pantau anjungan aktif",
    ],
  },
  "anjungan-menu": {
    judul: "Menu Anjungan",
    grup: "Anjungan",
    ringkasan: "Susun menu layanan yang tampil di anjungan mandiri.",
    padanan: "Padanan menu anjungan pada OpenSID.",
    rencana: [
      "Pilih layanan yang tampil di anjungan",
      "Urutan dan ikon menu anjungan",
      "Pratinjau menu anjungan",
    ],
  },
  "pengaturan-anjungan": {
    judul: "Pengaturan Anjungan",
    grup: "Anjungan",
    ringkasan: "Pengaturan umum anjungan: layar sentuh, mode kiosk, dan identitas desa.",
    padanan: "Padanan pengaturan anjungan pada OpenSID.",
    rencana: [
      "Atur mode layar anjungan",
      "Identitas dan logo pada anjungan",
      "Batas waktu sesi anjungan",
    ],
  },
  dtks: {
    judul: "DTKS",
    grup: "Data Desa",
    ringkasan:
      "Data Terpadu Kesejahteraan Sosial: penerima bantuan beserta kelayakan dan riwayatnya.",
    padanan: "Padanan DTKS pada OpenSID.",
    rencana: [
      "Daftar penerima DTKS dengan kategori",
      "Verifikasi kelayakan penerima",
      "Impor dan ekspor data DTKS",
    ],
  },
  "data-tamu": {
    judul: "Data Tamu",
    grup: "Layanan Warga",
    ringkasan: "Data buku tamu digital: tamu yang berkunjung dan keperluan kunjungannya.",
    padanan: "Padanan data tamu pada OpenSID.",
    rencana: [
      "Daftar tamu beserta keperluan kunjungan",
      "Statistik kunjungan per hari/bulan",
      "Ekspor data tamu",
    ],
  },
  "data-kepuasan": {
    judul: "Data Kepuasan",
    grup: "Layanan Warga",
    ringkasan: "Hasil survei kepuasan layanan desa dari warga dan pengunjung.",
    padanan: "Padanan data kepuasan pada OpenSID.",
    rencana: ["Rekap nilai kepuasan per layanan", "Grafik tren kepuasan", "Ekspor hasil survei"],
  },
  "data-pertanyaan": {
    judul: "Data Pertanyaan",
    grup: "Layanan Warga",
    ringkasan: "Pertanyaan warga yang masuk melalui kanal layanan desa.",
    padanan: "Padanan data pertanyaan pada OpenSID.",
    rencana: [
      "Daftar pertanyaan beserta kategori",
      "Tandai pertanyaan terjawab/belum",
      "Ekspor data pertanyaan",
    ],
  },
  "data-keperluan": {
    judul: "Data Keperluan",
    grup: "Layanan Warga",
    ringkasan: "Data keperluan warga yang tercatat dari layanan dan kunjungan.",
    padanan: "Padanan data keperluan pada OpenSID.",
    rencana: [
      "Daftar keperluan terbanyak warga",
      "Kelompokkan per jenis layanan",
      "Ekspor rekap keperluan",
    ],
  },
  bantuan: {
    judul: "Bantuan Sosial",
    grup: "Program & Data Desa",
    ringkasan: "Penyaluran bantuan sosial: penerima, jenis bantuan, dan status penyaluran.",
    padanan: "Padanan bantuan sosial pada OpenSID.",
    rencana: [
      "Daftar program bantuan dan penerimanya",
      "Catat penyaluran dan tanda terima",
      "Laporan penyaluran per program",
    ],
  },
  lapak: {
    judul: "Lapak Desa",
    grup: "Layanan Warga",
    ringkasan: "Katalog produk UMKM desa (Lapak) untuk dipublikasikan di website.",
    padanan: "Padanan Lapak pada OpenSID.",
    rencana: [
      "Daftar produk UMKM beserta harga dan foto",
      "Kategori produk dan pemilik usaha",
      "Tampilkan produk terpilih di website",
    ],
  },
  "opendk-pesan": {
    judul: "Pesan OpenDK",
    grup: "Pengaturan",
    ringkasan:
      "Pesan dari/ke OpenDK (Open Data Kabupaten): notifikasi dan antrean pesan sinkronisasi.",
    padanan: "Padanan pesan OpenDK pada OpenSID.",
    rencana: [
      "Daftar pesan sinkronisasi OpenDK",
      "Status terkirim dan kegagalan",
      "Kirim ulang pesan gagal",
    ],
  },
  "opendk-sinkronisasi": {
    judul: "Sinkronisasi OpenDK",
    grup: "Pengaturan",
    ringkasan: "Sinkronisasi data desa ke OpenDK: konfigurasi server dan riwayat sinkron.",
    padanan: "Padanan sinkronisasi OpenDK pada OpenSID.",
    rencana: [
      "Atur URL dan kunci API OpenDK",
      "Jalankan sinkronisasi manual",
      "Riwayat sinkron dan log kegagalan",
    ],
  },
  "buku-administrasi-pembangunan": {
    judul: "Buku Administrasi Pembangunan",
    grup: "Administrasi Desa",
    ringkasan:
      "Buku administrasi pembangunan desa: rencana, pelaksanaan, dan hasil kegiatan beserta dokumentasinya.",
    padanan: "Padanan Buku C (Administrasi Pembangunan) pada OpenSID.",
    rencana: [
      "Daftar buku pembangunan beserta kolom isian baku",
      "Catat kegiatan, anggaran, dan realisasi per buku",
      "Cetak buku administrasi pembangunan",
    ],
  },
  "agenda-kegiatan": {
    judul: "Agenda Kegiatan",
    grup: "Administrasi Desa",
    ringkasan:
      "Agenda kegiatan desa: jadwal rapat, musyawarah, dan kegiatan resmi pemerintah desa.",
    padanan: "Padanan agenda kegiatan pada OpenSID.",
    rencana: [
      "Kalender kegiatan desa per bulan",
      "Tambah, ubah, dan batalkan agenda",
      "Tautkan agenda ke berita atau dokumen",
    ],
  },
  pendapatan: {
    judul: "Pendapatan",
    grup: "Keuangan Desa",
    ringkasan:
      "Rincian pendapatan desa per sumber dan jenis: dana desa, alokasi, bagi hasil, dan pendapatan asli desa.",
    padanan: "Padanan rincian pendapatan pada APBDes OpenSID.",
    rencana: [
      "Daftar sumber pendapatan beserta target dan realisasi",
      "Tambah dan ubah rincian pendapatan per tahun",
      "Ekspor rincian pendapatan",
    ],
  },
  belanja: {
    judul: "Belanja",
    grup: "Keuangan Desa",
    ringkasan: "Rincian belanja desa per bidang dan kegiatan beserta pagu anggarannya.",
    padanan: "Padanan rincian belanja pada APBDes OpenSID.",
    rencana: [
      "Daftar belanja per bidang dan kegiatan",
      "Atur pagu dan sumber dana",
      "Pantau realisasi belanja",
    ],
  },
  pembiayaan: {
    judul: "Pembiayaan",
    grup: "Keuangan Desa",
    ringkasan: "Rincian pembiayaan desa: penerimaan pembiayaan dan pengeluaran pembiayaan.",
    padanan: "Padanan rincian pembiayaan pada APBDes OpenSID.",
    rencana: [
      "Catat penerimaan dan pengeluaran pembiayaan",
      "Hubungkan pembiayaan dengan SILPA",
      "Laporan pembiayaan per tahun",
    ],
  },
  penatausahaan: {
    judul: "Penatausahaan",
    grup: "Keuangan Desa",
    ringkasan:
      "Penatausahaan keuangan desa: pencatatan transaksi harian, bukti, dan buku pembantu.",
    padanan: "Padanan penatausahaan keuangan pada OpenSID.",
    rencana: [
      "Catat transaksi harian dengan bukti pendukung",
      "Buku pembantu pajak dan bank",
      "Tutup buku akhir bulan",
    ],
  },
  "buku-kas-umum": {
    judul: "Buku Kas Umum",
    grup: "Keuangan Desa",
    ringkasan: "Buku Kas Umum (BKU): arus penerimaan dan pengeluaran kas desa secara kronologis.",
    padanan: "Padanan Buku Kas Umum pada OpenSID.",
    rencana: [
      "Daftar transaksi kas berurutan dengan saldo berjalan",
      "Filter per bulan dan sumber dana",
      "Cetak dan ekspor BKU",
    ],
  },
  "perencanaan-pembangunan": {
    judul: "Perencanaan Pembangunan",
    grup: "Pembangunan & Aset",
    ringkasan: "Perencanaan pembangunan desa: usulan warga, musyawarah, dan prioritas kegiatan.",
    padanan: "Padanan perencanaan pembangunan pada OpenSID.",
    rencana: [
      "Daftar usulan pembangunan beserta status verifikasi",
      "Susun prioritas kegiatan per tahun",
      "Tautkan usulan ke kegiatan dan anggaran",
    ],
  },
  "proyek-desa": {
    judul: "Proyek Desa",
    grup: "Pembangunan & Aset",
    ringkasan: "Proyek desa: paket pekerjaan, pelaksana, nilai kontrak, dan progres pembangunan.",
    padanan: "Padanan proyek desa pada OpenSID.",
    rencana: [
      "Daftar paket proyek beserta pelaksana",
      "Pantau progres dan serapan anggaran",
      "Dokumentasi foto 0/50/100 persen",
    ],
  },
  "aset-desa": {
    judul: "Aset Desa",
    grup: "Pembangunan & Aset",
    ringkasan:
      "Aset desa: tanah, bangunan, peralatan, dan aset tidak berwujud beserta nilai dan kondisinya.",
    padanan: "Padanan aset desa pada OpenSID.",
    rencana: [
      "Daftar aset per golongan dengan nilai perolehan",
      "Catat kondisi dan lokasi aset",
      "Laporan aset per tahun",
    ],
  },
  "peta-wilayah": {
    judul: "Peta Wilayah",
    grup: "Pertanahan & GIS",
    ringkasan: "Peta wilayah desa: batas dusun, RW, dan RT beserta luas dan jumlah penduduknya.",
    padanan: "Padanan peta wilayah pada OpenSID.",
    rencana: [
      "Tampilkan batas wilayah per dusun/RW/RT",
      "Klik wilayah untuk melihat ringkasan data",
      "Ekspor peta wilayah",
    ],
  },
  "data-pertanahan": {
    judul: "Data Pertanahan",
    grup: "Pertanahan & GIS",
    ringkasan: "Data pertanahan desa: bidang tanah, pemilik, luas, dan status kepemilikan.",
    padanan: "Padanan data pertanahan (C-Desa dan persil) pada OpenSID.",
    rencana: [
      "Daftar bidang tanah beserta pemilik dan luas",
      "Catat mutasi hak dan riwayat kepemilikan",
      "Cetak buku tanah per dusun",
    ],
  },
  "batas-wilayah": {
    judul: "Batas Wilayah",
    grup: "Pertanahan & GIS",
    ringkasan: "Batas desa dan batas antarwilayah beserta dokumen peta batas yang disepakati.",
    padanan: "Padanan batas wilayah pada OpenSID.",
    rencana: [
      "Gambar dan simpan garis batas desa",
      "Catat titik patok batas dan koordinatnya",
      "Unggah berita acara batas wilayah",
    ],
  },
  "peta-penduduk": {
    judul: "Peta Penduduk",
    grup: "Pertanahan & GIS",
    ringkasan: "Sebaran penduduk pada peta: titik rumah, kepadatan, dan persebaran per wilayah.",
    padanan: "Padanan peta penduduk pada OpenSID.",
    rencana: [
      "Tampilkan titik rumah penduduk pada peta",
      "Peta kepadatan penduduk per wilayah",
      "Filter sebaran berdasarkan kategori",
    ],
  },
  "data-penerima-bantuan": {
    judul: "Data Penerima Bantuan",
    grup: "Program & Data Desa",
    ringkasan:
      "Data penerima bantuan sosial beserta program, kriteria kelayakan, dan status penyaluran.",
    padanan: "Padanan data penerima bantuan (DTKS) pada OpenSID.",
    rencana: [
      "Daftar penerima per program bantuan",
      "Verifikasi kelayakan dan usulan penerima",
      "Impor dan ekspor data penerima",
    ],
  },
  "statistik-program-desa": {
    judul: "Statistik Program Desa",
    grup: "Program & Data Desa",
    ringkasan:
      "Statistik program dan kegiatan desa: penerima manfaat, cakupan, dan capaian program.",
    padanan: "Padanan statistik program desa pada OpenSID.",
    rencana: [
      "Rekap penerima manfaat per program",
      "Grafik capaian program per tahun",
      "Ekspor laporan statistik program",
    ],
  },
  "aspirasi-warga": {
    judul: "Aspirasi Warga",
    grup: "Layanan Warga",
    ringkasan:
      "Aspirasi dan usulan warga yang masuk melalui website desa beserta tindak lanjutnya.",
    padanan: "Padanan aspirasi warga pada OpenSID.",
    rencana: [
      "Daftar aspirasi beserta pengirim dan kategori",
      "Tandai status tindak lanjut",
      "Publikasikan aspirasi terpilih di website",
    ],
  },
  integrasi: {
    judul: "Integrasi",
    grup: "Pengaturan",
    ringkasan: "Integrasi layanan pihak ketiga: OpenDK, layanan pesan, pembayaran, dan API desa.",
    padanan: "Padanan pengaturan integrasi pada OpenSID.",
    rencana: [
      "Atur kunci API layanan eksternal",
      "Uji koneksi dan lihat status integrasi",
      "Riwayat sinkronisasi antar layanan",
    ],
  },
  "template-website": {
    judul: "Template Website",
    grup: "Pengaturan",
    ringkasan: "Pilih dan atur template tampilan website desa yang dipakai halaman publik.",
    padanan: "Padanan template website pada OpenSID.",
    rencana: [
      "Pilih template aktif untuk website desa",
      "Pratinjau template sebelum diterapkan",
      "Atur warna dan identitas visual template",
    ],
  },
};

/** Info Segera berdasarkan slug modul; `undefined` bila slug tidak dikenal. */
export function infoSegera(slug: string): InfoSegera | undefined {
  return SEGERA_INFO[slug];
}
