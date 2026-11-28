-- Preflight: deteksi baris legacy lintas tenant (read-only).
--
-- Setiap composite foreign key (village_id, <fk>) diperiksa: baris anak yang
-- merujuk induk milik desa lain. Query ini TIDAK mengubah data apa pun dan
-- aman dijalankan pada database produksi untuk menginventarisasi sisa data
-- legacy sebelum constraint dipasang. Dibangkitkan dari skema basis data;
-- bangkitkan ulang bila daftar composite FK berubah.
--
-- Kolom hasil: relasi, jenis, child_id.

SELECT 'analisis_indikator.kategori_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `analisis_indikator` c
INNER JOIN `analisis_kategori` p
  ON p.`id` = c.`kategori_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`kategori_id` IS NOT NULL
UNION ALL
SELECT 'anggota_grup_kontak.grup_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `anggota_grup_kontak` c
INNER JOIN `kontak_grup` p
  ON p.`id` = c.`grup_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`grup_id` IS NOT NULL
UNION ALL
SELECT 'anggota_grup_kontak.kontak_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `anggota_grup_kontak` c
INNER JOIN `kontak` p
  ON p.`id` = c.`kontak_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`kontak_id` IS NOT NULL
UNION ALL
SELECT 'area.ref_polygon' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `area` c
INNER JOIN `polygon` p
  ON p.`id` = c.`ref_polygon`
  AND p.`village_id` <> c.`village_id`
WHERE c.`ref_polygon` IS NOT NULL
UNION ALL
SELECT 'bantuan_peserta.family_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bantuan_peserta` c
INNER JOIN `families` p
  ON p.`id` = c.`family_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`family_id` IS NOT NULL
UNION ALL
SELECT 'bantuan_peserta.kelompok_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bantuan_peserta` c
INNER JOIN `kelompok` p
  ON p.`id` = c.`kelompok_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`kelompok_id` IS NOT NULL
UNION ALL
SELECT 'bantuan_peserta.program_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bantuan_peserta` c
INNER JOIN `bantuan_program` p
  ON p.`id` = c.`program_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`program_id` IS NOT NULL
UNION ALL
SELECT 'bantuan_peserta.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bantuan_peserta` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'bantuan_peserta.rtm_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bantuan_peserta` c
INNER JOIN `rtm` p
  ON p.`id` = c.`rtm_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`rtm_id` IS NOT NULL
UNION ALL
SELECT 'berita.kategori_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `berita` c
INNER JOIN `berita_kategori` p
  ON p.`id` = c.`kategori_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`kategori_id` IS NOT NULL
UNION ALL
SELECT 'bukti_pengiriman_notifikasi.pengaduan_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bukti_pengiriman_notifikasi` c
INNER JOIN `pengaduan` p
  ON p.`id` = c.`pengaduan_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pengaduan_id` IS NOT NULL
UNION ALL
SELECT 'bulanan_anak.kia_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bulanan_anak` c
INNER JOIN `kia` p
  ON p.`id` = c.`kia_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`kia_id` IS NOT NULL
UNION ALL
SELECT 'bulanan_anak.posyandu_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bulanan_anak` c
INNER JOIN `posyandu` p
  ON p.`id` = c.`posyandu_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`posyandu_id` IS NOT NULL
UNION ALL
SELECT 'bumindes_item.buku_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bumindes_item` c
INNER JOIN `bumindes_buku` p
  ON p.`id` = c.`buku_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`buku_id` IS NOT NULL
UNION ALL
SELECT 'bumindes_tanah_kas_mutasi.tanah_kas_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `bumindes_tanah_kas_mutasi` c
INNER JOIN `bumindes_tanah_kas` p
  ON p.`id` = c.`tanah_kas_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`tanah_kas_id` IS NOT NULL
UNION ALL
SELECT 'cdesa_mutasi.cdesa_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `cdesa_mutasi` c
INNER JOIN `cdesa` p
  ON p.`id` = c.`cdesa_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`cdesa_id` IS NOT NULL
UNION ALL
SELECT 'cdesa_rincian.cdesa_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `cdesa_rincian` c
INNER JOIN `cdesa` p
  ON p.`id` = c.`cdesa_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`cdesa_id` IS NOT NULL
