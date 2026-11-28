import { describe, expect, it } from "vitest";

import { formatNumber, formatTanggal } from "./format-tanggal";

describe("formatTanggal", () => {
  it("memformat tanggal panjang id-ID", () => {
    expect(formatTanggal("2026-11-26")).toBe("26 November 2026");
    expect(formatTanggal(new Date(2026, 0, 5))).toBe("5 Januari 2026");
  });

  it("mengembalikan strip untuk kosong/tidak valid", () => {
    expect(formatTanggal(null)).toBe("—");
    expect(formatTanggal(undefined)).toBe("—");
    expect(formatTanggal("")).toBe("—");
    expect(formatTanggal("bukan-tanggal")).toBe("—");
  });
});

describe("formatNumber", () => {
  it("memisahkan ribuan id-ID", () => {
    expect(formatNumber(1389)).toBe("1.389");
    expect(formatNumber(0)).toBe("0");
  });
});
