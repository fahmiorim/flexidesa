import {
  boolean,
  foreignKey,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { villages } from "./village";

/** Kategori sarana dan prasarana yang ditampilkan pada profil publik. */
export const SARANA_KATEGORI = [
  "pendidikan",
  "kesehatan",
  "ibadah",
  "utilitas",
  "transportasi",
  "olahraga",
  "sosial",
  "lainnya",
] as const;

/**
 * `sarana_prasarana` — fasilitas umum desa untuk halaman profil publik.
 *
 * Berbeda dari inventaris (aset internal dengan nilai dan penyusutan), tabel
 * ini hanya menyimpan data yang memang boleh dipublikasikan per desa.
 */
export const saranaPrasarana = mysqlTable(
  "sarana_prasarana",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id").notNull(),
    nama: varchar("nama", { length: 200 }).notNull(),
    kategori: varchar("kategori", { length: 40 }).notNull().default("lainnya"),
    lokasi: varchar("lokasi", { length: 200 }),
    keterangan: text("keterangan"),
    aktif: boolean("aktif").notNull().default(false),
    urut: int("urut").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    foreignKey({
      name: "sarana_prasarana_village_fk",
      columns: [t.villageId],
      foreignColumns: [villages.id],
    }).onDelete("cascade"),
    uniqueIndex("sarana_prasarana_village_id_uq").on(t.villageId, t.id),
    index("sarana_prasarana_village_active_idx").on(t.villageId, t.aktif, t.urut),
  ],
);

export type SaranaPrasarana = typeof saranaPrasarana.$inferSelect;
