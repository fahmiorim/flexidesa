import { describe, expect, it } from "vitest";

import { definisiOpsiTema, migrasiOpsiUntukTema, validasiOpsiUntukTema } from "./migrasi";

describe("migrasi opsi tema", () => {
  it("mengembalikan definisi paket terdaftar", () => {
    const definisi = definisiOpsiTema("natra", "1.0.0");
    expect(definisi?.map((item) => item.key)).toContain("warna_dasar");
    expect(definisiOpsiTema("esensi", "1.0.0")).toHaveLength(2);
  });

  it("menolak slug/versi tanpa paket kode", () => {
    expect(definisiOpsiTema("tema-asing", "1.0.0")).toBeNull();
    expect(migrasiOpsiUntukTema("tema-asing", "1.0.0", {})).toBeNull();
    expect(validasiOpsiUntukTema("esensi", "9.9.9", {})).toBeNull();
  });

  it("memigrasikan opsi lama: nilai valid dipertahankan, key asing dilaporkan", () => {
    const hasil = migrasiOpsiUntukTema("natra", "1.0.0", {
      warna_dasar: "#123456",
      statistik_desa: "0",
      key_lama: "x",
    });
    expect(hasil?.opsi.warna_dasar).toBe("#123456");
    expect(hasil?.opsi.statistik_desa).toBe("0");
    expect(hasil?.opsi.jam).toBe("1"); // default paket
    expect(hasil?.peringatan).toHaveLength(1);
  });

  it("alias samudra-modern memakai schema natra", () => {
    const hasil = migrasiOpsiUntukTema("samudra-modern", "1.0.0", { jam: "0" });
    expect(hasil?.opsi.jam).toBe("0");
  });

  it("validasi membuang opsi di luar schema tanpa peringatan", () => {
    const nilai = validasiOpsiUntukTema("natra", "1.0.0", { warna_dasar: "bukan-warna" });
    expect(nilai?.warna_dasar).toBe("#e64946");
    expect(nilai && "key_lama" in nilai).toBe(false);
  });
});
