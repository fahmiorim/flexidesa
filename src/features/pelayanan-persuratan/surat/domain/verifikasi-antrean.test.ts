import { describe, expect, it } from "vitest";

import {
  hitungAntreanPerTahap,
  saringAntreanVerifikasi,
  susunAntreanVerifikasi,
  type SuratUntukVerifikasi,
} from "./verifikasi-antrean";

const surat = (overrides: Partial<SuratUntukVerifikasi> = {}): SuratUntukVerifikasi => ({
  status: "verifikasi",
  verifikasiOperator: null,
  verifikasiSekdes: null,
  verifikasiKades: null,
  ...overrides,
});

const antrean = [
  surat({ verifikasiOperator: null }),
  surat({ verifikasiOperator: true, verifikasiSekdes: null }),
  surat({ verifikasiOperator: true, verifikasiSekdes: true, verifikasiKades: null }),
  surat({ status: "draft" }),
  surat({ status: "issued" }),
];

describe("susunAntreanVerifikasi", () => {
  it("hanya memuat surat dengan tahap aktif dan menandai kewenangan role", () => {
    const hasil = susunAntreanVerifikasi(antrean, "sekretaris", false);

    expect(hasil.map((item) => item.langkah)).toEqual(["operator", "sekdes", "kades"]);
    expect(hasil.map((item) => item.bolehVerifikasi)).toEqual([false, true, false]);
  });

  it("memberi kewenangan semua tahap kepada superadmin", () => {
    const hasil = susunAntreanVerifikasi(antrean, null, true);
    expect(hasil.every((item) => item.bolehVerifikasi)).toBe(true);
  });

  it("tidak memberi kewenangan kepada administrator tenant", () => {
    const hasil = susunAntreanVerifikasi(antrean, "administrator", false);
    expect(hasil.every((item) => !item.bolehVerifikasi)).toBe(true);
  });
});

describe("saringAntreanVerifikasi", () => {
  const tersusun = susunAntreanVerifikasi(antrean, "sekretaris", false);

  it("cakupan saya hanya menampilkan tahap sekretaris", () => {
    expect(saringAntreanVerifikasi(tersusun, "saya", "sekretaris", false)).toHaveLength(1);
    expect(saringAntreanVerifikasi(tersusun, "saya", "sekretaris", false)[0]?.langkah).toBe(
      "sekdes",
    );
  });

  it("cakupan semua menampilkan seluruh antrean", () => {
    expect(saringAntreanVerifikasi(tersusun, "semua", "sekretaris", false)).toHaveLength(3);
  });

  it("cakupan tahap tertentu menampilkan tahap itu saja", () => {
    expect(saringAntreanVerifikasi(tersusun, "kades", "sekretaris", false)).toHaveLength(1);
    expect(saringAntreanVerifikasi(tersusun, "operator", "sekretaris", false)).toHaveLength(1);
  });
});

describe("hitungAntreanPerTahap", () => {
  it("menghitung antrean tiap tahap", () => {
    const tersusun = susunAntreanVerifikasi(antrean, "sekretaris", false);
    expect(hitungAntreanPerTahap(tersusun)).toEqual({ operator: 1, sekdes: 1, kades: 1 });
  });
});
