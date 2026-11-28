import { describe, expect, it } from "vitest";

import { HEADER_PLATFORM, headerPlatform } from "./header-platform";
import { MENU_PLATFORM } from "./menu-platform";

describe("HEADER_PLATFORM", () => {
  it("menyediakan header untuk setiap menu konsol", () => {
    for (const menu of MENU_PLATFORM) {
      expect(HEADER_PLATFORM[menu.href], `header untuk ${menu.href}`).toBeDefined();
    }
  });

  it("menyediakan header untuk setiap submenu", () => {
    for (const menu of MENU_PLATFORM) {
      for (const sub of menu.submenu ?? []) {
        expect(HEADER_PLATFORM[sub.href], `header untuk ${sub.href}`).toBeDefined();
      }
    }
  });

  it("memakai eyebrow dan deskripsi yang terisi", () => {
    for (const header of Object.values(HEADER_PLATFORM)) {
      expect(header.eyebrow.length).toBeGreaterThan(0);
      expect(header.title.length).toBeGreaterThan(0);
      expect(header.description.length).toBeGreaterThan(0);
    }
  });
});

describe("headerPlatform", () => {
  it("mengembalikan header rute yang tepat", () => {
    expect(headerPlatform("/super-admin/audit").title).toBe("Audit Trail");
    expect(headerPlatform("/super-admin").title).toBe("Ringkasan");
  });

  it("memberi konteks detail tenant pada sub-rute ber-id", () => {
    const header = headerPlatform("/super-admin/tenant/12");
    expect(header.title).toBe("Detail Tenant");
    expect(header.remah).toEqual([{ label: "Tenant", href: "/super-admin/tenant" }]);
    expect(headerPlatform("/super-admin/tenant/tambah").title).toBe("Tambah tenant");
  });

  it("memberi remah Domain pada halaman domain", () => {
    expect(headerPlatform("/super-admin/domain").remah).toEqual([{ label: "Domain" }]);
    expect(headerPlatform("/super-admin/domain").title).toBe("Domain");
    expect(headerPlatform("/super-admin/domain").eyebrow).toBe("Desa & Tenant");
  });

  it("memisahkan remah Tenant dari Domain", () => {
    expect(headerPlatform("/super-admin/tenant").remah).toEqual([{ label: "Tenant" }]);
    expect(headerPlatform("/super-admin/tenant").eyebrow).toBe("Desa & Tenant");
    expect(headerPlatform("/super-admin/domain").eyebrow).toBe("Desa & Tenant");
  });

  it("memakai header Domain untuk rute tambah lama yang dialihkan", () => {
    const header = headerPlatform("/super-admin/domain/tambah");

    expect(header.title).toBe("Domain");
    expect(header.remah).toEqual([{ label: "Domain" }]);
  });

  it("menampilkan breadcrumb Detail Domain untuk id domain dinamis", () => {
    const header = headerPlatform("/super-admin/domain/12");

    expect(header.title).toBe("Detail Domain");
    expect(header.remah).toEqual([
      { label: "Domain" },
      { label: "Domain", href: "/super-admin/domain" },
    ]);
  });

  it("jatuh ke ringkasan untuk pathname yang tidak dikenal", () => {
    expect(headerPlatform("/super-admin/tidak-ada").title).toBe("Ringkasan");
  });
});
