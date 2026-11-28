import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import * as skema from "./schema";

/**
 * Penjaga kesesuaian skema vs migrasi.
 *
 * Skema Drizzle (`src/db/schema`) adalah sumber kebenaran bentuk tabel, tetapi
 * database baru hanya terbentuk dari berkas migrasi. Tanpa test ini, tabel yang
 * hanya dibuat lewat `db:push` akan lolos dari CI dan membuat modul gagal 500
 * pada instalasi bersih.
 *
 * Catatan: test ini statis (tanpa koneksi DB) agar tetap berjalan di job CI
 * yang tidak menyediakan MySQL. Pembandingnya adalah snapshot Drizzle terakhir,
 * yang juga dipakai `db:generate` untuk menghitung diff.
 */

const SCHEMA_DIR = fileURLToPath(new URL("./schema/", import.meta.url));
const MIGRATIONS_DIR = fileURLToPath(new URL("./migrations/", import.meta.url));
const META_DIR = `${MIGRATIONS_DIR}meta/`;

interface SnapshotTabel {
  columns: Record<string, unknown>;
  indexes: Record<string, unknown>;
  foreignKeys: Record<string, unknown>;
}

interface Snapshot {
  tables: Record<string, SnapshotTabel>;
}

function tabelSkema(): Set<string> {
  const hasil = new Set<string>();
  for (const berkas of fs.readdirSync(SCHEMA_DIR)) {
    if (!berkas.endsWith(".ts") || berkas.endsWith(".test.ts") || berkas === "index.ts") continue;
    const isi = fs.readFileSync(SCHEMA_DIR + berkas, "utf8");
    for (const cocok of isi.matchAll(/mysqlTable\(\s*"([a-z0-9_]+)"/g)) {
      const tabel = cocok[1];
      if (tabel) hasil.add(tabel);
    }
  }
  return hasil;
}

function sqlMigrasi(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((berkas) => berkas.endsWith(".sql"))
    .map((berkas) => fs.readFileSync(MIGRATIONS_DIR + berkas, "utf8"));
}

function berkasSqlMigrasi(): Array<{ berkas: string; isi: string }> {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((berkas) => berkas.endsWith(".sql"))
    .sort()
    .map((berkas) => ({
      berkas,
      isi: fs.readFileSync(MIGRATIONS_DIR + berkas, "utf8"),
    }));
}

function tabelMigrasi(): Set<string> {
  const hasil = new Set<string>();
  for (const isi of sqlMigrasi()) {
    for (const cocok of isi.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?`([a-z0-9_]+)`/g)) {
      const tabel = cocok[1];
      if (tabel) hasil.add(tabel);
    }
  }
  return hasil;
}

/**
 * Nama kolom per tabel dibaca dari badan `CREATE TABLE` dan `ALTER TABLE ... ADD`.
 * `ALTER TABLE` tetap dikenali agar migrasi berikutnya dapat menambahkan kolom
 * pada tabel yang sudah ada; semua kolom tetap wajib muncul di snapshot terbaru.
 */
const POLA_CREATE_TABLE =
  /CREATE TABLE (?:IF NOT EXISTS )?`([a-z0-9_]+)` \(\n([\s\S]*?)\n\)(?:\s*[A-Z][A-Z0-9_]*(?:\s*=\s*[^;]+)?)*\s*;/gi;

function kolomMigrasi(): Map<string, Set<string>> {
  const hasil = new Map<string, Set<string>>();
  const tambah = (tabel: string, kolom: string) => {
    const kumpulan = hasil.get(tabel) ?? new Set<string>();
    kumpulan.add(kolom);
    hasil.set(tabel, kumpulan);
  };

  for (const isi of sqlMigrasi()) {
    // Terima CREATE TABLE yang diakhiri ENGINE/CHARSET, bukan hanya ");".
    for (const tabel of isi.matchAll(POLA_CREATE_TABLE)) {
      const nama = tabel[1];
      const badan = tabel[2];
      if (!nama || badan === undefined) continue;
      for (const baris of badan.split("\n")) {
        const cocok = /^[\t ]+`([a-z0-9_]+)`/.exec(baris);
        if (cocok?.[1]) tambah(nama, cocok[1]);
      }
    }

    // Satu ALTER TABLE dapat menambahkan beberapa kolom; proses tiap ADD.
    for (const pernyataan of isi.matchAll(/ALTER TABLE `([a-z0-9_]+)`([\s\S]*?);/gi)) {
      const nama = pernyataan[1];
      const badan = pernyataan[2] ?? "";
      if (!nama) continue;
      for (const tambahan of badan.matchAll(/\bADD (?:COLUMN )?`([a-z0-9_]+)`/gi)) {
        const kolom = tambahan[1];
        if (kolom) tambah(nama, kolom);
      }
    }
  }
  return hasil;
}

