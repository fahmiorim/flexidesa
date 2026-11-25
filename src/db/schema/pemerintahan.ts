import {
  boolean,
  date,
  foreignKey,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { perangkatDesa } from "./content";
import { residents } from "./resident";
import { villages } from "./village";

/** Kategori (master) lembaga desa, setara `kelompok_master` OpenSID tipe `lembaga`. */
export const lembagaMaster = mysqlTable(
  "lembaga_master",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    nama: varchar("nama", { length: 50 }).notNull(),
    deskripsi: text("deskripsi"),
    urut: int("urut").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("lembaga_master_village_nama_uq").on(t.villageId, t.nama),
    uniqueIndex("lembaga_master_village_id_uq").on(t.villageId, t.id),
  ],
);

/** Lembaga desa dan BPD; seluruh data dipisahkan per tenant. */
export const lembagaDesa = mysqlTable(
  "lembaga_desa",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    nama: varchar("nama", { length: 150 }).notNull(),
    kode: varchar("kode", { length: 16 }),
    jenis: varchar("jenis", { length: 50 }).notNull().default("lainnya"),
    masterId: int("master_id"),
    deskripsi: text("deskripsi"),
    tugasFungsi: text("tugas_fungsi"),
    dasarHukum: varchar("dasar_hukum", { length: 255 }),
    noSkPendirian: varchar("no_sk_pendirian", { length: 255 }),
    ketuaResidentId: int("ketua_resident_id"),
    logo: varchar("logo", { length: 255 }),
    masaBaktiMulai: date("masa_bakti_mulai", { mode: "string" }),
    masaBaktiSelesai: date("masa_bakti_selesai", { mode: "string" }),
    status: varchar("status", { length: 20 }).notNull().default("aktif"),
    tampilPublik: boolean("tampil_publik").notNull().default(false),
    urut: int("urut").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("lembaga_desa_village_status_idx").on(t.villageId, t.status),
    uniqueIndex("lembaga_desa_village_id_uq").on(t.villageId, t.id),
    uniqueIndex("lembaga_desa_village_kode_uq").on(t.villageId, t.kode),
    foreignKey({
      name: "lembaga_desa_ketua_tenant_fk",
      columns: [t.villageId, t.ketuaResidentId],
      foreignColumns: [residents.villageId, residents.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "lembaga_desa_master_tenant_fk",
      columns: [t.villageId, t.masterId],
      foreignColumns: [lembagaMaster.villageId, lembagaMaster.id],
    }).onDelete("restrict"),
  ],
);

/** Pengurus/anggota lembaga; data sensitif tidak pernah dikirim ke halaman publik. */
export const lembagaAnggota = mysqlTable(
  "lembaga_anggota",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    lembagaId: int("lembaga_id").notNull(),
    residentId: int("resident_id"),
    nama: varchar("nama", { length: 150 }).notNull(),
    nomorAnggota: varchar("nomor_anggota", { length: 20 }),
    jabatan: varchar("jabatan", { length: 100 }),
    nomorSkJabatan: varchar("nomor_sk_jabatan", { length: 255 }),
    nomorSkPengangkatan: varchar("nomor_sk_pengangkatan", { length: 255 }),
    tanggalSkPengangkatan: date("tanggal_sk_pengangkatan", { mode: "string" }),
    nomorSkPemberhentian: varchar("nomor_sk_pemberhentian", { length: 255 }),
    tanggalSkPemberhentian: date("tanggal_sk_pemberhentian", { mode: "string" }),
    periode: varchar("periode", { length: 100 }),
    keterangan: varchar("keterangan", { length: 300 }),
    foto: varchar("foto", { length: 255 }),
    periodeMulai: date("periode_mulai", { mode: "string" }),
    periodeSelesai: date("periode_selesai", { mode: "string" }),
    aktif: boolean("aktif").notNull().default(true),
    tampilPublik: boolean("tampil_publik").notNull().default(false),
    urut: int("urut").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("lembaga_anggota_village_lembaga_idx").on(t.villageId, t.lembagaId),
    uniqueIndex("lembaga_anggota_village_lembaga_nomor_uq").on(
      t.villageId,
      t.lembagaId,
      t.nomorAnggota,
    ),
    foreignKey({
      name: "lembaga_anggota_tenant_fk",
      columns: [t.villageId, t.lembagaId],
      foreignColumns: [lembagaDesa.villageId, lembagaDesa.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "lembaga_anggota_resident_tenant_fk",
      columns: [t.villageId, t.residentId],
      foreignColumns: [residents.villageId, residents.id],
    }).onDelete("restrict"),
  ],
);

/** Riwayat jabatan perangkat untuk rekam jejak dan masa jabatan. */
export const perangkatRiwayatJabatan = mysqlTable(
  "perangkat_riwayat_jabatan",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    perangkatId: int("perangkat_id").notNull(),
    jabatan: varchar("jabatan", { length: 150 }).notNull(),
    nomorSk: varchar("nomor_sk", { length: 100 }),
    mulai: date("mulai", { mode: "string" }),
    selesai: date("selesai", { mode: "string" }),
    keterangan: text("keterangan"),
    tampilPublik: boolean("tampil_publik").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("perangkat_riwayat_village_perangkat_idx").on(t.villageId, t.perangkatId),
    foreignKey({
      name: "perangkat_riwayat_tenant_fk",
      columns: [t.villageId, t.perangkatId],
      foreignColumns: [perangkatDesa.villageId, perangkatDesa.id],
    }).onDelete("cascade"),
  ],
);

/** Dokumen perangkat/lembaga. Berkas privat kecuali explicitly dipublikasikan. */
export const pemerintahanDokumen = mysqlTable(
  "pemerintahan_dokumen",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    perangkatId: int("perangkat_id"),
    lembagaId: int("lembaga_id"),
    judul: varchar("judul", { length: 180 }).notNull(),
    nomor: varchar("nomor", { length: 100 }),
    tanggal: date("tanggal", { mode: "string" }),
    berkas: varchar("berkas", { length: 255 }).notNull(),
    tampilPublik: boolean("tampil_publik").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("pemerintahan_dokumen_village_idx").on(t.villageId),
    foreignKey({
      name: "pemerintahan_dokumen_perangkat_tenant_fk",
      columns: [t.villageId, t.perangkatId],
      foreignColumns: [perangkatDesa.villageId, perangkatDesa.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "pemerintahan_dokumen_lembaga_tenant_fk",
      columns: [t.villageId, t.lembagaId],
      foreignColumns: [lembagaDesa.villageId, lembagaDesa.id],
    }).onDelete("cascade"),
  ],
);
