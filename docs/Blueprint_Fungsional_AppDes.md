# Blueprint Fungsional AppDes

## Spesifikasi Menu, Submenu, Fungsi, dan Isi Data

**Versi:** 1.0\
**Tanggal:** 26 November 2026\
**Status:** Rancangan awal untuk acuan pengembangan

------------------------------------------------------------------------

## Tujuan Dokumen

Dokumen ini menjadi acuan fungsional struktur navigasi AppDes. Setiap
menu dan submenu dijelaskan berdasarkan:

1.  **Fungsi** --- tujuan penggunaan modul.
2.  **Isi data** --- informasi yang ditampilkan atau dikelola.
3.  **Fitur operasional** --- tindakan yang dapat dilakukan pengguna.
4.  **Keterkaitan** --- hubungan dengan modul lain dan website publik.

Prinsip utama pengembangan:

-   Satu sumber data utama untuk menghindari duplikasi.
-   Data induk dipisahkan dari data transaksi.
-   Laporan dan statistik dihitung dari data sumber.
-   Hak akses mengikuti peran dan kewenangan pengguna.
-   Data setiap desa (tenant) harus terisolasi.
-   Website publik hanya menampilkan informasi yang telah dipublikasikan
    dan aman untuk umum.

# 1. Beranda

**Fungsi:** Menampilkan gambaran umum kondisi desa dan aktivitas
administrasi secara cepat.

  Komponen             Isi / Informasi
  -------------------- --------------------------------------------
  Statistik Penduduk   Total penduduk, laki-laki, perempuan
  Statistik Keluarga   Total KK, keluarga miskin, keluarga rentan
  Statistik Wilayah    Dusun, RW, RT
  Pelayanan Surat      Permohonan baru, diproses, selesai
  Kehadiran            Perangkat hadir, izin, sakit, alpa
  Pengaduan            Pengaduan masuk dan belum ditangani
  Keuangan             Anggaran dan realisasi APBDes
  Pembangunan          Jumlah kegiatan dan progres
  Grafik Penduduk      Pertumbuhan, umur, pendidikan
  Aktivitas Terbaru    Riwayat perubahan dan transaksi
  Agenda               Jadwal kegiatan desa

**Fitur operasional:**

-   Filter periode dan kategori statistik.
-   Klik kartu untuk membuka detail modul.
-   Unduh laporan.
-   Notifikasi pekerjaan yang membutuhkan tindakan.
-   Ringkasan aktivitas sesuai hak akses pengguna.

# 2. Profil & Website Desa

**Fungsi:** Mengelola identitas desa, informasi pemerintahan, dan
seluruh konten yang ditampilkan di website publik desa.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Identitas Desa                      Nama desa, kode desa, alamat, logo,
                                      foto kantor, sejarah, visi, misi,
                                      sambutan kepala desa, kontak

  Wilayah Administratif               Dusun, RW, RT, kode wilayah, nama
                                      kepala dusun, ketua RW, ketua RT

  Pemerintah Desa                     Kepala desa, sekretaris desa, kaur,
                                      kasi, kepala dusun, jabatan, foto,
                                      periode jabatan, SK pengangkatan

  Lembaga Desa                        BPD, PKK, Karang Taruna, LPM,
                                      Posyandu, Linmas, pengurus,
                                      anggota, SK, masa jabatan

  Status Desa                         IDM, status perkembangan desa,
                                      indeks ketahanan sosial, ekonomi,
                                      lingkungan, tahun penilaian

  Berita                              Judul, kategori, isi berita, foto
                                      sampul, penulis, tanggal publikasi,
                                      status tayang

  Galeri                              Album foto, foto kegiatan, video,
                                      kategori, tanggal, keterangan

  Dokumen & Informasi Publik          Peraturan desa, SK, APBDes, laporan
                                      realisasi, dokumen publik,
                                      kategori, tahun, file

  Pengaturan Website                  Logo, favicon, warna tema,
                                      template, banner, slider, menu
                                      navigasi, footer, SEO, domain,
                                      halaman statis
  -----------------------------------------------------------------------

**Fitur operasional:**

-   Tambah, lihat, ubah, dan hapus data sesuai kebutuhan.
-   Upload foto dan dokumen.
-   Preview website sebelum publikasi.
-   Publikasi dan penjadwalan berita.
-   Pengelolaan template website.
-   Pengaturan halaman publik.
-   Pengelolaan SEO dan metadata.

