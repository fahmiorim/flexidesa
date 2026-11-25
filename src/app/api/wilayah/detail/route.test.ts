import { describe, expect, it } from "vitest";

import { GET } from "./route";

function permintaan(kode?: string): Request {
  const url = new URL("http://localhost/api/wilayah/detail");
  if (kode !== undefined) url.searchParams.set("kode", kode);
  return new Request(url);
}

describe("GET /api/wilayah/detail", () => {
  it("mengembalikan kode BPS dan kode pos dari kode desa", async () => {
    const respons = await GET(permintaan("1101012001"));

    expect(respons.status).toBe(200);
    expect(respons.headers.get("Cache-Control")).toContain("max-age=86400");
    await expect(respons.json()).resolves.toEqual({
      data: { kodeBps: "1103020002", kodePos: "23773" },
    });
  });

  it("menerima kode desa bertitik seperti dari picker wilayah", async () => {
    const respons = await GET(permintaan("11.01.01.2001"));

    expect(respons.status).toBe(200);
    await expect(respons.json()).resolves.toEqual({
      data: { kodeBps: "1103020002", kodePos: "23773" },
    });
  });

  it("mengembalikan 404 untuk kode yang tidak valid atau tanpa detail", async () => {
    for (const kode of [undefined, "123", "9999999999"]) {
      const respons = await GET(permintaan(kode));
      expect(respons.status).toBe(404);
      expect(respons.headers.get("Cache-Control")).toBeNull();
    }
  });
});
