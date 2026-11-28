import {
  decimal,
  int,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { villages } from "./village";

export const idmIndikator = mysqlTable("idm_indikator", {
  id: int("id").autoincrement().primaryKey(),
  villageId: int("village_id")
    .notNull()
    .references(() => villages.id, { onDelete: "cascade" }),
  tahun: int("tahun").notNull(),
  kode: varchar("kode", { length: 20 }).notNull(),
  nama: varchar("nama", { length: 200 }).notNull(),
  skor: int("skor").default(0),
  kategori: varchar("kategori", { length: 50 }),
  keterangan: text("keterangan"),
});

/**
 * Capaian SDGs Desa per tujuan (1–18) untuk satu tahun.
 *
 * Unik per desa + tahun + tujuan sehingga operator cukup mengisi ulang nilai
 * yang sudah ada (upsert), bukan membuat baris baru.
 */
export const idmSdgs = mysqlTable(
  "idm_sdgs",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    tahun: int("tahun").notNull(),
    goal: int("goal").notNull(),
    skor: int("skor").notNull().default(0),
    keterangan: text("keterangan"),
  },
  (t) => [uniqueIndex("idm_sdgs_village_tahun_goal_uq").on(t.villageId, t.tahun, t.goal)],
);


/**
 * Ringkasan IDM dari API Kemendesa per desa dan tahun.
 *
 * Skor/status utama dihitung ulang dari indikator, sedangkan skor minimal,
 * target status, dan penambahan hanya tersedia dari API sehingga disimpan
 * terpisah agar tidak menjadi sumber kebenaran ganda untuk skor IDM.
 */
export const idmRingkasan = mysqlTable(
  "idm_ringkasan",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    tahun: int("tahun").notNull(),
    skorMinimal: decimal("skor_minimal", { precision: 6, scale: 4 }),
    targetStatus: varchar("target_status", { length: 50 }),
    statusApi: varchar("status_api", { length: 50 }),
    skorApi: decimal("skor_api", { precision: 6, scale: 4 }),
    penambahan: decimal("penambahan", { precision: 6, scale: 4 }),
    disinkronkanPada: timestamp("disinkronkan_pada").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("idm_ringkasan_village_tahun_uq").on(t.villageId, t.tahun)],
);