**Keterkaitan:** Data pemerintah desa, wilayah, berita, galeri, dan
dokumen dapat ditampilkan di website publik tanpa input ulang.

# 3. Kependudukan

**Fungsi:** Menjadi pusat pengelolaan seluruh data penduduk, keluarga,
dan kondisi sosial masyarakat.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Penduduk                            NIK, nomor KK, nama, tempat/tanggal
                                      lahir, jenis kelamin, agama,
                                      pendidikan, pekerjaan, status
                                      perkawinan, golongan darah, alamat,
                                      status hidup, status kependudukan

  Keluarga                            Nomor KK, kepala keluarga, anggota
                                      keluarga, alamat, dusun, status
                                      keluarga, tanggal pembentukan

  Rumah Tangga                        Unit tempat tinggal, alamat,
                                      koordinat, jenis bangunan, status
                                      kepemilikan, kondisi rumah, jumlah
                                      penghuni

  Kelompok                            Kelompok masyarakat, nama kelompok,
                                      jenis kelompok, ketua, anggota,
                                      alamat, tanggal pembentukan

  Data Suplemen                       Data tambahan berdasarkan kebutuhan
                                      desa, jenis data, kategori,
                                      formulir, atribut, nilai, tahun
                                      pendataan

  Calon Pemilih                       Data pemilih potensial, NIK, nama,
                                      umur, alamat, TPS, status pemilih,
                                      tahun pemilihan

  Data Stunting                       Data balita, tanggal lahir, jenis
                                      kelamin, berat badan, tinggi badan,
                                      hasil pengukuran, tanggal
                                      pemeriksaan, status pemantauan

  Statistik Kependudukan              Statistik umur, jenis kelamin,
                                      pendidikan, pekerjaan, agama,
                                      perkawinan, kelompok umur,
                                      pertumbuhan penduduk

  Laporan Penduduk                    Penduduk lahir, meninggal, pindah,
                                      datang, penduduk berdasarkan
                                      wilayah dan kategori

  Laporan Bulanan                     Rekap penduduk awal bulan,
                                      kelahiran, kematian, pindah,
                                      datang, total akhir bulan

  Laporan Kelompok Rentan             Lansia, penyandang disabilitas,
                                      anak, perempuan rentan, keluarga
                                      miskin, dan kategori kerentanan
                                      lainnya
  -----------------------------------------------------------------------

**Fitur operasional:**

-   Tambah, ubah, dan hapus dengan kontrol integritas data.
-   Import dan export Excel.
-   Pencarian NIK, nama, dan nomor KK.
-   Riwayat perubahan biodata.
-   Mutasi penduduk.
-   Pecah KK dan gabung KK.
-   Cetak biodata dan dokumen administrasi desa (bukan pengganti dokumen
    Dukcapil).
-   Deteksi data ganda.
-   Filter berdasarkan dusun, RT, dan RW.
-   Pembuatan laporan otomatis.

**Catatan model data:**

Keluarga dan Rumah Tangga adalah dua entitas berbeda. Keluarga
mengelompokkan anggota berdasarkan hubungan administrasi Kartu Keluarga,
sedangkan Rumah Tangga mengelompokkan orang berdasarkan unit tempat
tinggal. Satu rumah dapat dihuni lebih dari satu keluarga.

# 4. Pelayanan & Persuratan

**Fungsi:** Mengelola proses pelayanan administrasi surat kepada
masyarakat, mulai dari permohonan hingga penerbitan dokumen.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Permohonan Surat                    Formulir permohonan, penduduk
                                      pemohon, jenis surat, keperluan,
                                      persyaratan, tanggal pengajuan,
                                      status

  Daftar Surat                        Daftar surat yang pernah dibuat,
                                      nomor surat, pemohon, jenis,
                                      tanggal, status

  Pengaturan Surat                    Template surat, format penomoran,
                                      kop surat, tanda tangan, pejabat
                                      penandatangan

  Daftar Persyaratan                  Jenis surat, dokumen wajib, dokumen
                                      opsional, keterangan persyaratan

  Klasifikasi Surat                   Kategori surat, kode klasifikasi,
                                      jenis dokumen, aturan penomoran

  Cetak Surat                         Preview, generate PDF, cetak, QR
                                      Code, tanda tangan elektronik jika
                                      terintegrasi

  Surat Masuk                         Nomor surat, tanggal diterima, asal
                                      surat, perihal, lampiran,
                                      disposisi, status

  Surat Keluar                        Nomor surat, tujuan, perihal,
                                      tanggal, penandatangan, lampiran

  Surat Dinas                         Surat undangan, surat tugas, surat
                                      perjalanan dinas, nota dinas,
                                      berita acara, dan dokumen kedinasan
                                      lainnya
  -----------------------------------------------------------------------

