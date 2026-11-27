import { describe, expect, it } from "vitest";

import {
  grupMenuPlatform,
  MENU_PLATFORM,
  menuPlatformAktif,
  submenuPlatformAktif,
} from "./menu-platform";

describe("menuPlatformAktif", () => {
  it("hanya menandai Ringkasan aktif tepat di /super-admin", () => {
    expect(menuPlatformAktif("/super-admin", "/super-admin")).toBe(true);
    expect(menuPlatformAktif("/super-admin", "/super-admin/tenant")).toBe(false);
  });

  it("menandai halaman menu aktif pada sub-rutenya", () => {
    expect(menuPlatformAktif("/super-admin/domain", "/super-admin/domain")).toBe(true);
    expect(menuPlatformAktif("/super-admin/domain", "/super-admin/domain/12")).toBe(true);
    expect(menuPlatformAktif("/super-admin/tenant", "/super-admin/domain")).toBe(false);
  });

  it("memisahkan menu Tenant dan Domain", () => {
    expect(menuPlatformAktif("/super-admin/tenant", "/super-admin/tenant")).toBe(true);
    expect(menuPlatformAktif("/super-admin/tenant", "/super-admin/tenant/tambah")).toBe(true);
    expect(menuPlatformAktif("/super-admin/tenant", "/super-admin/tenant-lain")).toBe(false);
    expect(menuPlatformAktif("/super-admin/tenant", "/super-admin/domain")).toBe(false);
    expect(menuPlatformAktif("/super-admin/tenant", "/super-admin/domain/12")).toBe(false);
  });

  it("tidak salah mencocokkan prefiks yang mirip", () => {
    expect(menuPlatformAktif("/super-admin/audit", "/super-admin/audit-lain")).toBe(false);
  });
});

describe("submenuPlatformAktif", () => {
  const anak = [
    { href: "/super-admin/domain", label: "Daftar Domain" },
    { href: "/super-admin/domain/tambah", label: "Tambah Domain" },
  ];

  it("memilih submenu paling spesifik", () => {
    expect(submenuPlatformAktif(anak, "/super-admin/domain/tambah")).toBe(
      "/super-admin/domain/tambah",
    );
    expect(submenuPlatformAktif(anak, "/super-admin/domain/12")).toBe("/super-admin/domain");
    expect(submenuPlatformAktif(anak, "/super-admin/domain")).toBe("/super-admin/domain");
  });

  it("tidak menandai submenu pada halaman di luar prefiksnya", () => {
    expect(submenuPlatformAktif(anak, "/super-admin/audit")).toBeNull();
  });
});

describe("MENU_PLATFORM", () => {
  it("memuat sembilan menu konsol dengan tautan unik", () => {
    expect(MENU_PLATFORM).toHaveLength(9);
    expect(new Set(MENU_PLATFORM.map((item) => item.href)).size).toBe(9);
    expect(MENU_PLATFORM[0]?.href).toBe("/super-admin");
    expect(MENU_PLATFORM.every((item) => item.href.startsWith("/super-admin"))).toBe(true);
  });

  it("memberi grup berlabel pada setiap item", () => {
    expect(MENU_PLATFORM.every((item) => item.grup.trim().length > 0)).toBe(true);
  });

  it("menautkan Tenant ke halaman tenant tanpa mencampurnya dengan domain", () => {
    const tenant = MENU_PLATFORM.find((item) => item.href === "/super-admin/tenant");
    const domain = MENU_PLATFORM.find((item) => item.href === "/super-admin/domain");

    expect(tenant?.label).toBe("Tenant");
    expect(tenant?.submenu).toBeUndefined();
    expect(tenant?.ruteTambahan).toBeUndefined();
    expect(domain?.label).toBe("Domain & infrastruktur");
    expect(domain?.grup).not.toBe(tenant?.grup);
    expect(MENU_PLATFORM.some((item) => item.href === "/super-admin/domain/tambah")).toBe(false);
  });

  it("menautkan katalog paket dan penetapan tenant tepat di bawah Tenant", () => {
    const paket = MENU_PLATFORM.find((item) => item.href === "/super-admin/paket");
    const urutan = MENU_PLATFORM.map((item) => item.href);

    expect(paket?.submenu?.map((item) => item.href)).toEqual([
      "/super-admin/paket",
      "/super-admin/paket/tenant",
    ]);
    expect(urutan.indexOf("/super-admin/paket")).toBe(urutan.indexOf("/super-admin/tenant") + 1);
  });

  it("menyediakan menu backup & restore untuk operasi manual", () => {
    const backup = MENU_PLATFORM.find((item) => item.href === "/super-admin/backup");

    expect(backup?.label).toBe("Backup & restore");
    expect(backup?.grup).toBe("Operasional");
  });

  it("menautkan katalog, penggunaan, dan fondasi template pada submenu", () => {
    const template = MENU_PLATFORM.find((item) => item.href === "/super-admin/template");
    expect(template?.submenu?.map((item) => item.href)).toEqual([
      "/super-admin/template",
      "/super-admin/template/penggunaan",
      "/super-admin/template/fondasi",
    ]);
  });
});

describe("grupMenuPlatform", () => {
  it("mengelompokkan menu sesuai urutan tanpa kehilangan item", () => {
    const grup = grupMenuPlatform();

    expect(grup.map((kelompok) => kelompok.grup)).toEqual([
      "Menu utama",
      "Tenant",
      "Domain & infrastruktur",
      "Platform",
      "Operasional",
    ]);
    expect(grup.flatMap((kelompok) => kelompok.item)).toHaveLength(MENU_PLATFORM.length);
  });
});
