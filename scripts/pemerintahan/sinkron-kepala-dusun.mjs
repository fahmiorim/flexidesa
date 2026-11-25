/**
 * Sinkronkan kepala dusun yang sudah diangkat menjadi aparat desa.
 *
 * Fitur sinkronisasi otomatis berjalan saat kepala wilayah disimpan. Script ini
 * dipakai sekali untuk data lama: setiap dusun yang sudah punya kepala tertaut
 * penduduk dibuatkan/p diperbarui aparat "Kepala Dusun <nama dusun>".
 *
 * Default hanya menampilkan rencana (dry-run). Jalankan dengan `--apply` untuk
 * menulis ke database.
 *
 * Pemakaian:
 *   npm run db:sinkron-kepala-dusun
 *   npm run db:sinkron-kepala-dusun -- --apply
 */
import { existsSync } from "node:fs";
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

const slugDusun = (dusun) =>
  `kepala-dusun-${
    String(dusun)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "wilayah"
  }`.slice(0, 100);

const koneksi = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [dusun] = await koneksi.query(
    `SELECT r.id, r.village_id, r.dusun, r.kepala_resident_id, p.name AS nama_penduduk
       FROM regions r
       LEFT JOIN residents p ON p.id = r.kepala_resident_id AND p.village_id = r.village_id
      WHERE r.dusun IS NOT NULL AND r.dusun <> ''
        AND (r.rw IS NULL OR r.rw = '') AND (r.rt IS NULL OR r.rt = '')
        AND r.kepala_resident_id IS NOT NULL
      ORDER BY r.village_id, r.sort_order, r.id`,
  );

  console.log(`Dusun berkepala penduduk: ${dusun.length}`);

  // Kepala desa aktif menjadi atasan langsung kepala dusun pada bagan.
  const kadesPerDesa = new Map();
  const [kades] = await koneksi.query(
    `SELECT pd.village_id, MIN(pd.id) AS id
       FROM perangkat_desa pd
       JOIN jabatan_perangkat jp ON jp.id = pd.jabatan_id AND jp.village_id = pd.village_id
      WHERE pd.status = 'aktif' AND jp.jenis = 'kades'
      GROUP BY pd.village_id`,
  );
  for (const baris of kades) kadesPerDesa.set(baris.village_id, baris.id);

  const rencana = [];
  for (const baris of dusun) {
    const [tautan] = await koneksi.query(
      "SELECT id, jabatan_id FROM perangkat_desa WHERE village_id = ? AND wilayah_id = ? LIMIT 1",
      [baris.village_id, baris.id],
    );
    const slug = slugDusun(baris.dusun);
    const [jabatan] = await koneksi.query(
      "SELECT id FROM jabatan_perangkat WHERE village_id = ? AND slug = ? LIMIT 1",
      [baris.village_id, slug],
    );

    rencana.push({
      wilayahId: baris.id,
      villageId: baris.village_id,
      dusun: baris.dusun,
      nama: baris.nama_penduduk ?? `Kepala Dusun ${baris.dusun}`,
      residentId: baris.kepala_resident_id,
      perangkatId: tautan[0]?.id ?? null,
      jabatanId: jabatan[0]?.id ?? null,
      atasanId: kadesPerDesa.get(baris.village_id) ?? null,
      slug,
    });
  }

  for (const item of rencana) {
    console.log(
      `- #${item.wilayahId} ${item.dusun} (desa ${item.villageId}): ` +
        `${item.nama} · ${item.perangkatId ? `perbarui aparat #${item.perangkatId}` : "buat aparat"}` +
        `${item.atasanId ? ` · atasan kades #${item.atasanId}` : ""}` +
        `${item.jabatanId ? "" : " · jabatan baru"}`,
    );
  }

  if (!terapkan) {
    console.log("\nDry-run. Tambahkan --apply untuk menyimpan perubahan.");
  } else if (rencana.length) {
    await koneksi.beginTransaction();
    try {
      for (const item of rencana) {
        let jabatanId = item.jabatanId;
        if (!jabatanId) {
          const [[maksJabatan]] = await koneksi.query(
            "SELECT COALESCE(MAX(urut), 0) AS maks FROM jabatan_perangkat WHERE village_id = ?",
            [item.villageId],
          );
          const [hasil] = await koneksi.execute(
            "INSERT INTO jabatan_perangkat (village_id, nama, slug, jenis, urut) VALUES (?, ?, ?, 'lainnya', ?)",
            [
              item.villageId,
              `Kepala Dusun ${item.dusun}`.slice(0, 100),
              item.slug,
              Number(maksJabatan.maks) + 1,
            ],
          );
          jabatanId = hasil.insertId;
        }

        if (item.perangkatId) {
          await koneksi.execute(
            `UPDATE perangkat_desa
                SET nama = ?, resident_id = ?, jabatan_id = ?, status = 'aktif',
                    atasan_id = COALESCE(atasan_id, ?), updated_at = NOW()
              WHERE id = ? AND village_id = ?`,
            [
              item.nama,
              item.residentId,
              jabatanId,
              item.atasanId,
              item.perangkatId,
              item.villageId,
            ],
          );
          continue;
        }

        const [[maksPerangkat]] = await koneksi.query(
          "SELECT COALESCE(MAX(urut), 0) AS maks FROM perangkat_desa WHERE village_id = ?",
          [item.villageId],
        );
        await koneksi.execute(
          `INSERT INTO perangkat_desa
             (village_id, nama, resident_id, jabatan_id, wilayah_id, atasan_id, status, kehadiran, urut)
           VALUES (?, ?, ?, ?, ?, ?, 'aktif', 1, ?)`,
          [
            item.villageId,
            item.nama,
            item.residentId,
            jabatanId,
            item.wilayahId,
            item.atasanId,
            Number(maksPerangkat.maks) + 1,
          ],
        );
      }
      await koneksi.commit();
      console.log(`\n${rencana.length} kepala dusun disinkronkan.`);
    } catch (error) {
      await koneksi.rollback();
      throw error;
    }
  } else {
    console.log("\nTidak ada kepala dusun yang perlu disinkronkan.");
  }
} finally {
  await koneksi.end();
}
