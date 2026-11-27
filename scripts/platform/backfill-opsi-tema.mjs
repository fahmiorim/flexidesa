// Backfill `theme.opsi.templateOptions` dari `templateTokens` lama.
//
// Aman dijalankan lokal/non-produksi. Default: dry-run (hanya laporan).
// Jalankan dengan --eksekusi untuk menulis. Jangan dijalankan terhadap
// produksi tanpa persetujuan eksplisit dan backup.
const eksekusi = process.argv.includes("--eksekusi");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL belum di-set");
  process.exit(1);
}

const DEFAULT_NATRA = {
  jumlah_pengaduan_perhalaman: 10,
  jumlah_pembangunan_perhalaman: 10,
};
const DEFAULT_ESENSI = {
  jumlah_pengaduan_perhalaman: 10,
  jumlah_pembangunan_perhalaman: 10,
};

function opsiUntuk(slug) {
  const base =
    slug === "natra" || slug === "samudra-modern" ? { ...DEFAULT_NATRA } : { ...DEFAULT_ESENSI };
  // token layout legacy: modern/gelap dipertahankan via alias natra.
  return base;
}

async function main() {
  let pool;
  try {
    pool = (await import("mysql2/promise")).createPool({ uri: DATABASE_URL });
  } catch {
    const { createPool } = await import("mysql2/promise");
    pool = createPool({ uri: DATABASE_URL });
  }
  const [rows] = await pool.query(
    "SELECT id, village_id, slug, versi, opsi FROM theme WHERE aktif = 1",
  );
  let berubah = 0;
  for (const row of rows) {
    let parsed = null;
    try {
      parsed = JSON.parse(row.opsi ?? "{}");
    } catch {
      parsed = {};
    }
    const templateOptions = opsiUntuk(row.slug);
    // samudra-modern -> natra (alias eksplisit di registry).
    const slugBaru = row.slug === "samudra-modern" ? "natra" : row.slug;
    const baru = {
      ...parsed,
      templateOptions,
      templateTokens: parsed.templateTokens ?? null,
    };
    console.log(
      `${row.id} village=${row.village_id} ${row.slug}@${row.versi} -> ${slugBaru} options=${JSON.stringify(templateOptions)}`,
    );
    if (eksekusi) {
      await pool.query("UPDATE theme SET slug = ?, opsi = ? WHERE id = ?", [
        slugBaru,
        JSON.stringify(baru),
        row.id,
      ]);
      berubah++;
    }
  }
  console.log(
    eksekusi
      ? `Eksekusi: ${berubah} baris diubah`
      : "Dry-run: tidak ada yang ditulis (pakai --eksekusi untuk menulis)",
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
