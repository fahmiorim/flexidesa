/**
 * Info halaman "Segera" untuk modul tenant yang halamannya belum dibangun penuh.
 *
 * Data ini hanya untuk presentasi: judul, grup menu, ringkasan fungsi yang
 * akan tersedia, dan rencana fitur. Halaman dinamis
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
  /** Acuan fitur. */
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
    padanan: "Arsip layanan (arsip surat dan layanan).",
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
    padanan: "Arsip desa.",
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
    padanan: "Modul pembangunan.",
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
    padanan: "Fitur impor data.",
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
    padanan: "Laporan manual.",
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
    padanan: "Laporan APBDes.",
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
    padanan: "Master analisis.",
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
    padanan: "Pengaturan analisis.",
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
    padanan: "Buku C.",
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
    padanan: "Daftar persil.",
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
    padanan: "Pengaturan peta.",
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
    padanan: "Kirim pesan.",
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
    padanan: "Daftar kontak.",
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
    padanan: "Pengaturan aplikasi.",
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
    padanan: "Manajemen modul.",
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
    padanan: "Pemeliharaan database.",
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
    padanan: "Info sistem.",
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
    padanan: "QR code.",
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
    padanan: "Optimasi gambar.",
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
    padanan: "Slider website.",
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
    padanan: "Menu website.",
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
    padanan: "Widget website.",
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
    padanan: "Komentar website.",
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
    padanan: "Media sosial.",
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
    padanan: "Teks berjalan.",
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
    padanan: "Statistik pengunjung.",
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
    padanan: "Kotak pesan.",
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
    padanan: "Pendaftar layanan mandiri.",
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
    padanan: "Gawai layanan.",
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
    padanan: "Pendapat warga.",
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
    padanan: "Pengaturan layanan mandiri.",
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
    padanan: "Daftar anjungan.",
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
    padanan: "Menu anjungan.",
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
    padanan: "Pengaturan anjungan.",
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
    padanan: "DTKS.",
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
    padanan: "Data tamu.",
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
    padanan: "Data kepuasan.",
    rencana: ["Rekap nilai kepuasan per layanan", "Grafik tren kepuasan", "Ekspor hasil survei"],
  },
  "data-pertanyaan": {
    judul: "Data Pertanyaan",
    grup: "Layanan Warga",
    ringkasan: "Pertanyaan warga yang masuk melalui kanal layanan desa.",
    padanan: "Data pertanyaan.",
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
    padanan: "Data keperluan.",
    rencana: [
      "Daftar keperluan terbanyak warga",
      "Kelompokkan per jenis layanan",
      "Ekspor rekap keperluan",
    ],
  },
  "opendk-pesan": {
    judul: "Pesan OpenDK",
    grup: "Pengaturan",
    ringkasan:
      "Pesan dari/ke OpenDK (Open Data Kabupaten): notifikasi dan antrean pesan sinkronisasi.",
    padanan: "Pesan OpenDK.",
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
    padanan: "Sinkronisasi OpenDK.",
    rencana: [
      "Atur URL dan kunci API OpenDK",
      "Jalankan sinkronisasi manual",
      "Riwayat sinkron dan log kegagalan",
    ],
  },
  "agenda-kegiatan": {
    judul: "Agenda Kegiatan",
    grup: "Administrasi Desa",
    ringkasan:
      "Agenda kegiatan desa: jadwal rapat, musyawarah, dan kegiatan resmi pemerintah desa.",
    padanan: "Agenda kegiatan.",
    rencana: [
      "Kalender kegiatan desa per bulan",
      "Tambah, ubah, dan batalkan agenda",
      "Tautkan agenda ke berita atau dokumen",
    ],
  },
};

/** Info Segera berdasarkan slug modul; `undefined` bila slug tidak dikenal. */
export function infoSegera(slug: string): InfoSegera | undefined {
  return SEGERA_INFO[slug];
}
