import { describe, expect, it } from "vitest";

import {
  formatTanggalIndonesia,
  hariLiburFormSchema,
  namaHariIndonesia,
  tanggalIsoValid,
} from "./hari-libur";

describe("tanggalIsoValid", () => {
  it("menerima tanggal ISO yang benar-benar ada", () => {
    expect(tanggalIsoValid("2026-12-25")).toBe(true);
    expect(tanggalIsoValid("2024-02-29")).toBe(true);
  });

  it("menolak format lain dan tanggal yang tidak ada", () => {
    expect(tanggalIsoValid("2026-2-3")).toBe(false);
    expect(tanggalIsoValid("25-12-2026")).toBe(false);
    expect(tanggalIsoValid("2026-02-30")).toBe(false);
    expect(tanggalIsoValid("2026-13-01")).toBe(false);
  });
});

describe("hariLiburFormSchema", () => {
  it("memangkas spasi dan menerima keterangan yang diisi", () => {
    const hasil = hariLiburFormSchema.parse({
      tanggal: " 2026-12-25 ",
      keterangan: "  Hari Raya Natal ",
    });

    expect(hasil).toEqual({ tanggal: "2026-12-25", keterangan: "Hari Raya Natal" });
  });

  it("menolak keterangan kosong dan tanggal tidak valid", () => {
    expect(hariLiburFormSchema.safeParse({ tanggal: "2026-12-25", keterangan: "  " }).success).toBe(
      false,
    );
    expect(
      hariLiburFormSchema.safeParse({ tanggal: "2026-02-30", keterangan: "Libur" }).success,
    ).toBe(false);
  });

  it("membatasi keterangan 300 karakter seperti formulir OpenSID", () => {
    expect(
      hariLiburFormSchema.safeParse({ tanggal: "2026-12-25", keterangan: "x".repeat(300) }).success,
    ).toBe(true);
    expect(
      hariLiburFormSchema.safeParse({ tanggal: "2026-12-25", keterangan: "x".repeat(301) }).success,
    ).toBe(false);
  });
});

describe("format tampilan tanggal", () => {
  it("menampilkan tanggal Indonesia tanpa bergeser zona waktu", () => {
    expect(formatTanggalIndonesia("2026-12-25")).toBe("25 Desember 2026");
    expect(namaHariIndonesia("2026-12-25")).toBe("Jumat");
  });

  it("mengembalikan nilai asli bila tanggal tidak valid", () => {
    expect(formatTanggalIndonesia("bukan tanggal")).toBe("bukan tanggal");
    expect(namaHariIndonesia("bukan tanggal")).toBe("");
  });
});
