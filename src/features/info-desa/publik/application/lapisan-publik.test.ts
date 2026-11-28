import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard batas lapisan seluruh route aplikasi.
 *
 * Cakupannya bukan hanya route publik: admin, warga, publik, dan API
 * sama-sama wajib melewati use case, bukan mengimpor `@/db` atau folder
 * infrastructure fitur.
 */
const AKAR_APP = path.join(process.cwd(), "src", "app");
const AKAR_FITUR = path.join(process.cwd(), "src", "features");
const POLA_INFRASTRUKTUR = /from\s+["']@\/features\/[^"']+\/infrastructure\/|from\s+["']@\/db["']/;
/** Lapisan application boleh memanggil repository, tetapi tidak boleh menyentuh `db`. */
const POLA_DB = /from\s+["']@\/db(?:\/[^"']*)?["']/;
/** Impor lintas fitur wajib alias `@/`; relatif hanya untuk sefolder/CSS. */
const POLA_RELATIF_LINTAS_FITUR =
  /from\s+["']\.\.\/[^"']*features\/|from\s+["']\.\.\/[^"']*\/db["']/;

function daftarBerkas(direktori: string): string[] {
  return readdirSync(direktori, { withFileTypes: true }).flatMap((entri) => {
    const penuh = path.join(direktori, entri.name);
    if (entri.isDirectory()) return daftarBerkas(penuh);
    if (!/\.(ts|tsx)$/.test(entri.name) || /\.test\.tsx?$/.test(entri.name)) return [];
    return [penuh];
  });
}

function relatif(berkas: string): string {
  return path.relative(process.cwd(), berkas).replaceAll("\\", "/");
}

const BERKAS_APP = daftarBerkas(AKAR_APP);

describe("batas lapisan route aplikasi", () => {
  it("mencakup route admin, warga, publik, dan API", () => {
    const jalur = BERKAS_APP.map(relatif);

    expect(jalur.filter((berkas) => berkas.startsWith("src/app/(admin)/")).length).toBeGreaterThan(
      0,
    );
    expect(jalur.filter((berkas) => berkas.startsWith("src/app/(warga)/")).length).toBeGreaterThan(
      0,
    );
    expect(jalur.filter((berkas) => berkas.startsWith("src/app/(public)/")).length).toBeGreaterThan(
      0,
    );
    expect(jalur.filter((berkas) => berkas.startsWith("src/app/api/")).length).toBeGreaterThan(0);
  });

  it("tidak mengimpor infrastruktur atau db secara langsung", () => {
    const pelanggaran = BERKAS_APP.filter((berkas) =>
      POLA_INFRASTRUKTUR.test(readFileSync(berkas, "utf8")),
    ).map(relatif);

    expect(pelanggaran).toEqual([]);
  });

  it("tidak memakai impor relatif lintas fitur atau db", () => {
    const semua = [...BERKAS_APP, ...daftarBerkas(AKAR_FITUR)];
    const pelanggaran = semua
      .filter((berkas) => POLA_RELATIF_LINTAS_FITUR.test(readFileSync(berkas, "utf8")))
      .map(relatif);

    expect(pelanggaran).toEqual([]);
  });

  /**
   * `not-found.tsx` adalah berkas khusus Next.js di root app: ia ikut dipindai
   * guard di atas dan WAJIB lolos. Resolusi tema sadar-404 tidak memakai
   * `getIdentitasFromRequest` (ia memanggil `notFound()` sendiri), melainkan
   * use case application `getVillageIdByHost`/`muatTemaPublik` plus registry
   * tema statis — jadi tidak ada import infrastructure/db langsung.
   * Test ini mengunci perilaku itu agar refactor 404 tidak kembali melanggar.
   */
  it("not-found.tsx tetap lewat use case application", () => {
    const berkas = path.join(AKAR_APP, "not-found.tsx");
    expect(BERKAS_APP).toContain(berkas);

    const isi = readFileSync(berkas, "utf8");
    expect(POLA_INFRASTRUKTUR.test(isi)).toBe(false);
    expect(isi).toMatch(/getVillageIdByHost|muatTemaPublik/);
  });
});

describe("batas lapisan application fitur", () => {
  // Feature kini berkelompok per sidebar: `features/<grup>/<fitur>` untuk grup,
  // `features/<fitur>` untuk modul shared. Telusuri kedua level.
  function berkasApplicationDi(direktori: string): string[] {
    const hasil: string[] = [];
    for (const entri of readdirSync(direktori, { withFileTypes: true })) {
      if (!entri.isDirectory()) continue;
      const penuh = path.join(direktori, entri.name);
      const application = path.join(penuh, "application");
      if (existsSync(application)) {
        hasil.push(...daftarBerkas(application));
        continue;
      }
      hasil.push(...berkasApplicationDi(penuh));
    }
    return hasil;
  }
  const berkasApplication = berkasApplicationDi(AKAR_FITUR);

  it("mencakup use case beberapa fitur", () => {
    expect(berkasApplication.length).toBeGreaterThan(0);
  });

  it("tidak mengimpor db secara langsung", () => {
    const pelanggaran = berkasApplication
      .filter((berkas) => POLA_DB.test(readFileSync(berkas, "utf8")))
      .map(relatif);

    expect(pelanggaran).toEqual([]);
  });
});
