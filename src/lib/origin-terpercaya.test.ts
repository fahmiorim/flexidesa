import { describe, expect, it } from "vitest";

import { asalTerdipercaya } from "@/lib/origin-terpercaya";

describe("asalTerdipercaya", () => {
  it("mempercayai host tenant dev beserta port-nya", () => {
    const origins = asalTerdipercaya({
      appUrl: "http://flexidesa.test:3000",
      authUrl: "http://flexidesa.test:3000",
      baseDomain: "flexidesa.test",
      platformHosts: "flexidesa.test",
    });

    expect(origins).toContain("http://flexidesa.test:3000");
    expect(origins).toContain("http://*.flexidesa.test:3000");
    expect(origins.some((origin) => origin.startsWith("https://"))).toBe(false);
  });

  it("memakai skema produksi tanpa port dan tanpa pola http", () => {
    const origins = asalTerdipercaya({
      appUrl: "https://flexidesa.id",
      authUrl: "https://flexidesa.id",
      baseDomain: "desa.id",
      platformHosts: "flexidesa.id,www.flexidesa.id",
    });

    expect(origins).toContain("https://flexidesa.id");
    expect(origins).toContain("https://www.flexidesa.id");
    expect(origins).toContain("https://*.desa.id");
    expect(origins.some((origin) => origin.startsWith("http://"))).toBe(false);
  });

  it("menormalkan domain induk yang ditulis sebagai URL", () => {
    const origins = asalTerdipercaya({
      appUrl: "https://flexidesa.id",
      authUrl: "https://flexidesa.id",
      baseDomain: "https://Desa.ID/",
    });

    expect(origins).toContain("https://*.desa.id");
  });

  it("hanya memakai origin eksplisit bila domain induk kosong", () => {
    const origins = asalTerdipercaya({
      appUrl: "http://localhost:3000",
      authUrl: "http://localhost:3000",
    });

    expect(origins).toEqual(["http://localhost:3000"]);
  });

  it("mengabaikan URL yang tidak valid", () => {
    const origins = asalTerdipercaya({
      appUrl: "bukan-url",
      authUrl: "http://localhost:3000",
    });

    expect(origins).toEqual(["http://localhost:3000"]);
  });
});