**Alur pelayanan surat:**

1.  **Permohonan:** Warga mengajukan surat melalui website atau operator
    desa.
2.  **Verifikasi:** Operator memeriksa identitas dan persyaratan.
3.  **Persetujuan:** Pejabat berwenang menyetujui permohonan.
4.  **Penerbitan:** Sistem menghasilkan surat berdasarkan template.
5.  **Penandatanganan:** Surat ditandatangani pejabat berwenang.
6.  **Penyerahan:** Surat diserahkan atau diunduh pemohon dan
    diarsipkan.

**Fitur operasional:**

-   Nomor surat otomatis.
-   Template dinamis.
-   QR Code verifikasi.
-   Riwayat permohonan.
-   Notifikasi status kepada warga.
-   Arsip PDF.
-   Disposisi surat masuk.

# 5. Kehadiran & Kepegawaian

**Fungsi:** Mengelola data perangkat desa, kedisiplinan, kehadiran, dan
administrasi izin kerja.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Data Perangkat Desa                 Nama, NIK, jabatan, NIP jika ada,
                                      alamat, nomor HP, foto, tanggal
                                      mulai menjabat, status aktif

  Kehadiran                           Tanggal, jam masuk, jam pulang,
                                      lokasi, metode absensi, status
                                      kehadiran

  Rekapitulasi Kehadiran              Total hadir, terlambat, izin,
                                      sakit, alpa, persentase kehadiran

  Pengajuan Izin                      Nama perangkat, jenis izin, tanggal
                                      mulai, tanggal selesai, alasan,
                                      lampiran

  Persetujuan Izin                    Daftar permohonan, pejabat pemberi
                                      persetujuan, status, catatan

  Hari Libur                          Tanggal, nama hari libur, jenis
                                      libur, keterangan

  Jam Kerja                           Hari kerja, jam masuk, jam pulang,
                                      toleransi keterlambatan

  Alasan Keluar                       Nama perangkat, tanggal, jam
                                      keluar, keperluan, tujuan,
                                      persetujuan atasan
  -----------------------------------------------------------------------

**Fitur operasional:**

-   Absensi manual atau QR Code.
-   Absensi berbasis lokasi GPS jika diperlukan.
-   Rekap otomatis bulanan.
-   Deteksi keterlambatan.
-   Pengajuan izin.
-   Persetujuan berjenjang.
-   Cetak laporan kehadiran.
-   Riwayat kedisiplinan.

**Catatan:** Data Perangkat Desa pada modul ini harus menggunakan sumber
data yang sama dengan Pemerintah Desa di Profil & Website. Hindari dua
database perangkat desa yang berbeda.

# 6. Administrasi Desa

**Fungsi:** Mengelola administrasi pemerintahan desa dan pencatatan
kegiatan secara tertib sesuai kebutuhan administrasi desa.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Buku Administrasi Umum              Buku Peraturan Desa, Keputusan
                                      Kepala Desa, Inventaris Kekayaan
                                      Desa (rujukan), Aparat Pemerintah
                                      Desa, Tanah Kas Desa, Agenda,
                                      Ekspedisi, dan Lembaran Desa

  Buku Administrasi Penduduk          Buku Induk Penduduk, Mutasi
                                      Penduduk, Rekapitulasi Penduduk,
                                      dan data penduduk sementara

  Buku Administrasi Pembangunan       Buku Rencana Pembangunan, kegiatan
                                      pembangunan, inventaris hasil
                                      pembangunan, dan kader pemberdayaan

  Buku Administrasi Lainnya           Administrasi BPD, PKK, Karang
                                      Taruna, dan administrasi
                                      kelembagaan sesuai kebutuhan

  Agenda Kegiatan                     Nama kegiatan, tanggal, lokasi,
                                      penanggung jawab, peserta,
                                      anggaran, dokumentasi

  Arsip Desa                          Nomor arsip, klasifikasi, judul
                                      dokumen, tanggal, asal dokumen,
                                      file, lokasi penyimpanan, retensi
  -----------------------------------------------------------------------

