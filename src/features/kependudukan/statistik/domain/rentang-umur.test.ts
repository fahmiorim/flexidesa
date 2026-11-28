import { describe, expect, it } from "vitest";

import {
  cariTumpangTindih,
  KELOMPOK_UMUR,
  kelompokUmurUntuk,
  susunNamaRentang,
} from "./rentang-umur";

describe("kelompokUmurUntuk", () => {
  it("menempatkan umur pada rentang yang tepat", () => {
    expect(kelompokUmurUntuk(0)?.label).toBe("Di bawah 1 Tahun");
    expect(kelompokUmurUntuk(5)?.label).toBe("1–5 Tahun");
    expect(kelompokUmurUntuk(6)?.label).toBe("6–12 Tahun");
    expect(kelompokUmurUntuk(18)?.label).toBe("16–18 Tahun");
    expect(kelompokUmurUntuk(60)?.label).toBe("Di atas 60 Tahun");
    expect(kelompokUmurUntuk(120)?.label).toBe("Di atas 60 Tahun");
  });

  it("mengembalikan null bila umur tidak diketahui", () => {
    expect(kelompokUmurUntuk(null)).toBeNull();
    expect(kelompokUmurUntuk(-1)).toBeNull();
  });

  it("setiap usia 0-100 masuk tepat satu kelompok", () => {
    for (let umur = 0; umur <= 100; umur += 1) {
      const cocok = KELOMPOK_UMUR.filter(
        (kelompok) => umur >= kelompok.min && (kelompok.max === null || umur <= kelompok.max),
      );
      expect(cocok).toHaveLength(1);
    }
  });
});

describe("susunNamaRentang", () => {
  it("membentuk label rentang", () => {
    expect(susunNamaRentang(0, 5)).toBe("0 s/d 5 Tahun");
    expect(susunNamaRentang(6, 6)).toBe("6 Tahun");
    expect(susunNamaRentang(60, null)).toBe("Di atas 60 Tahun");
    expect(susunNamaRentang(60, 150)).toBe("Di atas 60 Tahun");
  });
});

describe("cariTumpangTindih", () => {
  const rows = [
    { id: 1, nama: "0 s/d 5 Tahun", dari: 0, sampai: 5 },
    { id: 2, nama: "6 s/d 12 Tahun", dari: 6, sampai: 12 },
    { id: 3, nama: "Di atas 60 Tahun", dari: 60, sampai: null },
  ];

  it("mendeteksi irisan pada batas inklusif", () => {
    expect(cariTumpangTindih(rows, { dari: 5, sampai: 7 })?.id).toBe(1);
    expect(cariTumpangTindih(rows, { dari: 12, sampai: 20 })?.id).toBe(2);
    expect(cariTumpangTindih(rows, { dari: 100, sampai: null })?.id).toBe(3);
  });

  it("mengizinkan rentang yang bersambung tanpa tumpang tindih", () => {
    expect(cariTumpangTindih(rows, { dari: 13, sampai: 59 })).toBeNull();
    expect(cariTumpangTindih(rows, { dari: 6, sampai: 12 }, 2)).toBeNull();
  });
});
