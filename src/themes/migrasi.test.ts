import { describe, expect, it } from "vitest";

import { definisiOpsiTema, migrasiOpsiUntukTema, validasiOpsiUntukTema } from "./migrasi";

describe("migrasi opsi tema", () => {
  it("mengembalikan definisi paket terdaftar", () => {
    const definisi = definisiOpsiTema("cakrawala", "1.0.0");
    expect(definisi?.map((item) => item.key)).toContain("warna_dasar");
    expect(definisiOpsiTema("arunika", "1.0.0")).toHaveLength(2);
  });

  it("menolak slug/versi tanpa paket kode", () => {
    expect(definisiOpsiTema("tema-asing", "1.0.0")).toBeNull();
    expect(migrasiOpsiUntukTema("tema-asing", "1.0.0", {})).toBeNull();
    expect(validasiOpsiUntukTema("arunika", "9.9.9", {})).toBeNull();
  });

  it("memigrasikan opsi lama: nilai valid dipertahankan, key asing dilaporkan", () => {
    const hasil = migrasiOpsiUntukTema("cakrawala", "1.0.0", {
      warna_dasar: "#123456",
      statistik_desa: "0",
      key_lama: "x",
    });
    expect(hasil?.opsi.warna_dasar).toBe("#123456");
    expect(hasil?.opsi.statistik_desa).toBe("0");
    expect(hasil?.opsi.jam).toBe("1"); // default paket
    expect(hasil?.peringatan).toHaveLength(1);
  });

  it("samudra memakai schema sendiri dengan default teal", () => {
    const hasil = migrasiOpsiUntukTema("samudra", "1.0.0", { jam: "0" });
    expect(hasil?.opsi.jam).toBe("0");
    expect(hasil?.opsi.warna_dasar).toBe("#0e7a6d");
    expect(hasil?.peringatan).toHaveLength(0);
  });

  it("validasi membuang opsi di luar schema tanpa peringatan", () => {
    const nilai = validasiOpsiUntukTema("cakrawala", "1.0.0", { warna_dasar: "bukan-warna" });
    expect(nilai?.warna_dasar).toBe("#a93526");
    expect(nilai && "key_lama" in nilai).toBe(false);
  });
});