**Fitur operasional:**

-   Pencatatan buku administrasi.
-   Nomor register otomatis.
-   Pencarian arsip.
-   Upload dokumen.
-   Cetak buku administrasi.
-   Export Excel/PDF.
-   Riwayat perubahan.
-   Filter tahun dan kategori.

**Catatan:** Buku administrasi sebaiknya tidak sekadar berupa kumpulan
tabel kosong. Jika memungkinkan, data diambil otomatis dari modul
kependudukan, persuratan, pembangunan, dan kelembagaan.

# 7. Keuangan Desa

**Fungsi:** Mengelola perencanaan, penganggaran, penatausahaan, dan
pelaporan keuangan desa.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  APBDes                              Tahun anggaran, pendapatan,
                                      belanja, pembiayaan, pagu anggaran,
                                      penetapan

  Pendapatan                          PADes, transfer, Dana Desa, Alokasi
                                      Dana Desa, bagi hasil pajak,
                                      bantuan keuangan

  Belanja                             Bidang, subbidang, kegiatan, jenis
                                      belanja, pagu, realisasi

  Pembiayaan                          Penerimaan pembiayaan, pengeluaran
                                      pembiayaan, SILPA

  Penatausahaan                       Transaksi penerimaan, pengeluaran,
                                      tanggal transaksi, rekening, sumber
                                      dana, bukti transaksi

  Buku Kas Umum                       Nomor transaksi, tanggal, uraian,
                                      penerimaan, pengeluaran, saldo

  Realisasi Anggaran                  Pagu, realisasi, sisa anggaran,
                                      persentase realisasi

  Laporan Keuangan                    Laporan realisasi APBDes, laporan
                                      semester, laporan tahunan, lampiran
                                      dan dokumen pendukung
  -----------------------------------------------------------------------

**Fitur operasional:**

-   Pengelolaan tahun anggaran.
-   Pengelolaan rekening anggaran.
-   Input dan validasi transaksi.
-   Upload bukti transaksi.
-   Perhitungan saldo otomatis.
-   Grafik realisasi.
-   Cetak laporan.
-   Perbandingan anggaran dan realisasi.

**Catatan:** Modul harus mengikuti struktur dan ketentuan pengelolaan
keuangan desa yang berlaku, termasuk referensi rekening dan klasifikasi
anggaran. Jangan menganggap modul ini otomatis menggantikan Siskeudes
tanpa integrasi dan kesesuaian regulasi.

# 8. Pembangunan & Aset

**Fungsi:** Mengelola perencanaan pembangunan desa, pelaksanaan
kegiatan, dan aset milik desa.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Perencanaan Pembangunan             RPJM Desa, RKP Desa, usulan
                                      pembangunan, prioritas, bidang,
                                      tahun pelaksanaan

  Kegiatan Pembangunan                Nama kegiatan, lokasi, volume,
                                      anggaran, sumber dana, pelaksana,
                                      penanggung jawab

  Proyek Desa                         Nama proyek, nilai proyek,
                                      kontraktor/pelaksana, tanggal
                                      mulai, target selesai, progres,
                                      foto dokumentasi

  Inventaris Barang                   Kode barang, nama barang, kategori,
                                      merek, jumlah, tahun perolehan,
                                      kondisi, lokasi

  Aset Desa                           Tanah, bangunan, kendaraan,
                                      peralatan, sumber perolehan, nilai
                                      aset, bukti kepemilikan

  Mutasi Aset                         Penambahan, pengurangan,
                                      pemindahan, perubahan kondisi,
                                      penghapusan

  Laporan Aset                        Daftar aset, nilai aset, kondisi,
                                      lokasi, rekapitulasi aset
  -----------------------------------------------------------------------

**Fitur operasional:**

-   CRUD inventaris dan aset.
-   Kode inventaris otomatis.
-   QR Code barang.
-   Upload foto aset.
-   Pencatatan pemeliharaan.
-   Riwayat mutasi.
-   Monitoring progres pembangunan.
-   Dokumentasi sebelum dan sesudah.
-   Laporan pembangunan per tahun.

**Catatan:** Inventaris barang merupakan pencatatan barang yang
digunakan atau dikelola. Aset desa merupakan kekayaan milik desa dengan
status dan dasar kepemilikan yang jelas. Tidak semua barang yang
digunakan desa otomatis merupakan aset milik desa.

