import { describe, expect, it } from "vitest";

import {
  adaPerubahanBelumSimpan,
  indeksTabTujuan,
  jumlahTitikBatasDesa,
  pesanGalatBatasDesa,
  validasiUkuranLogo,
} from "./identitas-form";

const POLYGON_SAH = JSON.stringify({
  type: "Polygon",
  coordinates: [
    [
      [100, -7],
      [101, -7],
      [101, -6],
      [100, -6],
      [100, -7],
    ],
  ],
});

describe("adaPerubahanBelumSimpan", () => {
  it("bersih bila semua nilai sama", () => {
    expect(adaPerubahanBelumSimpan({ namaDesa: "Sukamaju" }, { namaDesa: "Sukamaju" })).toBe(false);
  });

  it("terdeteksi bila satu field di tab mana pun berubah", () => {
    expect(
      adaPerubahanBelumSimpan(
        { namaDesa: "Sukamaju", visi: "Maju" },
        { namaDesa: "Sukamaju", visi: "Mandiri" },
      ),
    ).toBe(true);
  });

  it("terdeteksi bila kunci hanya ada di satu sisi", () => {
    expect(adaPerubahanBelumSimpan({ batasDesa: "" }, { batasDesa: POLYGON_SAH })).toBe(true);
  });
});

describe("indeksTabTujuan", () => {
  it("panah kanan berpindah maju dan membungkus di ujung", () => {
    expect(indeksTabTujuan("ArrowRight", 0, 6)).toBe(1);
    expect(indeksTabTujuan("ArrowRight", 5, 6)).toBe(0);
  });

  it("panah kiri berpindah mundur dan membungkus di awal", () => {
    expect(indeksTabTujuan("ArrowLeft", 2, 6)).toBe(1);
    expect(indeksTabTujuan("ArrowLeft", 0, 6)).toBe(5);
  });

  it("Home dan End menuju tab pertama/terakhir", () => {
    expect(indeksTabTujuan("Home", 4, 6)).toBe(0);
    expect(indeksTabTujuan("End", 0, 6)).toBe(5);
  });

  it("tombol lain mempertahankan tab aktif", () => {
    expect(indeksTabTujuan("Enter", 3, 6)).toBe(3);
    expect(indeksTabTujuan("Tab", 3, 6)).toBe(3);
  });
});

describe("pesanGalatBatasDesa", () => {
  it("kosong dan polygon sah tidak menghasilkan galat", () => {
    expect(pesanGalatBatasDesa("")).toBeNull();
    expect(pesanGalatBatasDesa("   ")).toBeNull();
    expect(pesanGalatBatasDesa(POLYGON_SAH)).toBeNull();
    expect(jumlahTitikBatasDesa(POLYGON_SAH)).toBe(5);
  });

  it("JSON rusak menghasilkan galat, bukan crash", () => {
    expect(pesanGalatBatasDesa("{bukan json")).not.toBeNull();
  });

  it("tipe geometri salah menghasilkan galat", () => {
    expect(
      pesanGalatBatasDesa(JSON.stringify({ type: "Point", coordinates: [100, -7] })),
    ).not.toBeNull();
  });

  it("ring tidak tertutup menghasilkan galat", () => {
    const ringTerbuka = JSON.stringify({
      type: "Polygon",
      coordinates: [
        [
          [100, -7],
          [101, -7],
          [101, -6],
          [100, -6],
        ],
      ],
    });
    expect(pesanGalatBatasDesa(ringTerbuka)).toContain("tertutup");
  });

  it("koordinat bukan angka menghasilkan galat", () => {
    const rusak = JSON.stringify({
      type: "Polygon",
      coordinates: [
        [
          ["seratus", -7],
          [101, -7],
          [101, -6],
          ["seratus", -6],
          ["seratus", -7],
        ],
      ],
    });
    expect(pesanGalatBatasDesa(rusak)).not.toBeNull();
  });
});

describe("validasiUkuranLogo", () => {
  it("kosong berarti dimensi bawaan", () => {
    expect(validasiUkuranLogo("")).toEqual({ ok: true, ukuran: null });
    expect(validasiUkuranLogo(null)).toEqual({ ok: true, ukuran: null });
    expect(validasiUkuranLogo(undefined)).toEqual({ ok: true, ukuran: null });
  });

  it("menerima rentang 100–400 termasuk batasnya", () => {
    expect(validasiUkuranLogo("100")).toEqual({ ok: true, ukuran: 100 });
    expect(validasiUkuranLogo("250")).toEqual({ ok: true, ukuran: 250 });
    expect(validasiUkuranLogo("400")).toEqual({ ok: true, ukuran: 400 });
  });

  it("menolak nilai di luar rentang dan bukan bilangan bulat", () => {
    expect(validasiUkuranLogo("99").ok).toBe(false);
    expect(validasiUkuranLogo("401").ok).toBe(false);
    expect(validasiUkuranLogo("150.5").ok).toBe(false);
    expect(validasiUkuranLogo("besar").ok).toBe(false);
    expect(validasiUkuranLogo("-200").ok).toBe(false);
  });
});
