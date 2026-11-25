import { describe, expect, it } from "vitest";

import {
  filterKelompokKeSearchParams,
  filterKelompokKosong,
  hitungFilterKelompok,
  parseFilterKelompok,
} from "./kelompok";

describe("parseFilterKelompok", () => {
  it("memakai bawaan status aktif bila parameter tidak ada (paritas OpenSID)", () => {
    expect(parseFilterKelompok({}).status).toBe("aktif");
    expect(parseFilterKelompok({ status: "semua" }).status).toBeNull();
    expect(parseFilterKelompok({ status: "tidak-aktif" }).status).toBe("tidak-aktif");
  });

  it("memetakan seluruh filter yang dikenal", () => {
    expect(
      parseFilterKelompok({ q: " PKK ", tipe: "lembaga", kategori: "3", status: "tidak-aktif" }),
    ).toEqual({ search: "PKK", tipe: "lembaga", categoryId: 3, status: "tidak-aktif" });
  });

  it("mengabaikan nilai yang tidak valid", () => {
    const filter = parseFilterKelompok({ tipe: "entah", kategori: "abc", status: "x" });
    expect(filter.tipe).toBeNull();
    expect(filter.categoryId).toBeNull();
    expect(filter.status).toBe("aktif");
  });
});

describe("filterKelompokKeSearchParams & hitungFilterKelompok", () => {
  it("menulis status semua secara eksplisit", () => {
    const query = filterKelompokKeSearchParams({ ...filterKelompokKosong(), status: null });
    expect(query.toString()).toBe("status=semua");
  });

  it("tidak menulis status bawaan aktif", () => {
    const query = filterKelompokKeSearchParams({ ...filterKelompokKosong(), status: "aktif" });
    expect(query.toString()).toBe("");
  });

  it("bolak-balik query string tetap sama", () => {
    const asli = parseFilterKelompok({ q: "001", tipe: "kelompok", kategori: "2" });
    expect(parseFilterKelompok(Object.fromEntries(filterKelompokKeSearchParams(asli)))).toEqual(
      asli,
    );
  });

  it("menghitung filter aktif", () => {
    expect(hitungFilterKelompok(filterKelompokKosong())).toBe(0);
    expect(
      hitungFilterKelompok({ ...filterKelompokKosong(), tipe: "kelompok", status: "aktif" }),
    ).toBe(2);
  });
});