# 9. Pertanahan & GIS

**Fungsi:** Mengelola informasi geografis, batas wilayah, tanah desa,
dan pemetaan informasi masyarakat.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Peta Desa                           Peta dasar, batas desa, jalan,
                                      sungai, fasilitas umum

  Peta Wilayah                        Polygon dusun, RW, RT, titik
                                      koordinat, batas administratif

  Data Pertanahan                     Nomor bidang, nama
                                      pemilik/penggarap, luas, jenis
                                      penggunaan, lokasi, status
                                      penguasaan, dokumen pendukung

  Batas Wilayah                       Batas desa, batas dusun, batas
                                      RT/RW, koordinat, titik batas

  Peta Penduduk                       Sebaran penduduk, keluarga,
                                      kelompok umur, kepadatan penduduk
                                      berdasarkan wilayah
  -----------------------------------------------------------------------

**Fitur operasional:**

-   Peta interaktif.
-   Tambah titik koordinat.
-   Menggambar polygon.
-   Import GeoJSON/KML.
-   Layer peta.
-   Pencarian lokasi.
-   Filter berdasarkan dusun dan RT.
-   Integrasi data penduduk.
-   Cetak peta.

**Catatan privasi:** Peta penduduk harus memperhatikan keamanan data
pribadi. Jangan menampilkan NIK, nama lengkap, atau lokasi rumah
individu secara terbuka di website publik.

# 10. Program & Data Desa

**Fungsi:** Mengelola program pemberdayaan, bantuan masyarakat, potensi
desa, serta data pembangunan berbasis indikator.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Bantuan Sosial                      Nama program, sumber bantuan,
                                      periode, kriteria, kuota, anggaran,
                                      pelaksanaan

  Data Penerima Bantuan               NIK, nama penerima, alamat, jenis
                                      bantuan, periode, status kelayakan,
                                      status penyaluran

  SDGs Desa                           Indikator SDGs, tujuan, pertanyaan,
                                      hasil pendataan, skor, tahun,
                                      capaian

  Data Potensi Desa                   Potensi pertanian, perkebunan,
                                      peternakan, UMKM, wisata, sumber
                                      daya alam, fasilitas

  Statistik Program Desa              Jumlah penerima bantuan, capaian
                                      program, perkembangan indikator,
                                      grafik dan laporan
  -----------------------------------------------------------------------

**Fitur operasional:**

-   Pendataan penerima bantuan.
-   Verifikasi penerima.
-   Riwayat bantuan per penduduk.
-   Pengelolaan indikator SDGs.
-   Pendataan potensi desa.
-   Grafik perkembangan program.
-   Laporan penerima bantuan.
-   Export data.

**Integrasi:** Data penerima bantuan mengambil referensi dari
Kependudukan agar identitas penduduk tidak perlu diinput berulang kali.

# 11. Layanan Warga

**Fungsi:** Menjadi pusat interaksi antara masyarakat dengan pemerintah
desa.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Pengaduan Masyarakat                Nomor pengaduan, pelapor, kategori,
                                      judul, isi pengaduan, foto, lokasi,
                                      tanggal, status penanganan

  Aspirasi Warga                      Usulan masyarakat, kategori,
                                      lokasi, deskripsi, prioritas,
                                      tanggapan pemerintah desa

  Lapak Desa                          Produk UMKM, nama penjual,
                                      kategori, harga, foto, deskripsi,
                                      kontak WhatsApp, status publikasi

  Informasi Pelayanan                 Jenis pelayanan, persyaratan,
                                      prosedur, waktu penyelesaian, biaya
                                      resmi jika ada, kontak petugas
  -----------------------------------------------------------------------

**Fitur operasional:**

-   Pengajuan melalui website publik.
-   Nomor tiket otomatis.
-   Pelacakan pengaduan.
-   Disposisi kepada perangkat terkait.
-   Tanggapan admin.
-   Upload dokumentasi penyelesaian.
-   Notifikasi kepada pelapor.
-   Publikasi informasi pelayanan.
-   Katalog produk UMKM.

**Alur pengaduan:**

1.  Warga mengirim pengaduan.
2.  Admin memverifikasi laporan.
3.  Pengaduan diteruskan ke perangkat terkait.
4.  Perangkat melakukan tindak lanjut.
5.  Admin mengunggah hasil penyelesaian.
6.  Warga menerima informasi penyelesaian.