UNION ALL
SELECT 'cuti_kuota.pegawai_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `cuti_kuota` c
INNER JOIN `kepegawaian_pegawai` p
  ON p.`id` = c.`pegawai_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pegawai_id` IS NOT NULL
UNION ALL
SELECT 'cuti_pegawai.pegawai_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `cuti_pegawai` c
INNER JOIN `kepegawaian_pegawai` p
  ON p.`id` = c.`pegawai_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pegawai_id` IS NOT NULL
UNION ALL
SELECT 'dokumen_warga.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `dokumen_warga` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'dtks_anggota.dtks_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `dtks_anggota` c
INNER JOIN `dtks` p
  ON p.`id` = c.`dtks_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`dtks_id` IS NOT NULL
UNION ALL
SELECT 'dtks_anggota.penduduk_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `dtks_anggota` c
INNER JOIN `residents` p
  ON p.`id` = c.`penduduk_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`penduduk_id` IS NOT NULL
UNION ALL
SELECT 'dtks_ref_lampiran.dtks_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `dtks_ref_lampiran` c
INNER JOIN `dtks` p
  ON p.`id` = c.`dtks_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`dtks_id` IS NOT NULL
UNION ALL
SELECT 'dtks_ref_lampiran.lampiran_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `dtks_ref_lampiran` c
INNER JOIN `dtks_lampiran` p
  ON p.`id` = c.`lampiran_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`lampiran_id` IS NOT NULL
UNION ALL
SELECT 'dtks.keluarga_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `dtks` c
INNER JOIN `families` p
  ON p.`id` = c.`keluarga_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`keluarga_id` IS NOT NULL
UNION ALL
SELECT 'dtks.rtm_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `dtks` c
INNER JOIN `rtm` p
  ON p.`id` = c.`rtm_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`rtm_id` IS NOT NULL
UNION ALL
SELECT 'families.region_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `families` c
INNER JOIN `regions` p
  ON p.`id` = c.`region_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`region_id` IS NOT NULL
UNION ALL
SELECT 'family_member_logs.family_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `family_member_logs` c
INNER JOIN `families` p
  ON p.`id` = c.`family_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`family_id` IS NOT NULL
UNION ALL
SELECT 'family_member_logs.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `family_member_logs` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'galeri_foto.album_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `galeri_foto` c
INNER JOIN `galeri_album` p
  ON p.`id` = c.`album_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`album_id` IS NOT NULL
UNION ALL
SELECT 'ibu_hamil.kia_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `ibu_hamil` c
INNER JOIN `kia` p
  ON p.`id` = c.`kia_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`kia_id` IS NOT NULL
UNION ALL
SELECT 'ibu_hamil.posyandu_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `ibu_hamil` c
INNER JOIN `posyandu` p
  ON p.`id` = c.`posyandu_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`posyandu_id` IS NOT NULL
UNION ALL
SELECT 'incoming_letter_dispositions.incoming_letter_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `incoming_letter_dispositions` c
INNER JOIN `incoming_letters` p
  ON p.`id` = c.`incoming_letter_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`incoming_letter_id` IS NOT NULL
UNION ALL
SELECT 'incoming_letters.classification_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `incoming_letters` c
INNER JOIN `letter_classifications` p
  ON p.`id` = c.`classification_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`classification_id` IS NOT NULL
UNION ALL
SELECT 'inventaris_dokumen.inventaris_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `inventaris_dokumen` c
INNER JOIN `inventaris` p
  ON p.`id` = c.`inventaris_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`inventaris_id` IS NOT NULL
UNION ALL
SELECT 'inventaris_mutasi.inventaris_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `inventaris_mutasi` c
INNER JOIN `inventaris` p
  ON p.`id` = c.`inventaris_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`inventaris_id` IS NOT NULL
UNION ALL
SELECT 'inventaris_pemeliharaan_riwayat.inventaris_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `inventaris_pemeliharaan_riwayat` c
INNER JOIN `inventaris` p
  ON p.`id` = c.`inventaris_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`inventaris_id` IS NOT NULL
