import {
  decimal,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { villages } from "./village";

/**
 * `regions` — wilayah administratif desa (dusun/RW/RT).
 *
 * Struktur datar: satu baris merepresentasikan kombinasi dusun/RW/RT. Istilah
 * `dusun`, `rw`, dan `rt` dipertahankan apa adanya karena tidak punya padanan
 * baku dalam bahasa Inggris.
 */
export const regions = mysqlTable(
  "regions",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    dusun: varchar("dusun", { length: 100 }),
    rw: varchar("rw", { length: 10 }),
    rt: varchar("rt", { length: 10 }),
    /** Nama kepala wilayah pada tingkat baris ini (Kadus/Ketua RW/Ketua RT). */
    kepala: varchar("kepala", { length: 100 }),
    /**
     * Penduduk yang menjabat sebagai kepala wilayah.
     *
     * Disimpan tanpa foreign key karena `SET NULL` pada foreign key komposit
     * ikut mengosongkan `village_id` yang NOT NULL. `kepala` tetap disimpan
     * sebagai teks agar data lama dan kepala wilayah non-penduduk tidak hilang.
     */
    kepalaResidentId: int("kepala_resident_id"),
    /** Titik kantor wilayah, mis. `-6.200000, 106.816666`. */
    koordinat: varchar("koordinat", { length: 60 }),
    /** GeoJSON Polygon/MultiPolygon batas wilayah pada tingkat baris ini. */
    path: text("path"),
    /** Zoom peta terakhir yang dipakai untuk wilayah ini. */
    zoom: int("zoom"),
    /** Tipe peta dasar: `osm` | `carto` | `carto-dark`. */
    mapTipe: varchar("map_tipe", { length: 20 }),
    /** Warna isi batas wilayah, mis. `#10b981`. */
    warna: varchar("warna", { length: 25 }),
    /** Warna garis batas wilayah, mis. `#047857`. */
    border: varchar("border", { length: 25 }),
    /** Luas wilayah baris ini dalam hektare; diisi pada tingkat dusun. */
    luasHa: decimal("luas_ha", { precision: 12, scale: 2 }),

    sortOrder: int("sort_order").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("regions_village_dusun_rw_rt_uq").on(t.villageId, t.dusun, t.rw, t.rt),
    uniqueIndex("regions_village_id_uq").on(t.villageId, t.id),
    index("regions_village_sort_idx").on(t.villageId, t.sortOrder),
    index("regions_village_kepala_idx").on(t.villageId, t.kepalaResidentId),
  ],
);

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;