**Status pengaduan yang disarankan:** Baru, Diverifikasi, Diproses,
Menunggu, Selesai, dan Ditolak.

# 12. Pengaturan

**Fungsi:** Mengatur konfigurasi aplikasi, akun, keamanan, dan integrasi
sistem.

  -----------------------------------------------------------------------
  Submenu                             Fungsi dan isi data
  ----------------------------------- -----------------------------------
  Pengguna                            Nama, username, email, nomor HP,
                                      jabatan, status akun, foto

  Role & Hak Akses                    Nama role, modul, izin melihat,
                                      membuat, mengubah, menghapus,
                                      menyetujui, mencetak

  Pengaturan Sistem                   Nama aplikasi, identitas tenant,
                                      zona waktu, format tanggal,
                                      konfigurasi umum

  Integrasi                           API, WhatsApp, email, Google Maps,
                                      layanan tanda tangan elektronik,
                                      sistem eksternal

  Template Website                    Daftar template, preview,
                                      konfigurasi tampilan, aktivasi
                                      template, pengaturan per tenant

  Log Aktivitas                       Pengguna, aktivitas, modul, data
                                      yang diubah, IP address, waktu,
                                      hasil aktivitas
  -----------------------------------------------------------------------

**Fitur operasional:**

-   Manajemen akun.
-   Reset password.
-   Aktivasi dan penonaktifan akun.
-   Role-based access control.
-   Hak akses per modul dan tindakan.
-   Pengaturan integrasi.
-   Monitoring aktivitas.
-   Pengaturan keamanan.
-   Backup dan konfigurasi sistem jika disediakan.

**Catatan multi-tenant AppDes:**

-   Seluruh data operasional harus terisolasi berdasarkan desa (tenant).
-   Pengguna desa hanya dapat mengakses tenant sendiri.
-   Super Admin dapat mengelola lintas tenant sesuai kewenangannya.
-   Konfigurasi website dapat berbeda untuk setiap tenant.
-   Setiap tenant dapat memilih template dari katalog template yang
    dikelola Super Admin.

# 13. Standar Fitur Setiap Modul

Gunakan standar berikut sebagai checklist saat mengembangkan submenu.
Tidak semua fitur wajib diterapkan pada semua jenis halaman.

  Fitur        Keterangan
  ------------ ----------------------------------------------------
  Tambah       Membuat data baru
  Detail       Melihat informasi lengkap
  Ubah         Memperbarui data
  Hapus        Menghapus dengan validasi dan aturan retensi
  Pencarian    Mencari data
  Filter       Berdasarkan tanggal, wilayah, kategori, dan status
  Pagination   Pembagian halaman data
  Import       Mengimpor Excel jika relevan
  Export       Mengunduh Excel/PDF
  Cetak        Mencetak dokumen atau laporan
  Riwayat      Melihat histori perubahan
  Validasi     Memastikan data benar
  Hak Akses    Membatasi tindakan berdasarkan role

**Pengecualian:** Halaman statistik dan laporan umumnya bersifat
read-only atau memiliki tindakan khusus, bukan CRUD manual. Data
statistik harus dihitung dari sumber data transaksi atau data induk.

# 14. Pemetaan Hubungan Antar-Modul

Kependudukan menjadi salah satu sumber data utama bagi modul lain.

  -----------------------------------------------------------------------
  Modul sumber            Modul yang menggunakan  Contoh hubungan
                          data                    
  ----------------------- ----------------------- -----------------------
  Kependudukan            Persuratan              Referensi identitas
                                                  pemohon

  Kependudukan            Bantuan Sosial          Referensi penerima
                                                  bantuan

  Kependudukan            Data Stunting           Referensi balita dan
                                                  keluarga

  Kependudukan            Calon Pemilih           Referensi penduduk
                                                  potensial

  Kependudukan            Pertanahan & GIS        Agregasi sebaran
                                                  penduduk

  Kependudukan            Statistik               Agregasi demografi

  Profil & Website        Website Publik          Profil, perangkat,
                                                  berita, galeri

  Kehadiran & Kepegawaian Pemerintah Desa         Sumber data perangkat
                                                  desa yang sama

  Pembangunan & Aset      Administrasi Desa       Referensi kegiatan dan
                                                  inventaris

  Keuangan Desa           Dashboard dan Website   Anggaran dan realisasi
                                                  yang boleh
                                                  dipublikasikan

  Layanan Warga           Website Publik          Pengaduan, aspirasi,
                                                  lapak, informasi
                                                  pelayanan
  -----------------------------------------------------------------------

