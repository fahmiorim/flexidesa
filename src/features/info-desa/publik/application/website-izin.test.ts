import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  IZIN_WEBSITE,
  MODUL_WEBSITE,
  MODUL_WEBSITE_HALAMAN,
  MODUL_WEBSITE_KONTEN,
  MODUL_WEBSITE_PENGATURAN,
} from "@/features/info-desa/publik/domain/izin-website";
import { TENANT_TEMPLATE } from "@/features/multi-desa/domain/tenant-template-data";

/**
 * Kesesuaian izin Website ↔ modul template tenant.
 *
 * Halaman Website pernah memakai slug `website-konten`/`website-halaman`/
 * `website-dashboard` yang tidak ada pada template, sehingga hanya superadmin
 * yang bisa membukanya. Test ini menjaga agar setiap resource yang dipakai
 * lapisan application Website benar-benar modul menu yang diberi grant.
 */
const slugModul = new Set(TENANT_TEMPLATE.modules.map((modul) => modul.slug));
const slugGrant = new Set(TENANT_TEMPLATE.akses.map((grant) => grant.moduleSlug));

function baca(relatif: string): string {
  return readFileSync(path.join(process.cwd(), relatif), "utf8");
}

describe("izin halaman Website", () => {
  it("memakai modul yang ada pada template tenant", () => {
    for (const modul of Object.values(IZIN_WEBSITE)) {
      expect(slugModul.has(modul), `Modul "${modul}" tidak ada di template`).toBe(true);
      expect(slugGrant.has(modul), `Modul "${modul}" tidak punya grant template`).toBe(true);
    }
  });

  it("setiap daftar modul halaman berisi modul yang dikenal template", () => {
    const daftar = [
      ...MODUL_WEBSITE,
      ...MODUL_WEBSITE_HALAMAN,
      ...MODUL_WEBSITE_KONTEN,
      ...MODUL_WEBSITE_PENGATURAN,
    ];

    for (const modul of daftar) {
      expect(slugModul.has(modul), `Modul "${modul}" tidak ada di template`).toBe(true);
    }
  });

  it("tidak lagi memakai slug halaman web yang tidak ada di template", () => {
    const berkas = [
      "src/features/info-desa/publik/application/website-admin-use-cases.ts",
      "src/features/info-desa/publik/application/website-admin.ts",
    ];

    for (const jalur of berkas) {
      expect(baca(jalur)).not.toMatch(/"(website-konten|website-halaman|website-dashboard)"/);
    }
  });
});
