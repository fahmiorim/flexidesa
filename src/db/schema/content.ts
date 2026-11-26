import {
  boolean,
  date,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { users } from "./auth";
import { villages } from "./village";

/**
 * Skema konten situs publik.
 *
 * Mengikuti pola katalog konten situs desa (`artikel`, `kategori`,
 * `gambar_gallery`, `menu`, `widget`, `dokumen`, `pamong`) namun tata kelola
 * datanya orisinal.
 * Seluruh tabel membawa `village_id` (kunci tenant) dan slug/situs unik
 * **per desa**, bukan global, sehingga satu basis kode dapat melayani banyak
 * desa tanpa saling menimpa.
 */

/** `profil_desa` — satu baris per desa: visi, misi, sejarah, sambutan. */
export const profilDesa = mysqlTable(
  "profil_desa",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    visi: text("visi"),
    /** Misi disimpan satu per baris agar mudah disunting dan dirender. */
    misi: text("misi"),
    sejarah: text("sejarah"),
    sambutan: text("sambutan"),
    /** Koordinat peta, mis. `-6.200000, 106.816666`. */
    koordinat: varchar("koordinat", { length: 60 }),
    /** Tipe peta dasar terakhir untuk titik kantor: `osm` | `carto` | `carto-dark`. */
    mapTipe: varchar("map_tipe", { length: 20 }),
    luasWilayah: decimal("luas_wilayah", { precision: 12, scale: 2 }),
    batasUtara: varchar("batas_utara", { length: 150 }),
    batasSelatan: varchar("batas_selatan", { length: 150 }),
    batasTimur: varchar("batas_timur", { length: 150 }),
    batasBarat: varchar("batas_barat", { length: 150 }),
    ketinggian: varchar("ketinggian", { length: 100 }),
    suhuRataRata: varchar("suhu_rata_rata", { length: 100 }),
    curahHujan: varchar("curah_hujan", { length: 100 }),
    topografi: varchar("topografi", { length: 150 }),
    /** Profil ekologi (paritas OpenSID). */
    jenisTanah: varchar("jenis_tanah", { length: 150 }),
    sumberDayaAlam: text("sumber_daya_alam"),
    floraFauna: text("flora_fauna"),
    rawanBencana: varchar("rawan_bencana", { length: 255 }),
    kearifanLokal: text("kearifan_lokal"),
    /** Profil jaringan internet desa. */
    jenisJaringan: varchar("jenis_jaringan", { length: 150 }),
    providerInternet: varchar("provider_internet", { length: 150 }),
    cakupanWilayah: text("cakupan_wilayah"),
    kecepatanInternet: varchar("kecepatan_internet", { length: 100 }),
    aksesPublik: text("akses_publik"),
    /** Status dan data adat. */
    statusDesa: varchar("status_desa", { length: 20 }),
    lembagaAdat: varchar("lembaga_adat", { length: 150 }),
    /** Jalur media gambar struktur adat. */
    strukturAdat: varchar("struktur_adat", { length: 255 }),
    wilayahAdat: text("wilayah_adat"),
    peraturanAdat: text("peraturan_adat"),
    regulasiPenetapanKampungAdat: varchar("regulasi_penetapan_kampung_adat", { length: 255 }),
    /** Jalur media PDF regulasi penetapan kampung adat. */
    dokumenRegulasiPenetapanKampungAdat: varchar("dokumen_regulasi_penetapan_kampung_adat", {
      length: 255,
    }),

    /** GeoJSON Polygon batas desa; dikelola dari halaman Identitas Desa. */
    batasDesa: text("batas_desa"),
    /** Tahun berdirinya desa; tampil pada kartu fakta halaman profil publik. */
    tahunBerdiri: int("tahun_berdiri"),
    /** Tujuan, nilai dasar, dan arah kebijakan pembangunan (satu per baris). */
    tujuanPembangunan: text("tujuan_pembangunan"),
    nilaiDasar: text("nilai_dasar"),
    arahKebijakan: text("arah_kebijakan"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("profil_desa_village_unique").on(table.villageId)],
);

/** `jabatan_perangkat` — daftar jabatan (Kepala Desa, Sekretaris, dst.). */
export const jabatanPerangkat = mysqlTable(
  "jabatan_perangkat",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    nama: varchar("nama", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    /**
     * Jenis jabatan struktural; lihat `JENIS_JABATAN`.
     *
     * Dipakai untuk aturan yang bergantung pada posisi: hanya satu Kepala Desa
     * dan satu Sekretaris Desa yang boleh aktif, penandatangan "a.n" wajib
     * Sekretaris Desa, dan "u.b" tidak boleh Kepala/Sekretaris Desa.
     */
    jenis: varchar("jenis", { length: 20 }).notNull().default("lainnya"),
    /** Tugas pokok dan fungsi jabatan. */
    tupoksi: text("tupoksi"),
    urut: int("urut").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("jabatan_perangkat_village_slug_unique").on(table.villageId, table.slug),
    // Parent key untuk composite tenant FK `perangkat_desa_jabatan_tenant_fk`.
    uniqueIndex("jabatan_perangkat_village_id_uq").on(table.villageId, table.id),
  ],
);

/** `perangkat_desa` — aparatur desa beserta jabatannya (SOTK). */
export const perangkatDesa = mysqlTable(
  "perangkat_desa",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    jabatanId: int("jabatan_id"),
    /** Penduduk asal aparat; `null` bila aparat berasal dari luar desa. */
    residentId: int("resident_id"),

    nama: varchar("nama", { length: 100 }).notNull(),
    gelarDepan: varchar("gelar_depan", { length: 100 }),
    gelarBelakang: varchar("gelar_belakang", { length: 100 }),
    nip: varchar("nip", { length: 25 }),
    /** Nomor Induk Aparatur Pemerintah Desa. */
    niap: varchar("niap", { length: 30 }),
    nik: varchar("nik", { length: 16 }),
    /** Tag ID Card aparat (mis. untuk absensi). */
    tagIdCard: varchar("tag_id_card", { length: 30 }),
    /** Jenis kelamin: `male` | `female`. */
    jenisKelamin: varchar("jenis_kelamin", { length: 10 }),
    tempatLahir: varchar("tempat_lahir", { length: 100 }),
    tanggalLahir: date("tanggal_lahir", { mode: "string" }),
    pendidikan: varchar("pendidikan", { length: 100 }),
    agama: varchar("agama", { length: 50 }),
    /** Pangkat/golongan untuk aparat berstatus PNS. */
    pangkat: varchar("pangkat", { length: 50 }),
    telepon: varchar("telepon", { length: 30 }),
    email: varchar("email", { length: 150 }),
    alamat: varchar("alamat", { length: 255 }),
    nomorSkPengangkatan: varchar("nomor_sk_pengangkatan", { length: 100 }),
    tanggalPengangkatan: date("tanggal_pengangkatan", { mode: "string" }),
    nomorSkPemberhentian: varchar("nomor_sk_pemberhentian", { length: 100 }),
    tanggalPemberhentian: date("tanggal_pemberhentian", { mode: "string" }),
    atasanId: int("atasan_id"),
    /**
     * Wilayah yang dipimpin aparat ini.
     *
     * Diisi otomatis oleh sinkronisasi kepala wilayah saat dusun diangkat pada
     * halaman Wilayah Administratif. Disimpan tanpa foreign key, seperti
     * `resident_id`, agar penghapusan wilayah tidak memutus data aparat secara
     * paksa; validasi tenant dilakukan di application layer.
     */
    wilayahId: int("wilayah_id"),
    /** Jalur foto relatif di penyimpanan media. */
    foto: varchar("foto", { length: 255 }),
    /** Tanda tangan (berkas gambar) untuk berkas surat. */
    tandaTangan: varchar("tanda_tangan", { length: 255 }),

    /** Jabatan ditampilkan sebagai pejabat penanda tangan? */
    penandaTangan: boolean("penanda_tangan").notNull().default(false),
    /** Pejabat sementara (Pj) Kepala Desa; hanya berlaku untuk jabatan Kepala Desa. */
    statusPejabat: boolean("status_pejabat").notNull().default(false),
    /** Status kehadiran aparat, terpisah dari status aktif/nonaktif. */
    kehadiran: boolean("kehadiran").notNull().default(true),
    /** Penandatangan "a.n" (atas nama); hanya untuk Sekretaris Desa dan tunggal. */
    ttdAn: boolean("ttd_an").notNull().default(false),
    /** Penandatangan "u.b" (untuk beliau); tidak untuk Kepala/Sekretaris Desa. */
    ttdUb: boolean("ttd_ub").notNull().default(false),

    /** Posisi pada bagan organisasi. */
    baganTingkat: int("bagan_tingkat"),
    /** Geser horizontal bagan, mis. `-75%` atau `75%`. */
    baganOffset: varchar("bagan_offset", { length: 10 }),
    /** Tata letak anak pada bagan: `hanging` | `normal`. */
    baganLayout: varchar("bagan_layout", { length: 20 }),
    /** Warna simpul bagan, mis. `#FFFFFF`. */
    baganWarna: varchar("bagan_warna", { length: 10 }),
    /** Media sosial aparat: `{ "facebook": "...", "instagram": "..." }`. */
    mediaSosial: json("media_sosial"),

    /** Status: `aktif` | `nonaktif`. */
    status: varchar("status", { length: 20 }).notNull().default("aktif"),
    /** Periode menjabat (masa jabatan). Format: "YYYY" atau "YYYY-YYYY". */
    periode: varchar("periode", { length: 20 }),
    urut: int("urut").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("perangkat_desa_village_idx").on(table.villageId),
    uniqueIndex("perangkat_desa_village_id_uq").on(table.villageId, table.id),
    index("perangkat_desa_village_atasan_idx").on(table.villageId, table.atasanId),
    index("perangkat_desa_jabatan_idx").on(table.jabatanId),
    index("perangkat_desa_village_jabatan_idx").on(table.villageId, table.jabatanId),
    // Tautan ke penduduk sengaja tanpa foreign key: `ON DELETE SET NULL` pada
    // foreign key komposit ikut mengosongkan `village_id` yang NOT NULL, dan
    // `RESTRICT` akan menggagalkan penghapusan penduduk biasa. Kepemilikan
    // tenant diverifikasi di application layer sebelum disimpan.
    index("perangkat_desa_village_resident_idx").on(table.villageId, table.residentId),
    // Satu aparat per wilayah; nilai NULL berulang tetap diizinkan MySQL.
    uniqueIndex("perangkat_desa_village_wilayah_uq").on(table.villageId, table.wilayahId),
    foreignKey({
      name: "perangkat_desa_jabatan_tenant_fk",
      columns: [table.villageId, table.jabatanId],
      foreignColumns: [jabatanPerangkat.villageId, jabatanPerangkat.id],
    }).onDelete("restrict"),
  ],
);

