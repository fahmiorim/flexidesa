import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { RUTE_ADMIN_TERSEDIA } from "./menu-tampil";

/**
 * Kesesuaian registry menu ↔ filesystem App Router.
 *
 * `RUTE_ADMIN_TERSEDIA` adalah daftar eksplisit; test ini memastikan tidak ada
 * entri yang menunjuk halaman yang tidak ada (tautan mati di sidebar). Arah
 * sebaliknya (halaman tanpa entri) disengaja dibiarkan: halaman cetak/detail
 * tidak perlu terdaftar sebagai tujuan menu.
 */

const ADMIN_ROOT = join(process.cwd(), "src", "app", "(admin)");

function ruteDariFile(file: string): string {
  const rel = relative(ADMIN_ROOT, file).replaceAll("\\", "/");
  // Route group Next.js (segmen dalam tanda kurung) tidak menjadi segmen URL,
  // jadi struktur fisik `(admin)/(info-desa)/profil-desa` tetap ber-URL `/profil-desa`.
  const segmen = rel
    .replace(/\/page\.tsx$/, "")
    .split("/")
    .filter((segmen) => segmen !== "" && !segmen.startsWith("("));
  return `/${segmen.join("/")}`;
}

function semuaHalamanAdmin(): Set<string> {
  const found = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry === "page.tsx") {
        found.add(ruteDariFile(full));
      }
    }
  };
  if (existsSync(ADMIN_ROOT)) walk(ADMIN_ROOT);
  return found;
}

describe("kesesuaian menu-route", () => {
  it("setiap rute di RUTE_ADMIN_TERSEDIA memiliki page.tsx di filesystem", () => {
    const halaman = semuaHalamanAdmin();
    expect(halaman.size).toBeGreaterThan(0);

    const hilang = RUTE_ADMIN_TERSEDIA.filter((route) => !halaman.has(route));
    expect(hilang).toEqual([]);
  });
});
