import { describe, expect, it } from "vitest";

import configEsensi from "./esensi/1.0.0/config.json";
import configNatra from "./natra/1.0.0/config.json";
import { ALIAS_SLUG_TEMA, daftarKunciRegistry, slugTerdaftar, validasiRegistry } from "./registry";
import { migrasiOpsiVersi, parseConfigOpsi, SURFACE_WAJIB, validasiOpsiTenant } from "./types";

describe("registry tema", () => {
  it("memvalidasi semua paket: surface wajib lengkap, opsi terbaca", () => {
    expect(validasiRegistry()).toEqual([]);
  });

  it("mengandung esensi dan natra", () => {
    expect(daftarKunciRegistry()).toEqual(expect.arrayContaining(["esensi@1.0.0", "natra@1.0.0"]));
    expect(slugTerdaftar().has("esensi")).toBe(true);
    expect(slugTerdaftar().has("natra")).toBe(true);
  });

  it("menolak slug/versi asing (tidak terdaftar)", async () => {
    const { resolveTema } = await import("./registry");
    expect(resolveTema("kejahatan", "9.9.9")).toBeNull();
    expect(resolveTema("esensi", "9.9.9")).toBeNull();
    expect(resolveTema(null, null)).toBeNull();
  });

  it("alias samudra-modern dipetakan eksplisit ke natra", async () => {
    const { resolveTema } = await import("./registry");
    expect(ALIAS_SLUG_TEMA["samudra-modern@1.0.0"]).toBe("natra@1.0.0");
    expect(resolveTema("samudra-modern", "1.0.0")?.manifest.slug).toBe("natra");
  });

  it("config natra 7 key, esensi 2 key (paritas OpenSID)", () => {
    const natra = parseConfigOpsi(configNatra);
    const esensi = parseConfigOpsi(configEsensi);
    expect(natra).toHaveLength(7);
    expect(esensi).toHaveLength(2);
    expect(natra.map((o) => o.key)).toEqual(
      expect.arrayContaining([
        "warna_dasar",
        "statistik_desa",
        "jam",
        "pintasan_masuk",
        "foto_tidak_tersedia",
        "jumlah_pembangunan_perhalaman",
        "jumlah_pengaduan_perhalaman",
      ]),
    );
  });

  it("migrasi opsi: nilai valid dipertahankan, asing dibuang + peringatan", () => {
    const natra = parseConfigOpsi(configNatra);
    const { opsi, peringatan } = migrasiOpsiVersi(
      { warna_dasar: "#123456", key_usang: 1, jumlah_pembangunan_perhalaman: 99 },
      natra,
    );
    expect(opsi.warna_dasar).toBe("#123456");
    expect(opsi.jumlah_pembangunan_perhalaman).toBe(50); // dijepit ke max 50
    expect(peringatan).toHaveLength(1);
  });

  it("validasi opsi: jumlah per halaman dijepit 1..50", () => {
    const natra = parseConfigOpsi(configNatra);
    const out = validasiOpsiTenant(natra, { jumlah_pengaduan_perhalaman: 0 });
    expect(out.jumlah_pengaduan_perhalaman).toBe(1);
  });

  it("semua tema menyediakan semua surface wajib", () => {
    for (const d of SURFACE_WAJIB) expect(d).toBeDefined();
  });

  it("setiap paket menyediakan renderer halaman dan widget", async () => {
    const { TEMA_REGISTRY } = await import("./registry");
    for (const [kunci, paket] of Object.entries(TEMA_REGISTRY)) {
      for (const surface of SURFACE_WAJIB) {
        expect(typeof paket.pages[surface], `${kunci} pages.${surface}`).toBe("function");
      }
      for (const widget of ["jam", "statistik", "fotoFallback"] as const) {
        expect(typeof paket.widgets[widget], `${kunci} widgets.${widget}`).toBe("function");
      }
    }
  });

  it("setiap paket memiliki renderer komponen untuk semua surface wajib", async () => {
    const { TEMA_REGISTRY } = await import("./registry");
    for (const definisi of Object.values(TEMA_REGISTRY)) {
      for (const surface of SURFACE_WAJIB) {
        expect(typeof definisi.pages[surface], `${definisi.manifest.slug}.pages.${surface}`).toBe(
          "function",
        );
      }
    }
  });
});
