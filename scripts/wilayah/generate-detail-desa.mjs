/**
 * Bangun pemetaan detail desa: kode Kemendagri → [kode BPS, kode pos].
 *
 * Sumber:
 * - Relasi resmi BPS ↔ Kemendagri (periode 2025 Semester 2):
 *   https://sig.bps.go.id/bridging-kode/index
 *   Dump PostgreSQL: github.com/afdhlzkr/data-wilayah-indonesia (MIT).
 * - Kode pos per kode Kemendagri: github.com/cahyadsn/wilayah_kodepos (MIT),
 *   berdasarkan Kepmendagri 2025.
 *
 * Jalankan manual saat dataset wilayah diperbarui:
 *   node scripts/wilayah/generate-detail-desa.mjs <data_wilayah_indonesia.sql> <wilayah_kodepos.sql>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [sumberBps, sumberKodepos] = process.argv.slice(2);
if (!sumberBps || !sumberKodepos) {
  throw new Error("Sebutkan berkas SQL relasi BPS dan kode pos sebagai argumen.");
}

const barisBps = fs.readFileSync(sumberBps, "utf8").split(/\r?\n/);
const barisKodepos = fs.readFileSync(sumberKodepos, "utf8").split(/\r?\n/);

const polaKodepos = /^\('(\d{2}\.\d{2}\.\d{2}\.\d{4})',\s*'(\d{5})'\)/;

const bpsPerKemendagri = new Map();
for (const baris of barisBps) {
  // Format COPY: periode, nama periode, level, kode_bps, nama_bps,
  // kode_kemendagri, nama_kemendagri, parent_bps, parent_kemendagri.
  const kolom = baris.split("\t");
  if (kolom[2] !== "kelurahan" || !kolom[3] || !kolom[5] || kolom[5] === "\\N") continue;
  bpsPerKemendagri.set(kolom[5].replaceAll(".", ""), kolom[3]);
}

const kodeposPerKemendagri = new Map();
for (const baris of barisKodepos) {
  const cocok = baris.match(polaKodepos);
  if (!cocok) continue;
  kodeposPerKemendagri.set(cocok[1].replaceAll(".", ""), cocok[2]);
}

const hasil = {};
for (const [kode, kodeBps] of [...bpsPerKemendagri].sort(([a], [b]) => a.localeCompare(b))) {
  hasil[kode] = [kodeBps, kodeposPerKemendagri.get(kode) ?? ""];
}

const tujuan = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src/features/wilayah/data/detail-desa.json",
);
fs.writeFileSync(tujuan, `${JSON.stringify(hasil)}\n`);

console.log(`Ditulis ${Object.keys(hasil).length} baris ke ${tujuan}`);
