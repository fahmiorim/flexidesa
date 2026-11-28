import {
  boolean,
  date,
  foreignKey,
  index,
  int,
  mysqlTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { kepegawaianPegawai } from "./kepegawaian";
import { residents } from "./resident";
import { villages } from "./village";

/** Catatan kehadiran pegawai desa; pegawaiId merujuk kepegawaian_pegawai. */
export const kehadiranPerangkat = mysqlTable(
  "kehadiran_perangkat",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    perangkatId: int("perangkat_id"),
    pegawaiId: int("pegawai_id"),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    jamMasuk: time("jam_masuk"),
    jamKeluar: time("jam_keluar"),
    status: varchar("status", { length: 20 }).default("hadir"),
    latitudeMasuk: varchar("latitude_masuk", { length: 30 }),
    longitudeMasuk: varchar("longitude_masuk", { length: 30 }),
    fotoMasuk: varchar("foto_masuk", { length: 255 }),
    catatan: varchar("catatan", { length: 500 }),
  },
  (table) => [
    index("kehadiran_perangkat_village_tanggal_idx").on(table.villageId, table.tanggal),
    index("kehadiran_perangkat_village_pegawai_idx").on(table.villageId, table.pegawaiId),
    index("kehadiran_perangkat_village_status_idx").on(table.villageId, table.status),
    foreignKey({
      name: "kehadiran_perangkat_pegawai_tenant_fk",
      columns: [table.villageId, table.pegawaiId],
      foreignColumns: [kepegawaianPegawai.villageId, kepegawaianPegawai.id],
    }).onDelete("cascade"),
  ],
);

export type KehadiranPerangkat = typeof kehadiranPerangkat.$inferSelect;
export type NewKehadiranPerangkat = typeof kehadiranPerangkat.$inferInsert;

/**
 * `kehadiran_pengaduan` — laporan warga atas kehadiran perangkat desa.
 *
 * Baris dibuat dari layanan mandiri
 * (warga menekan "Laporkan" pada daftar kehadiran perangkat), lalu operator
 * hanya dapat menyunting keterangannya pada menu Kehadiran → Pengaduan.
 */
export const kehadiranPengaduan = mysqlTable(
  "kehadiran_pengaduan",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    /** Waktu perangkat dilaporkan. */
    waktu: timestamp("waktu").notNull().defaultNow(),
    /** `false` = belum ditindaklanjuti, `true` = sudah. */
    status: boolean("status").notNull().default(false),
    keterangan: text("keterangan"),
    /** Pelapor: penduduk yang melaporkan lewat layanan mandiri. */
    pelaporId: int("pelapor_id"),
    /** Terlapor: pegawai yang dilaporkan. */
    pegawaiId: int("terlapor_id"),
  },
  (table) => [
    index("kehadiran_pengaduan_village_waktu_idx").on(table.villageId, table.waktu),
    index("kehadiran_pengaduan_village_pegawai_idx").on(table.villageId, table.pegawaiId),
    foreignKey({
      name: "kehadiran_pengaduan_pelapor_tenant_fk",
      columns: [table.villageId, table.pelaporId],
      foreignColumns: [residents.villageId, residents.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "kehadiran_pengaduan_pegawai_tenant_fk",
      columns: [table.villageId, table.pegawaiId],
      foreignColumns: [kepegawaianPegawai.villageId, kepegawaianPegawai.id],
    }).onDelete("cascade"),
  ],
);


/**
 * `kehadiran_jam_kerja` — jadwal jam kerja per nama hari.
 *
 * Satu baris per hari (Senin–Minggu),
 * masing-masing punya jam masuk/keluar, status hari kerja/libur, dan
 * keterangan. Unik per desa + nama hari.
 */
export const kehadiranJamKerja = mysqlTable(
  "kehadiran_jam_kerja",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    namaHari: varchar("nama_hari", { length: 65 }).notNull(),
    jamMasuk: time("jam_masuk").notNull(),
    jamKeluar: time("jam_keluar").notNull(),
    /** `true` = hari kerja, `false` = hari libur. */
    status: boolean("status").notNull().default(true),
    keterangan: text("keterangan"),
  },
  (table) => [
    uniqueIndex("kehadiran_jam_kerja_village_hari_uq").on(table.villageId, table.namaHari),
  ],
);

export type KehadiranJamKerja = typeof kehadiranJamKerja.$inferSelect;
export type NewKehadiranJamKerja = typeof kehadiranJamKerja.$inferInsert;

/**
 * `kehadiran_hari_libur` — daftar tanggal libur selain libur mingguan.
 *
 * Tanggal unik per desa dan keterangan
 * wajib diisi. Dipakai untuk menandai hari libur nasional/cuti bersama.
 */
export const kehadiranHariLibur = mysqlTable(
  "kehadiran_hari_libur",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    keterangan: text("keterangan"),
  },
  (table) => [
    uniqueIndex("kehadiran_hari_libur_village_tanggal_uq").on(table.villageId, table.tanggal),
  ],
);

export type KehadiranHariLibur = typeof kehadiranHariLibur.$inferSelect;
export type NewKehadiranHariLibur = typeof kehadiranHariLibur.$inferInsert;

/**
 * `kehadiran_alasan_keluar` — master alasan keluar saat jam kerja.
 *
 * Alasan wajib, keterangan opsional,
 * dan jejak pembuat/pengubah.
 */
export const kehadiranAlasanKeluar = mysqlTable(
  "kehadiran_alasan_keluar",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    alasan: varchar("alasan", { length: 255 }).notNull(),
    keterangan: text("keterangan"),
    createdBy: varchar("created_by", { length: 36 }),
    updatedBy: varchar("updated_by", { length: 36 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("kehadiran_alasan_keluar_village_idx").on(table.villageId)],
);

export type KehadiranAlasanKeluar = typeof kehadiranAlasanKeluar.$inferSelect;
export type NewKehadiranAlasanKeluar = typeof kehadiranAlasanKeluar.$inferInsert;
