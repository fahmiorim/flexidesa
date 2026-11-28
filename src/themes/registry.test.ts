import { describe, expect, it } from "vitest";

import configArunika from "./arunika/1.0.0/config.json";
import configCakrawala from "./cakrawala/1.0.0/config.json";
import { ALIAS_SLUG_TEMA, daftarKunciRegistry, slugTerdaftar, validasiRegistry } from "./registry";
import configSamudra from "./samudra/1.0.0/config.json";
import { migrasiOpsiVersi, parseConfigOpsi, SURFACE_WAJIB, validasiOpsiTenant } from "./types";

describe("registry tema", () => {
  it("memvalidasi semua paket: surface wajib lengkap, opsi terbaca", () => {
    expect(validasiRegistry()).toEqual([]);
  });

  it("mengandung arunika dan cakrawala", () => {
    expect(daftarKunciRegistry()).toEqual(expect.arrayContaining(["arunika@1.0.0", "cakrawala@1.0.0"]));
    expect(slugTerdaftar().has("arunika")).toBe(true);
    expect(slugTerdaftar().has("cakrawala")).toBe(true);
  });

  it("menolak slug/versi asing (tidak terdaftar)", async () => {
    const { resolveTema } = await import("./registry");
    expect(resolveTema("kejahatan", "9.9.9")).toBeNull();
    expect(resolveTema("arunika", "9.9.9")).toBeNull();
    expect(resolveTema(null, null)).toBeNull();
  });

  it("samudra adalah paket kode sendiri, bukan alias cakrawala", async () => {
    const { resolveTema } = await import("./registry");
    expect(ALIAS_SLUG_TEMA["samudra@1.0.0"]).toBeUndefined();
    expect(slugTerdaftar().has("samudra")).toBe(true);
    expect(resolveTema("samudra", "1.0.0")?.manifest.slug).toBe("samudra");
    expect(resolveTema("samudra", "1.0.0")).not.toBe(resolveTema("cakrawala", "1.0.0"));
  });

  it("paket samudra memakai tujuh opsi dengan default teal", () => {
    const samudra = parseConfigOpsi(configSamudra);
    expect(samudra.map((o) => o.key)).toEqual(parseConfigOpsi(configCakrawala).map((o) => o.key));
    expect(samudra.find((o) => o.key === "warna_dasar")?.default).toBe("#0e7a6d");
  });

  it("config cakrawala 7 key, arunika 2 key", () => {
    const cakrawala = parseConfigOpsi(configCakrawala);
    const arunika = parseConfigOpsi(configArunika);
    expect(cakrawala).toHaveLength(7);
    expect(arunika).toHaveLength(2);
    expect(cakrawala.map((o) => o.key)).toEqual(
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
    const cakrawala = parseConfigOpsi(configCakrawala);
    const { opsi, peringatan } = migrasiOpsiVersi(
      { warna_dasar: "#123456", key_usang: 1, jumlah_pembangunan_perhalaman: 99 },
      cakrawala,
    );
    expect(opsi.warna_dasar).toBe("#123456");
    expect(opsi.jumlah_pembangunan_perhalaman).toBe(50); // dijepit ke max 50
    expect(peringatan).toHaveLength(1);
  });

  it("validasi opsi: jumlah per halaman dijepit 1..50", () => {
    const cakrawala = parseConfigOpsi(configCakrawala);
    const out = validasiOpsiTenant(cakrawala, { jumlah_pengaduan_perhalaman: 0 });
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