UNION ALL
SELECT 'inventaris_pemeliharaan_riwayat.pemeliharaan_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `inventaris_pemeliharaan_riwayat` c
INNER JOIN `inventaris_pemeliharaan` p
  ON p.`id` = c.`pemeliharaan_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pemeliharaan_id` IS NOT NULL
UNION ALL
SELECT 'inventaris_pemeliharaan.inventaris_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `inventaris_pemeliharaan` c
INNER JOIN `inventaris` p
  ON p.`id` = c.`inventaris_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`inventaris_id` IS NOT NULL
UNION ALL
SELECT 'inventaris_penanggung_jawab_riwayat.inventaris_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `inventaris_penanggung_jawab_riwayat` c
INNER JOIN `inventaris` p
  ON p.`id` = c.`inventaris_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`inventaris_id` IS NOT NULL
UNION ALL
SELECT 'inventaris.kategori_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `inventaris` c
INNER JOIN `inventaris_kategori` p
  ON p.`id` = c.`kategori_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`kategori_id` IS NOT NULL
UNION ALL
SELECT 'kehadiran_izin.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kehadiran_izin` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'kehadiran_pengaduan.pelapor_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kehadiran_pengaduan` c
INNER JOIN `residents` p
  ON p.`id` = c.`pelapor_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pelapor_id` IS NOT NULL
UNION ALL
SELECT 'kehadiran_pengaduan.terlapor_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kehadiran_pengaduan` c
INNER JOIN `kepegawaian_pegawai` p
  ON p.`id` = c.`terlapor_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`terlapor_id` IS NOT NULL
UNION ALL
SELECT 'kehadiran_perangkat.pegawai_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kehadiran_perangkat` c
INNER JOIN `kepegawaian_pegawai` p
  ON p.`id` = c.`pegawai_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pegawai_id` IS NOT NULL
UNION ALL
SELECT 'kelompok_anggota.kelompok_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kelompok_anggota` c
INNER JOIN `kelompok` p
  ON p.`id` = c.`kelompok_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`kelompok_id` IS NOT NULL
UNION ALL
SELECT 'kelompok_anggota.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kelompok_anggota` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'kelompok.category_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kelompok` c
INNER JOIN `kelompok_master` p
  ON p.`id` = c.`category_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`category_id` IS NOT NULL
UNION ALL
SELECT 'kepegawaian_dokumen.pegawai_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kepegawaian_dokumen` c
INNER JOIN `kepegawaian_pegawai` p
  ON p.`id` = c.`pegawai_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pegawai_id` IS NOT NULL
UNION ALL
SELECT 'kepegawaian_riwayat.pegawai_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kepegawaian_riwayat` c
INNER JOIN `kepegawaian_pegawai` p
  ON p.`id` = c.`pegawai_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pegawai_id` IS NOT NULL
UNION ALL
SELECT 'kia.anak_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kia` c
INNER JOIN `residents` p
  ON p.`id` = c.`anak_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`anak_id` IS NOT NULL
UNION ALL
SELECT 'kia.ibu_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kia` c
INNER JOIN `residents` p
  ON p.`id` = c.`ibu_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`ibu_id` IS NOT NULL
UNION ALL
SELECT 'kontak_pesan_arsip.grup_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kontak_pesan_arsip` c
INNER JOIN `kontak_grup` p
  ON p.`id` = c.`grup_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`grup_id` IS NOT NULL
UNION ALL
SELECT 'kontak.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `kontak` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'lapak_produk.lapak_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `lapak_produk` c
INNER JOIN `lapak` p
  ON p.`id` = c.`lapak_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`lapak_id` IS NOT NULL
UNION ALL
SELECT 'lapak.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `lapak` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'lembaga_anggota.lembaga_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `lembaga_anggota` c
INNER JOIN `lembaga_desa` p
  ON p.`id` = c.`lembaga_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`lembaga_id` IS NOT NULL
UNION ALL
SELECT 'lembaga_anggota.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `lembaga_anggota` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'lembaga_desa.ketua_resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `lembaga_desa` c
INNER JOIN `residents` p
  ON p.`id` = c.`ketua_resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`ketua_resident_id` IS NOT NULL