/** `berita_kategori` — kategori berita/artikel. */
export const beritaKategori = mysqlTable(
  "berita_kategori",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    nama: varchar("nama", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    /** Kategori tampil di menu publik? */
    aktif: boolean("aktif").notNull().default(true),
    urut: int("urut").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("berita_kategori_village_slug_unique").on(table.villageId, table.slug),
    // Parent key untuk composite tenant FK `berita_kategori_tenant_fk`.
    uniqueIndex("berita_kategori_village_id_uq").on(table.villageId, table.id),
  ],
);

/**
 * `berita` — artikel/berita desa.
 *
 * `isi` menyimpan HTML yang **wajib** disanitasi sebelum disimpan dan sebelum
 * dirender (lihat `src/lib/sanitize.ts`).
 */
export const berita = mysqlTable(
  "berita",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    kategoriId: int("kategori_id"),
    penulisId: varchar("penulis_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),

    judul: varchar("judul", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    ringkasan: varchar("ringkasan", { length: 500 }),
    isi: text("isi").notNull(),
    /** Gambar sampul (jalur relatif media). */
    gambar: varchar("gambar", { length: 255 }),
    /** Berkas lampiran opsional (jalur relatif media). */
    dokumen: varchar("dokumen", { length: 255 }),
    /** Status: `draft` | `published`. */
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    /** Terbit pada; `null` = belum dijadwalkan. */
    terbitPada: timestamp("terbit_pada"),

    headline: boolean("headline").notNull().default(false),
    /** Berita boleh ditampilkan di slider beranda? */
    slider: boolean("slider").notNull().default(false),
    bolehKomentar: boolean("boleh_komentar").notNull().default(true),
    hit: int("hit").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("berita_village_slug_unique").on(table.villageId, table.slug),
    index("berita_village_status_idx").on(table.villageId, table.status, table.terbitPada),
    index("berita_kategori_idx").on(table.kategoriId),
    index("berita_village_kategori_idx").on(table.villageId, table.kategoriId),
    foreignKey({
      name: "berita_kategori_tenant_fk",
      columns: [table.villageId, table.kategoriId],
      foreignColumns: [beritaKategori.villageId, beritaKategori.id],
    }).onDelete("restrict"),
  ],
);

/** `galeri_album` — album galeri foto. */
export const galeriAlbum = mysqlTable(
  "galeri_album",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    nama: varchar("nama", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
    keterangan: text("keterangan"),
    kategori: varchar("kategori", { length: 80 }),
    /** Tanggal publikasi album untuk pengurutan dan label publik. */
    publishedAt: timestamp("published_at"),
    /** Gambar sampul album (jalur relatif media). */
    sampul: varchar("sampul", { length: 255 }),
    aktif: boolean("aktif").notNull().default(true),
    urut: int("urut").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("galeri_album_village_slug_unique").on(table.villageId, table.slug),
    uniqueIndex("galeri_album_village_id_uq").on(table.villageId, table.id),
    index("galeri_album_village_category_published_idx").on(
      table.villageId,
      table.kategori,
      table.publishedAt,
    ),
  ],
);

/** `galeri_foto` — foto dalam album; `albumId` null = foto lepas (slider). */
export const galeriFoto = mysqlTable(
  "galeri_foto",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    albumId: int("album_id"),

    gambar: varchar("gambar", { length: 255 }).notNull(),
    judul: varchar("judul", { length: 150 }),
    keterangan: text("keterangan"),
    aktif: boolean("aktif").notNull().default(true),
    /** Ditampilkan sebagai slide beranda? */
    slider: boolean("slider").notNull().default(false),
    urut: int("urut").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("galeri_foto_village_idx").on(table.villageId),
    index("galeri_foto_album_idx").on(table.albumId),
    index("galeri_foto_village_album_idx").on(table.villageId, table.albumId),
    foreignKey({
      columns: [table.villageId, table.albumId],
      foreignColumns: [galeriAlbum.villageId, galeriAlbum.id],
      name: "galeri_foto_album_tenant_fk",
    }).onDelete("cascade"),
  ],
);

