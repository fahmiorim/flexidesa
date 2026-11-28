import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { BASELINE_UI_ADMIN } from "./ui-guard-baseline";

/**
 * Guard UI admin.
 *
 * Halaman admin harus memakai `Button`, `ButtonLink`, dan `Table` bersama.
 *
 * - `<table>` mentah di halaman non-cetak: nol toleransi, di admin maupun
 *   komponen fitur. Halaman cetak dikecualikan karena memakai layout cetak
 *   khusus yang tidak cocok dengan `TableScroll`.
 * - `<button>` mentah masih memakai baseline ratchet: angka lama boleh
 *   dipertahankan, tetapi tidak boleh naik dan berkas baru tidak boleh
 *   menambah tombol mentah.
 */
const AKAR_ADMIN = path.join(process.cwd(), "src", "app", "(admin)");
const AKAR_FITUR = path.join(process.cwd(), "src", "features");
const AKAR_SUPER_ADMIN = path.join(AKAR_ADMIN, "super-admin");
const CETAK = /\/cetak\//;
const POLA_TOMBOL = /<button(?=[\s>])/g;
const POLA_TABEL = /<table(?=[\s>])/g;
const POLA_INPUT = /<(input|select)(?=[\s>])/g;
const POLA_ANCHOR_TOMBOL = /<a[^>]*className="button/g;
const POLA_DATA_TABLE = /data-table/;

function daftarBerkas(direktori: string): string[] {
  return readdirSync(direktori, { withFileTypes: true }).flatMap((entri) => {
    const penuh = path.join(direktori, entri.name);
    if (entri.isDirectory()) return daftarBerkas(penuh);
    if (!entri.name.endsWith(".tsx") || entri.name.endsWith(".test.tsx")) return [];
    return [penuh];
  });
}

function jalurRelatif(berkas: string): string {
  return path.relative(process.cwd(), berkas).split(path.sep).join("/");
}

function hitung(isi: string) {
  return {
    tombol: (isi.match(POLA_TOMBOL) ?? []).length,
    tabel: (isi.match(POLA_TABEL) ?? []).length,
  };
}

const BERKAS_ADMIN = daftarBerkas(AKAR_ADMIN).sort();
const BERKAS_FITUR = daftarBerkas(AKAR_FITUR).sort();

describe("guard UI admin", () => {
  it("menelusuri seluruh halaman admin dan komponen fitur", () => {
    expect(BERKAS_ADMIN.length).toBeGreaterThan(100);
    expect(BERKAS_FITUR.length).toBeGreaterThan(40);
  });

  it("tidak memakai tabel mentah di halaman non-cetak admin maupun fitur", () => {
    const pelanggaran = [...BERKAS_ADMIN, ...BERKAS_FITUR]
      .filter((berkas) => !CETAK.test(jalurRelatif(berkas)))
      .filter((berkas) => (readFileSync(berkas, "utf8").match(POLA_TABEL) ?? []).length > 0)
      .map(jalurRelatif);

    expect(pelanggaran).toEqual([]);
  });

  it("tidak memakai class data-table di admin maupun fitur", () => {
    const pelanggaran = [...BERKAS_ADMIN, ...BERKAS_FITUR]
      .filter((berkas) => POLA_DATA_TABLE.test(readFileSync(berkas, "utf8")))
      .map(jalurRelatif);

    expect(pelanggaran).toEqual([]);
  });

  it("tidak menambah tombol atau tabel mentah", () => {
    const pelanggaran: string[] = [];

    for (const berkas of BERKAS_ADMIN) {
      const jalur = jalurRelatif(berkas);
      const aktual = hitung(readFileSync(berkas, "utf8"));
      const izin = BASELINE_UI_ADMIN[jalur] ?? { tombol: 0, tabel: 0 };

      if (aktual.tombol > izin.tombol) {
        pelanggaran.push(
          `${jalur}: tombol ${aktual.tombol} > baseline ${izin.tombol} — pakai <Button>/<ButtonLink>`,
        );
      }
      if (!CETAK.test(jalur) && aktual.tabel > izin.tabel) {
        pelanggaran.push(
          `${jalur}: tabel ${aktual.tabel} > baseline ${izin.tabel} — pakai <Table>`,
        );
      }
    }

    expect(pelanggaran).toEqual([]);
  });

  it("tidak memakai input/select mentah atau tautan tombol mentah di super-admin", () => {
    const pelanggaran = daftarBerkas(AKAR_SUPER_ADMIN)
      .filter((berkas) => {
        const isi = readFileSync(berkas, "utf8");
        return (
          (isi.match(POLA_INPUT) ?? []).length > 0 ||
          (isi.match(POLA_ANCHOR_TOMBOL) ?? []).length > 0
        );
      })
      .map(jalurRelatif);

    expect(pelanggaran).toEqual([]);
  });

  it("baseline tidak menyimpan angka yang sudah turun", () => {
    const basi: string[] = [];

    for (const [jalur, izin] of Object.entries(BASELINE_UI_ADMIN)) {
      const berkas = path.join(process.cwd(), ...jalur.split("/"));
      const aktual = hitung(readFileSync(berkas, "utf8"));

      if (aktual.tombol < izin.tombol || aktual.tabel < izin.tabel) {
        basi.push(
          `${jalur}: baseline tombol/tabel ${izin.tombol}/${izin.tabel}, aktual ${aktual.tombol}/${aktual.tabel}`,
        );
      }
    }

    expect(basi).toEqual([]);
  });
});
