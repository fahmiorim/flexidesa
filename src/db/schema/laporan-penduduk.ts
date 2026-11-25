import { index, int, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

import { users } from "./auth";
import { villages } from "./village";

/**
 * `laporan_penduduk` — arsip dokumen Laporan Penduduk per bulan.
 *
 * Mengikuti `laporan_sinkronisasi` pada sistem rujukan (OpenSID) untuk tipe
 * `laporan_penduduk`: operator mengunggah dokumen PDF resmi per bulan dan
 * tahun, lalu mencatat tanggal pengirimannya ke OpenDK. Angka laporan
 * **tidak** diturunkan dari tabel ini.
 *
 * Kolom `kirim` sengaja dipertahankan agar kolom Tanggal Kirim OpenSID tetap
 * terjangkau; kolom ini terisi saat aksi kirim ke OpenDK tersedia.
 */
export const laporanPenduduk = mysqlTable(
  "laporan_penduduk",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    judul: varchar("judul", { length: 255 }).notNull(),
    tahun: int("tahun").notNull(),
    /** Bulan laporan, `1`–`12` (Januari–Desember). */
    bulan: int("bulan").notNull(),

    /** Nama berkas asli yang diunggah operator (untuk ditampilkan & diunduh). */
    namaFile: varchar("nama_file", { length: 255 }).notNull(),
    /** Jalur berkas di disk relatif terhadap `storage/laporan-penduduk`. */
    jalurFile: varchar("jalur_file", { length: 255 }).notNull(),
    ukuranFile: int("ukuran_file").notNull().default(0),

    /** Tanggal dokumen dikirim ke OpenDK; kosong berarti belum dikirim. */
    kirim: timestamp("kirim"),

    createdBy: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("laporan_penduduk_village_tahun_bulan_uq").on(
      table.villageId,
      table.tahun,
      table.bulan,
    ),
    index("laporan_penduduk_village_tahun_idx").on(table.villageId, table.tahun),
  ],
);

export type LaporanPenduduk = typeof laporanPenduduk.$inferSelect;
export type NewLaporanPenduduk = typeof laporanPenduduk.$inferInsert;