UNION ALL
SELECT 'lembaga_desa.master_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `lembaga_desa` c
INNER JOIN `lembaga_master` p
  ON p.`id` = c.`master_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`master_id` IS NOT NULL
UNION ALL
SELECT 'letter_dinas.classification_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `letter_dinas` c
INNER JOIN `letter_classifications` p
  ON p.`id` = c.`classification_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`classification_id` IS NOT NULL
UNION ALL
SELECT 'letter_number_archive.letter_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `letter_number_archive` c
INNER JOIN `letters` p
  ON p.`id` = c.`letter_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`letter_id` IS NOT NULL
UNION ALL
SELECT 'letter_types.classification_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `letter_types` c
INNER JOIN `letter_classifications` p
  ON p.`id` = c.`classification_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`classification_id` IS NOT NULL
UNION ALL
SELECT 'letters.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `letters` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'letters.type_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `letters` c
INNER JOIN `letter_types` p
  ON p.`id` = c.`type_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`type_id` IS NOT NULL
UNION ALL
SELECT 'notifikasi_terkirim.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `notifikasi_terkirim` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'outgoing_letter_shipments.outgoing_letter_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `outgoing_letter_shipments` c
INNER JOIN `outgoing_letters` p
  ON p.`id` = c.`outgoing_letter_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`outgoing_letter_id` IS NOT NULL
UNION ALL
SELECT 'outgoing_letters.classification_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `outgoing_letters` c
INNER JOIN `letter_classifications` p
  ON p.`id` = c.`classification_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`classification_id` IS NOT NULL
UNION ALL
SELECT 'pembangunan_dokumentasi.proyek_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `pembangunan_dokumentasi` c
INNER JOIN `pembangunan_proyek` p
  ON p.`id` = c.`proyek_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`proyek_id` IS NOT NULL
UNION ALL
SELECT 'pemerintahan_dokumen.lembaga_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `pemerintahan_dokumen` c
INNER JOIN `lembaga_desa` p
  ON p.`id` = c.`lembaga_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`lembaga_id` IS NOT NULL
UNION ALL
SELECT 'pemerintahan_dokumen.perangkat_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `pemerintahan_dokumen` c
INNER JOIN `perangkat_desa` p
  ON p.`id` = c.`perangkat_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`perangkat_id` IS NOT NULL
UNION ALL
SELECT 'pemilihan_kandidat.pemilihan_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `pemilihan_kandidat` c
INNER JOIN `pemilihan` p
  ON p.`id` = c.`pemilihan_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pemilihan_id` IS NOT NULL
UNION ALL
SELECT 'pendapat.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `pendapat` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'pengajuan_layanan_berkas.pengajuan_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `pengajuan_layanan_berkas` c
INNER JOIN `pengajuan_layanan` p
  ON p.`id` = c.`pengajuan_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pengajuan_id` IS NOT NULL
UNION ALL
SELECT 'pengajuan_layanan.layanan_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `pengajuan_layanan` c
INNER JOIN `layanan_publik` p
  ON p.`id` = c.`layanan_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`layanan_id` IS NOT NULL
UNION ALL
SELECT 'pengajuan_layanan.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `pengajuan_layanan` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'perangkat_desa.jabatan_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `perangkat_desa` c
INNER JOIN `jabatan_perangkat` p
  ON p.`id` = c.`jabatan_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`jabatan_id` IS NOT NULL
UNION ALL
SELECT 'perangkat_riwayat_jabatan.perangkat_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `perangkat_riwayat_jabatan` c
INNER JOIN `perangkat_desa` p
  ON p.`id` = c.`perangkat_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`perangkat_id` IS NOT NULL
UNION ALL
SELECT 'permohonan_surat.letter_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `permohonan_surat` c
INNER JOIN `letters` p
  ON p.`id` = c.`letter_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`letter_id` IS NOT NULL
UNION ALL
SELECT 'permohonan_surat.letter_type_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `permohonan_surat` c
INNER JOIN `letter_types` p
  ON p.`id` = c.`letter_type_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`letter_type_id` IS NOT NULL
UNION ALL
SELECT 'permohonan_surat.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `permohonan_surat` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'potensi_indikator.potensi_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `potensi_indikator` c
INNER JOIN `potensi_desa` p
  ON p.`id` = c.`potensi_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`potensi_id` IS NOT NULL