/**
 * `menu_publik` — menu navigasi situs publik.
 *
 * `parentId` null = menu tingkat atas. `linkTipe` menentukan apakah `link`
 * diperlakukan sebagai URL internal (`internal`), tautan bebas (`eksternal`),
 * atau halaman statis (`halaman`).
 */
export const menuPublik = mysqlTable(
  "menu_publik",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    parentId: int("parent_id"),

    nama: varchar("nama", { length: 50 }).notNull(),
    link: varchar("link", { length: 500 }).notNull(),
    linkTipe: varchar("link_tipe", { length: 20 }).notNull().default("internal"),
    aktif: boolean("aktif").notNull().default(true),
    urut: int("urut").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("menu_publik_village_idx").on(table.villageId, table.urut)],
);

/** `widget` — blok samping beranda/laman. */
export const widget = mysqlTable(
  "widget",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    judul: varchar("judul", { length: 100 }),
    /** `isi` hanya berlaku untuk widget jenis `teks`. */
    isi: text("isi"),
    /**
     * Jenis widget:
     * 1 = teks bebas, 2 = galeri, 3 = statistik penduduk, 4 = media sosial,
     * 5 = dokumen, 6 = menu.
     */
    jenis: tinyint("jenis").notNull().default(1),
    /** Pengaturan JSON khusus per jenis widget. */
    pengaturan: text("pengaturan"),
    aktif: boolean("aktif").notNull().default(true),
    urut: int("urut").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("widget_village_idx").on(table.villageId, table.urut)],
);

