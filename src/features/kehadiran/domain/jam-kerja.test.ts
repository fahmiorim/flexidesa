import { describe, expect, it } from "vitest";

import { JAM_KERJA_BAWAAN, jamKerjaFormSchema, jamPendek } from "./jam-kerja";

describe("jamKerjaFormSchema", () => {
  it("menerima jam valid dengan status Hari Kerja", () => {
    const hasil = jamKerjaFormSchema.parse({
      jamMasuk: "08:00",
      jamKeluar: "16:00",
      status: "1",
      keterangan: "  ",
    });

    expect(hasil).toEqual({
      jamMasuk: "08:00",
      jamKeluar: "16:00",
      status: true,
      keterangan: null,
    });
  });

  it('mengubah status "0" menjadi Hari Libur dan memangkas keterangan', () => {
    const hasil = jamKerjaFormSchema.parse({
      jamMasuk: "08:00",
      jamKeluar: "12:00",
      status: "0",
      keterangan: "  Libur mingguan  ",
    });

    expect(hasil.status).toBe(false);
    expect(hasil.keterangan).toBe("Libur mingguan");
  });

  it("menolak format jam yang tidak valid", () => {
    expect(
      jamKerjaFormSchema.safeParse({
        jamMasuk: "8:00",
        jamKeluar: "16:00",
        status: "1",
        keterangan: "",
      }).success,
    ).toBe(false);
    expect(
      jamKerjaFormSchema.safeParse({
        jamMasuk: "08:00",
        jamKeluar: "24:00",
        status: "1",
        keterangan: "",
      }).success,
    ).toBe(false);
  });

  it("menolak jam keluar lebih kecil dari jam masuk seperti OpenSID", () => {
    const hasil = jamKerjaFormSchema.safeParse({
      jamMasuk: "08:00",
      jamKeluar: "07:59",
      status: "1",
      keterangan: "",
    });

    expect(hasil.success).toBe(false);
    if (!hasil.success) {
      expect(hasil.error.issues[0]?.message).toBe(
        "Jam keluar tidak boleh lebih kecil dari jam masuk.",
      );
    }
  });

  it("mengizinkan jam keluar sama dengan jam masuk", () => {
    expect(
      jamKerjaFormSchema.safeParse({
        jamMasuk: "08:00",
        jamKeluar: "08:00",
        status: "1",
        keterangan: "",
      }).success,
    ).toBe(true);
  });

  it("membatasi keterangan 300 karakter seperti formulir OpenSID", () => {
    expect(
      jamKerjaFormSchema.safeParse({
        jamMasuk: "08:00",
        jamKeluar: "16:00",
        status: "1",
        keterangan: "x".repeat(300),
      }).success,
    ).toBe(true);
    expect(
      jamKerjaFormSchema.safeParse({
        jamMasuk: "08:00",
        jamKeluar: "16:00",
        status: "1",
        keterangan: "x".repeat(301),
      }).success,
    ).toBe(false);
  });
});

describe("jamPendek", () => {
  it("memotong HH:MM:SS menjadi HH:MM", () => {
    expect(jamPendek("08:00:00")).toBe("08:00");
    expect(jamPendek("16:30:00")).toBe("16:30");
    expect(jamPendek(null)).toBe("");
    expect(jamPendek(undefined)).toBe("");
  });
});

describe("JAM_KERJA_BAWAAN", () => {
  it("memuat tujuh hari dengan Minggu sebagai hari libur", () => {
    expect(JAM_KERJA_BAWAAN).toHaveLength(7);
    expect(JAM_KERJA_BAWAAN.map((baris) => baris.namaHari)).toEqual([
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
      "Minggu",
    ]);
    expect(JAM_KERJA_BAWAAN.find((baris) => baris.namaHari === "Minggu")?.status).toBe(false);
    expect(JAM_KERJA_BAWAAN.find((baris) => baris.namaHari === "Sabtu")?.jamKeluar).toBe("12:00");
  });
});