UNION ALL
SELECT 'resident_mutations.from_region_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `resident_mutations` c
INNER JOIN `regions` p
  ON p.`id` = c.`from_region_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`from_region_id` IS NOT NULL
UNION ALL
SELECT 'resident_mutations.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `resident_mutations` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'resident_mutations.to_region_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `resident_mutations` c
INNER JOIN `regions` p
  ON p.`id` = c.`to_region_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`to_region_id` IS NOT NULL
UNION ALL
SELECT 'residents.family_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `residents` c
INNER JOIN `families` p
  ON p.`id` = c.`family_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`family_id` IS NOT NULL
UNION ALL
SELECT 'residents.region_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `residents` c
INNER JOIN `regions` p
  ON p.`id` = c.`region_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`region_id` IS NOT NULL
UNION ALL
SELECT 'residents.rtm_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `residents` c
INNER JOIN `rtm` p
  ON p.`id` = c.`rtm_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`rtm_id` IS NOT NULL
UNION ALL
SELECT 'riwayat_pengajuan_layanan.pengajuan_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `riwayat_pengajuan_layanan` c
INNER JOIN `pengajuan_layanan` p
  ON p.`id` = c.`pengajuan_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`pengajuan_id` IS NOT NULL
UNION ALL
SELECT 'rtm.region_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `rtm` c
INNER JOIN `regions` p
  ON p.`id` = c.`region_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`region_id` IS NOT NULL
UNION ALL
SELECT 'sasaran_paud.kia_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `sasaran_paud` c
INNER JOIN `kia` p
  ON p.`id` = c.`kia_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`kia_id` IS NOT NULL
UNION ALL
SELECT 'sasaran_paud.posyandu_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `sasaran_paud` c
INNER JOIN `posyandu` p
  ON p.`id` = c.`posyandu_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`posyandu_id` IS NOT NULL
UNION ALL
SELECT 'suplemen_terdata.id_suplemen' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `suplemen_terdata` c
INNER JOIN `suplemen` p
  ON p.`id` = c.`id_suplemen`
  AND p.`village_id` <> c.`village_id`
WHERE c.`id_suplemen` IS NOT NULL
UNION ALL
SELECT 'suplemen_terdata.keluarga_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `suplemen_terdata` c
INNER JOIN `families` p
  ON p.`id` = c.`keluarga_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`keluarga_id` IS NOT NULL
UNION ALL
SELECT 'suplemen_terdata.penduduk_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `suplemen_terdata` c
INNER JOIN `residents` p
  ON p.`id` = c.`penduduk_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`penduduk_id` IS NOT NULL
UNION ALL
SELECT 'survey_jawaban.responden_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `survey_jawaban` c
INNER JOIN `survey_responden` p
  ON p.`id` = c.`responden_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`responden_id` IS NOT NULL
UNION ALL
SELECT 'survey_jawaban.soal_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `survey_jawaban` c
INNER JOIN `survey_soal` p
  ON p.`id` = c.`soal_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`soal_id` IS NOT NULL
UNION ALL
SELECT 'survey_responden.survey_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `survey_responden` c
INNER JOIN `survey` p
  ON p.`id` = c.`survey_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`survey_id` IS NOT NULL
UNION ALL
SELECT 'survey_soal.indikator_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `survey_soal` c
INNER JOIN `analisis_indikator` p
  ON p.`id` = c.`indikator_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`indikator_id` IS NOT NULL
UNION ALL
SELECT 'survey_soal.survey_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `survey_soal` c
INNER JOIN `survey` p
  ON p.`id` = c.`survey_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`survey_id` IS NOT NULL
UNION ALL
SELECT 'users.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `users` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'verifikasi_kontak.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `verifikasi_kontak` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL
UNION ALL
SELECT 'warga_pesan.resident_id' AS relasi, 'cross-tenant' AS jenis, CAST(c.id AS UNSIGNED) AS child_id
FROM `warga_pesan` c
INNER JOIN `residents` p
  ON p.`id` = c.`resident_id`
  AND p.`village_id` <> c.`village_id`
WHERE c.`resident_id` IS NOT NULL;