**Prinsip integrasi:**

1.  Data induk dibuat dan dikelola pada modul sumber.
2.  Modul lain menggunakan referensi ID, bukan menyalin data identitas.
3.  Perubahan data induk tercermin pada modul yang menggunakan referensi
    tersebut.
4.  Statistik dan laporan dihitung dari data sumber.
5.  Data publik disajikan melalui API dengan filter publikasi dan
    perlindungan data pribadi.

# 15. Prioritas Pengembangan

  -----------------------------------------------------------------------
  Tahap                   Modul                   Prioritas
  ----------------------- ----------------------- -----------------------
  Fondasi                 Multi-tenant, pengguna, Wajib sejak awal
                          role, hak akses, audit  
                          log                     

  1                       Beranda, Profil &       Fondasi operasional
                          Website                 

  2                       Kependudukan            Sangat tinggi

  3                       Pelayanan & Persuratan  Sangat tinggi

  4                       Kehadiran & Kepegawaian Tinggi

  5                       Administrasi Desa       Tinggi

  6                       Keuangan Desa           Tinggi

  7                       Pembangunan & Aset      Tinggi

  8                       Pertanahan & GIS        Menengah

  9                       Program & Data Desa     Tinggi

  10                      Layanan Warga           Tinggi
  -----------------------------------------------------------------------

Urutan tahap dapat disesuaikan dengan dependensi teknis. Fondasi
multi-tenant dan kontrol akses harus tersedia sebelum modul operasional
digunakan.

# 16. Keputusan Arsitektur yang Perlu Dikunci

1.  Semua data penduduk menjadi referensi utama bagi modul yang
    membutuhkan identitas warga.
2.  Data Pemerintah Desa dan Data Perangkat Desa menggunakan satu sumber
    data.
3.  Semua transaksi memiliki nomor referensi dan riwayat aktivitas.
4.  Semua laporan mengambil data otomatis dari modul sumber.
5.  Website publik hanya menampilkan data yang telah dipublikasikan.
6.  Setiap tenant memiliki data dan konfigurasi terisolasi.
7.  Super Admin mengelola katalog template website.
8.  Setiap desa dapat memilih template yang tersedia sesuai kebijakan
    platform.
9.  Hak akses diterapkan pada tingkat modul dan tindakan, bukan hanya
    menyembunyikan menu.
10. Perubahan data penting dicatat dalam audit log.

# 17. Spesifikasi Lanjutan per Submenu

Blueprint ini merupakan rancangan tingkat menu dan fungsi. Sebelum
implementasi setiap submenu, buat spesifikasi teknis yang mencakup:

-   Tujuan dan ruang lingkup submenu.
-   Aktor dan hak akses.
-   Daftar halaman: daftar, tambah, edit, detail, dan halaman pendukung.
-   Field formulir beserta tipe data, validasi, dan aturan wajib.
-   Struktur tabel database dan relasi.
-   API endpoint dan aturan otorisasi.
-   Alur kerja dan status transaksi.
-   Integrasi dengan modul lain.
-   Aturan publikasi ke website.
-   Import, export, dan format laporan.
-   Audit trail dan aturan penghapusan/retensi.
-   Kriteria penerimaan fungsional.

**Definisi selesai:** Sebuah submenu dinyatakan selesai apabila seluruh
alur yang menjadi ruang lingkupnya berfungsi, validasi dan hak akses
diterapkan, data tersimpan dengan benar, integrasi terkait berjalan, dan
tidak ada tombol atau tindakan yang hanya menjadi tampilan tanpa fungsi.

------------------------------------------------------------------------

## Penutup

AppDes ditargetkan menjadi sistem manajemen pemerintahan desa yang
mencakup administrasi, kependudukan, pelayanan, keuangan, pembangunan,
aset, pemetaan, program desa, dan keterbukaan informasi publik.

Dokumen ini menjadi acuan awal untuk menyusun spesifikasi teknis dan
membagi pekerjaan implementasi per modul. Rincian field, relasi
database, API, dan workflow final tetap perlu divalidasi terhadap
kebutuhan desa serta peraturan yang berlaku.
