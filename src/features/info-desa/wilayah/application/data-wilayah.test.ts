import { describe, expect, it } from "vitest";

import { detailWilayahAdministratif, wilayahAdministratif } from "./data-wilayah";

describe("wilayahAdministratif", () => {
  it("mengembalikan provinsi tanpa induk", () => {
    const hasil = wilayahAdministratif("provinsi", null);

    expect(hasil.status).toBe("ok");
    if (hasil.status !== "ok") return;
    expect(hasil.data).toHaveLength(38);
    expect(hasil.data[0]).toEqual({ kode: "11", nama: "Aceh" });
  });

  it("menyaring kabupaten dan desa berdasarkan induk", () => {
    const kabupaten = wilayahAdministratif("kabupaten", "11");
    expect(kabupaten.status).toBe("ok");
    if (kabupaten.status === "ok") {
      expect(kabupaten.data[0]).toEqual({ kode: "11.01", nama: "Kabupaten Aceh Selatan" });
    }

    const desa = wilayahAdministratif("desa", "11.01.01");
    expect(desa.status).toBe("ok");
    if (desa.status === "ok") {
      expect(desa.data[0]).toMatchObject({ kode: "1101012001", nama: "Keude Bakongan" });
      expect(desa.data[0]?.kodeBps).toMatch(/^\d{10}$/);
      expect(desa.data[0]?.kodePos).toMatch(/^\d{5}$/);
    }
  });

  it("melengkapi detail BPS dan kode pos desa dari kode Kemendagri", () => {
    expect(detailWilayahAdministratif("1101012001")).toEqual({
      kodeBps: "1103020002",
      kodePos: "23773",
    });
    expect(detailWilayahAdministratif("11.01.01.2001")).toEqual({
      kodeBps: "1103020002",
      kodePos: "23773",
    });
  });

  it("menolak kode desa yang tidak valid atau tidak memiliki detail", () => {
    expect(detailWilayahAdministratif(null)).toBeNull();
    expect(detailWilayahAdministratif("11010120")).toBeNull();
    expect(detailWilayahAdministratif("9999999999")).toBeNull();
  });

  it("menolak tingkat yang tidak dikenal", () => {
    expect(wilayahAdministratif("tersier", null).status).toBe("tingkat-tidak-valid");
    expect(wilayahAdministratif(null, null).status).toBe("tingkat-tidak-valid");
  });

  it("menolak induk yang hilang atau salah format", () => {
    expect(wilayahAdministratif("kabupaten", null).status).toBe("induk-tidak-valid");
    expect(wilayahAdministratif("kecamatan", "11").status).toBe("induk-tidak-valid");
    expect(wilayahAdministratif("desa", "11.01.01.01").status).toBe("induk-tidak-valid");
  });
});