/** `slider` — gambar sorotan di beranda. */
export const slider = mysqlTable(
  "slider",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    gambar: varchar("gambar", { length: 255 }).notNull(),
    judul: varchar("judul", { length: 150 }),
    keterangan: varchar("keterangan", { length: 500 }),
    /** Tautan yang dibuka saat slide diklik. */
    tautan: varchar("tautan", { length: 255 }),
    aktif: boolean("aktif").notNull().default(true),
    urut: int("urut").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("slider_village_idx").on(table.villageId, table.urut)],
);

/**
 * `dokumen_publik` — dokumen informasi publik & produk hukum.
 *
 * Berbeda dari dokumen campuran arsip internal dan publik,
 * tabel ini khusus berkas yang memang boleh diunduh warga.
 */
export const dokumenPublik = mysqlTable(
  "dokumen_publik",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    nama: varchar("nama", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    /** `informasi_publik` | `produk_hukum` | `lainnya`. */
    kategori: varchar("kategori", { length: 50 }).notNull().default("informasi_publik"),
    jenis: varchar("jenis", { length: 50 }),
    nomor: varchar("nomor", { length: 100 }),
    tahun: int("tahun"),
    /** Jalur relatif berkas di penyimpanan media. */
    berkas: varchar("berkas", { length: 255 }),
    /** Tautan luar bila berkas tidak diunggah. */
    tautan: varchar("tautan", { length: 500 }),
    keterangan: text("keterangan"),
    aktif: boolean("aktif").notNull().default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("dokumen_publik_village_slug_unique").on(table.villageId, table.slug),
    index("dokumen_publik_village_kategori_idx").on(table.villageId, table.kategori),
  ],
);

/**
 * `halaman_statis` — halaman bebas (mis. "Sejarah Desa", "Syarat Layanan").
 *
 * `slug` unik per desa. `isi` HTML tersanitasi.
 */
export const halamanStatis = mysqlTable(
  "halaman_statis",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    judul: varchar("judul", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    isi: text("isi").notNull(),
    aktif: boolean("aktif").notNull().default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("halaman_statis_village_slug_unique").on(table.villageId, table.slug)],
);

export type ProfilDesa = typeof profilDesa.$inferSelect;
export type JabatanPerangkat = typeof jabatanPerangkat.$inferSelect;
export type PerangkatDesa = typeof perangkatDesa.$inferSelect;
export type Berita = typeof berita.$inferSelect;
export type BeritaKategori = typeof beritaKategori.$inferSelect;
export type GaleriAlbum = typeof galeriAlbum.$inferSelect;
export type GaleriFoto = typeof galeriFoto.$inferSelect;
export type MenuPublik = typeof menuPublik.$inferSelect;
export type Widget = typeof widget.$inferSelect;
export type Slider = typeof slider.$inferSelect;
export type DokumenPublik = typeof dokumenPublik.$inferSelect;
export type HalamanStatis = typeof halamanStatis.$inferSelect;
