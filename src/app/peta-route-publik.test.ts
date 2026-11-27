import { readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

import { PETA_ROUTE_PUBLIK, SIMBOL_MEKANISME, SIMBOL_SHELL_GALERI } from "./peta-route-publik";

const AKAR = process.cwd();

function baca(berkas: string): string {
  return readFileSync(join(AKAR, berkas), "utf8");
}

/** Apakah berkas mengimpor simbol dari modul yang disebut. */
function mengimpor(sumber: string, simbol: string, dari?: string): boolean {
  const pola = new RegExp(
    `import[^;]*\\b${simbol}\\b[^;]*from\\s+["'][^"']*${dari ?? ""}[^"']*["']`,
    "s",
  );
  return pola.test(sumber);
}

describe("peta route situs publik", () => {
  it("mencakup 35 route dengan path unik", () => {
    expect(PETA_ROUTE_PUBLIK).toHaveLength(35);
    const routes = PETA_ROUTE_PUBLIK.map((item) => item.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("setiap route benar-benar memakai mekanisme tema yang dicatat", () => {
    const gagal: string[] = [];
    for (const item of PETA_ROUTE_PUBLIK) {
      const sumber = baca(item.berkas);
      if (item.mekanisme === "alias") {
        if (!item.sumber) {
          gagal.push(`${item.route}: alias tanpa sumber`);
          continue;
        }
        const impor = relative(dirname(item.berkas), item.sumber)
          .replace(/\.tsx$/, "")
          .split(sep)
          .join("/");
        if (!sumber.includes(`"${impor}"`)) gagal.push(`${item.route}: tidak meneruskan ${impor}`);
        continue;
      }
      if (item.mekanisme === "shell") {
        const simbol = item.berkas.includes("/galeri/") ? SIMBOL_SHELL_GALERI : "PublicShell";
        if (!mengimpor(sumber, simbol)) gagal.push(`${item.route}: tidak memakai ${simbol}`);
        if (!sumber.includes(`surface="${item.surface}"`))
          gagal.push(`${item.route}: surface "${item.surface}" tidak diteruskan`);
        continue;
      }
      const simbol = SIMBOL_MEKANISME[item.mekanisme];
      if (!mengimpor(sumber, simbol)) gagal.push(`${item.route}: tidak memakai ${simbol}`);
    }
    expect(gagal).toEqual([]);
  });

  it("shell meneruskan surface ke TemaRenderer", () => {
    const shell = baca("src/app/public-shell.tsx");
    expect(shell).toContain("surface={surface}");
    const galeri = baca("src/app/galeri/gallery-shell.tsx");
    expect(galeri).toContain("surface={surface}");
  });

  it("semua surface wajib terwakili di route publik", () => {
    const surface = new Set(PETA_ROUTE_PUBLIK.map((item) => item.surface));
    expect([...surface].sort()).toEqual([
      "beranda",
      "data",
      "konten",
      "layanan",
      "media",
      "profil",
    ]);
  });
});