function namaForeignKeyMigrasi(): Set<string> {
  const hasil = new Set<string>();
  for (const isi of sqlMigrasi()) {
    for (const cocok of isi.matchAll(/CONSTRAINT `([^`]+)` FOREIGN KEY/g)) {
      hasil.add(cocok[1]!);
    }
  }
  return hasil;
}

function namaIndexMigrasi(): Set<string> {
  const hasil = new Set<string>();
  for (const isi of sqlMigrasi()) {
    for (const cocok of isi.matchAll(/CREATE (?:UNIQUE )?INDEX `([^`]+)`/g)) {
      hasil.add(cocok[1]!);
    }
    for (const cocok of isi.matchAll(/^[\t ]+(?:UNIQUE )?KEY `([^`]+)`/gm)) hasil.add(cocok[1]!);
    for (const cocok of isi.matchAll(/CONSTRAINT `([^`]+)` UNIQUE/g)) {
      hasil.add(cocok[1]!);
    }
    for (const cocok of isi.matchAll(/ALTER TABLE `[^`]+` ADD UNIQUE (?:KEY|INDEX) `([^`]+)`/g)) {
      hasil.add(cocok[1]!);
    }
  }
  return hasil;
}

/** Nama index yang dideklarasikan eksplisit di schema Drizzle. */
function namaIndexSkema(): Set<string> {
  const hasil = new Set<string>();
  for (const berkas of fs.readdirSync(SCHEMA_DIR)) {
    if (!berkas.endsWith(".ts") || berkas.endsWith(".test.ts") || berkas === "index.ts") {
      continue;
    }
    const isi = fs.readFileSync(SCHEMA_DIR + berkas, "utf8");
    for (const cocok of isi.matchAll(/(?:unique)?index\(\s*"([^"]+)"/gi)) {
      hasil.add(cocok[1]!);
    }
  }
  return hasil;
}

function tagJournal(): string[] {
  const journal = JSON.parse(fs.readFileSync(MIGRATIONS_DIR + "meta/_journal.json", "utf8")) as {
    entries: Array<{ idx: number; tag: string }>;
  };
  return journal.entries.map((entri) => entri.tag);
}

function snapshotTerakhir(): Snapshot {
  const berkas = fs
    .readdirSync(META_DIR)
    .filter((nama) => /^\d{4}_snapshot\.json$/.test(nama))
    .sort();

  const terakhir = berkas.at(-1);
  if (!terakhir) throw new Error("Tidak ada snapshot migrasi.");

  return JSON.parse(fs.readFileSync(`${META_DIR}${terakhir}`, "utf8")) as Snapshot;
}

function berkasMigrasi(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((berkas) => berkas.endsWith(".sql"))
    .map((berkas) => berkas.replace(/\.sql$/, ""));
}

describe("kesesuaian skema vs migrasi", () => {
  it("mempertahankan satu baseline dan mencatat paket sebagai migrasi lanjutan", () => {
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith(".sql"));
    const journal = JSON.parse(fs.readFileSync(MIGRATIONS_DIR + "meta/_journal.json", "utf8")) as {
      entries: Array<{ idx: number; tag: string }>;
    };

    expect(files).toEqual(["0000_baseline.sql"]);
    expect(journal.entries.map(({ idx, tag }) => ({ idx, tag }))).toEqual([
      { idx: 0, tag: "0000_baseline" },
    ]);

    const baseline = fs.readFileSync(MIGRATIONS_DIR + "0000_baseline.sql", "utf8");
    for (const bagianSkemaKini of [
      "CREATE TABLE `kehadiran_pengaduan`",
      "CREATE TABLE `laporan_penduduk`",
      "CREATE TABLE `sasaran_paud`",
      "`webhook_event_id` varchar(128)",
      "CREATE TRIGGER users_role_tenant_bi",
      "CREATE TRIGGER users_role_tenant_bu",
      "CREATE TRIGGER roles_tenant_village_bu",
      "INSERT INTO `website_templates`",
    ]) {
      expect(baseline).toContain(bagianSkemaKini);
    }
    expect(baseline).not.toContain("laporan_desa_template");
    expect(baseline).not.toContain("laporan_desa_tersimpan");
  });

  it("mengekspos tabel two-factor dengan key plural yang dipakai adapter Better Auth", () => {
    expect(skema).toHaveProperty("twoFactors");
  });

  it("setiap tabel pada skema dibuat oleh berkas migrasi", () => {
    const skema = tabelSkema();
    const migrasi = tabelMigrasi();
    const hilang = [...skema].filter((tabel) => !migrasi.has(tabel)).sort();

    expect(hilang).toEqual([]);
    expect(skema.size).toBeGreaterThan(0);
  });

  it("setiap berkas migrasi terdaftar di journal Drizzle", () => {
    const journal = new Set(tagJournal());
    const belumTerdaftar = berkasMigrasi()
      .filter((berkas) => !journal.has(berkas))
      .sort();

    expect(belumTerdaftar).toEqual([]);
  });

  it("tidak ada entri journal tanpa berkas migrasi", () => {
    const berkas = new Set(berkasMigrasi());
    const yatim = tagJournal()
      .filter((tag) => !berkas.has(tag))
      .sort();

    expect(yatim).toEqual([]);
  });

  it("setiap kolom pada snapshot dibuat oleh SQL migrasi", () => {
    const kolom = kolomMigrasi();
    const hilang: string[] = [];

    for (const [tabel, isi] of Object.entries(snapshotTerakhir().tables)) {
      const kolomSql = kolom.get(tabel);
      if (!kolomSql) {
        hilang.push(`${tabel} (tabel)`);
        continue;
      }
      for (const nama of Object.keys(isi.columns)) {
        if (!kolomSql.has(nama)) hilang.push(`${tabel}.${nama}`);
      }
    }

    expect(hilang.sort()).toEqual([]);
  });

  it("setiap foreign key pada snapshot dibuat oleh SQL migrasi", () => {
    const dibuat = namaForeignKeyMigrasi();
    const hilang: string[] = [];

    for (const isi of Object.values(snapshotTerakhir().tables)) {
      for (const nama of Object.keys(isi.foreignKeys)) {
        if (!dibuat.has(nama)) hilang.push(nama);
      }
    }

    expect(hilang.sort()).toEqual([]);
  });

  it("setiap indeks pada snapshot dibuat oleh SQL migrasi", () => {
    const dibuat = namaIndexMigrasi();
    const hilang: string[] = [];

    for (const isi of Object.values(snapshotTerakhir().tables)) {
      for (const nama of Object.keys(isi.indexes)) {
        if (!dibuat.has(nama)) hilang.push(nama);
      }
    }

    expect(hilang.sort()).toEqual([]);
  });

  it("nama index di schema sama dengan snapshot terakhir", () => {
    const skema = namaIndexSkema();
    const snapshot = new Set<string>();

    for (const isi of Object.values(snapshotTerakhir().tables)) {
      for (const nama of Object.keys(isi.indexes)) snapshot.add(nama);
    }

    // Selisih dua arah menandakan drift: index yang dibuat migrasi tetapi tidak
    // dideklarasikan schema (kasus `bumindes_item_village_buku_idx`), atau index
    // schema yang belum masuk snapshot/DDL.
    expect([...skema].filter((nama) => !snapshot.has(nama)).sort()).toEqual([]);
    expect([...snapshot].filter((nama) => !skema.has(nama)).sort()).toEqual([]);
    expect(skema.size).toBeGreaterThan(0);
  });

  it("entri journal terakhir memakai timestamp terbesar", () => {
    const journal = JSON.parse(fs.readFileSync(MIGRATIONS_DIR + "meta/_journal.json", "utf8")) as {
      entries: Array<{ idx: number; tag: string; when: number }>;
    };

    // Drizzle MySQL hanya menjalankan migration dengan folderMillis di atas
    // migration terakhir yang tercatat. Migration baru yang `when`-nya lebih
    // kecil akan dilewati walau `db:migrate` melaporkan sukses.
    const terakhir = journal.entries.at(-1);
    expect(terakhir).toBeDefined();
    expect(terakhir!.when).toBe(Math.max(...journal.entries.map((entri) => entri.when)));
  });

  it("setiap entri journal memiliki berkas snapshot", () => {
    const journal = JSON.parse(fs.readFileSync(MIGRATIONS_DIR + "meta/_journal.json", "utf8")) as {
      entries: Array<{ idx: number; tag: string }>;
    };
    const ada = new Set(
      fs
        .readdirSync(META_DIR)
        .filter((nama) => /^\d{4}_snapshot\.json$/.test(nama))
        .map((nama) => nama.replace("_snapshot.json", "")),
    );

    const hilang = journal.entries
      .filter((entri) => !ada.has(String(entri.idx).padStart(4, "0")))
      .map((entri) => entri.tag);

    expect(hilang).toEqual([]);
  });
  it("setiap pernyataan migrasi dipisah statement-breakpoint", () => {
    // Drizzle mengeksekusi isi berkas per potongan `--> statement-breakpoint`.
    // Dua pernyataan yang menyatu dikirim sebagai satu query, MySQL menolaknya
    // dengan `ER_PARSE_ERROR`, lalu `db:migrate` dan seluruh integration test
    // gagal pada database kosong.
    const pelanggaran: string[] = [];

    for (const { berkas, isi } of berkasSqlMigrasi()) {
      isi.split("--> statement-breakpoint").forEach((potongan, posisi) => {
        const pernyataan = [
          ...potongan.matchAll(
            /^[ \t]*(ALTER|CREATE|DROP|INSERT|UPDATE|DELETE|TRUNCATE|RENAME)\b/gim,
          ),
        ];
        if (pernyataan.length > 1) {
          pelanggaran.push(`${berkas} potongan ${posisi + 1}`);
        }
      });
    }

    expect(pelanggaran).toEqual([]);
  });
});
