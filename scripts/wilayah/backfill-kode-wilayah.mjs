/**
 * Isi kode BPS dan kode pos desa lama dari dataset wilayah.
 *
 * Default hanya menampilkan rencana perubahan (dry-run). Jalankan dengan
 * `--apply` untuk menulis ke database. Nilai yang sudah terisi tidak ditimpa,
 * sehingga koreksi manual administrator tetap aman.
 *
 * Pemakaian:
 *   npm run db:backfill-wilayah
 *   npm run db:backfill-wilayah -- --apply
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const akar = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const terapkan = process.argv.includes("--apply");

if (existsSync(resolve(akar, ".env"))) process.loadEnvFile(resolve(akar, ".env"));
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL belum diatur. Periksa berkas .env.");
  process.exit(1);
}

const detail = JSON.parse(
  readFileSync(resolve(akar, "src/features/wilayah/data/detail-desa.json"), "utf8"),
);

function kodeBersih(code) {
  return String(code ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

const koneksi = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [desa] = await koneksi.query(
    "SELECT id, name, code, bps_code, postal_code FROM villages ORDER BY id",
  );

  const perubahan = [];
  let sudahLengkap = 0;
  let tanpaDetail = 0;

  for (const baris of desa) {
    const kode = kodeBersih(baris.code);
    const info = detail[kode];

    if (baris.bps_code && baris.postal_code) {
      sudahLengkap += 1;
      continue;
    }
    if (!info) {
      tanpaDetail += 1;
      continue;
    }

    perubahan.push({
      id: baris.id,
      nama: baris.name,
      kode,
      kodeBps: info[0],
      kodePos: info[1],
      isiBps: !baris.bps_code,
      isiPos: !baris.postal_code,
    });
  }

  console.log(`Desa diperiksa: ${desa.length}`);
  console.log(`Sudah lengkap: ${sudahLengkap}`);
  console.log(`Tanpa detail wilayah: ${tanpaDetail}`);
  console.log(`Akan diperbarui: ${perubahan.length}`);

  for (const item of perubahan) {
    console.log(
      `- #${item.id} ${item.nama} (${item.kode}): ` +
        `${item.isiBps ? `BPS ${item.kodeBps}` : "BPS tetap"} · ` +
        `${item.isiPos ? `pos ${item.kodePos}` : "pos tetap"}`,
    );
  }

  if (!terapkan) {
    console.log("\nDry-run. Tambahkan --apply untuk menyimpan perubahan.");
  } else if (perubahan.length) {
    await koneksi.beginTransaction();
    try {
      for (const item of perubahan) {
        await koneksi.execute(
          `UPDATE villages
              SET bps_code = COALESCE(NULLIF(bps_code, ''), ?),
                  postal_code = COALESCE(NULLIF(postal_code, ''), ?)
            WHERE id = ?`,
          [item.kodeBps, item.kodePos, item.id],
        );
      }
      await koneksi.commit();
      console.log(`\n${perubahan.length} desa diperbarui.`);
    } catch (error) {
      await koneksi.rollback();
      throw error;
    }
  } else {
    console.log("\nTidak ada perubahan yang perlu disimpan.");
  }
} finally {
  await koneksi.end();
}
