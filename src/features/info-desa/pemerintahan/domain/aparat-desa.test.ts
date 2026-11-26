import { describe, expect, it } from "vitest";

import {
  hitungUrutPerangkat,
  normalisasiFlagPejabat,
  susunBagan,
  validasiPejabatStruktural,
  type PejabatRingkas,
  type SimpulBagan,
} from "./aparat-desa";

const aparat = (overrides: Partial<PejabatRingkas> = {}): PejabatRingkas => ({
  id: 1,
  nama: "Aparat",
  jenis: "lainnya",
  status: "aktif",
  ttdAn: false,
  ttdUb: false,
  statusPejabat: false,
  ...overrides,
});

describe("hitungUrutPerangkat", () => {
  it("menempatkan Kepala Desa di urutan 1 dan Sekretaris Desa di urutan 2", () => {
    expect(hitungUrutPerangkat({ jenis: "kades", id: null, urut: 9, urutTerakhir: 5 })).toBe(1);
    expect(hitungUrutPerangkat({ jenis: "sekdes", id: 3, urut: 9, urutTerakhir: 5 })).toBe(2);
  });

  it("memberi aparat baru nomor setelah urutan terakhir", () => {
    expect(hitungUrutPerangkat({ jenis: "lainnya", id: null, urut: 0, urutTerakhir: 5 })).toBe(6);
  });

  it("mempertahankan urutan yang sudah diisi saat mengubah aparat", () => {
    expect(hitungUrutPerangkat({ jenis: "lainnya", id: 4, urut: 0, urutTerakhir: 5 })).toBe(0);
    expect(hitungUrutPerangkat({ jenis: "lainnya", id: 4, urut: 3, urutTerakhir: 5 })).toBe(3);
  });
});

describe("normalisasiFlagPejabat", () => {
  it("mempertahankan a.n hanya untuk Sekretaris Desa", () => {
    expect(
      normalisasiFlagPejabat({
        jenis: "sekdes",
        status: "aktif",
        ttdAn: true,
        ttdUb: false,
        statusPejabat: false,
      }).ttdAn,
    ).toBe(true);
    expect(
      normalisasiFlagPejabat({
        jenis: "lainnya",
        status: "aktif",
        ttdAn: true,
        ttdUb: false,
        statusPejabat: false,
      }).ttdAn,
    ).toBe(false);
  });

  it("mempertahankan u.b hanya untuk jabatan non-struktural", () => {
    expect(
      normalisasiFlagPejabat({
        jenis: "lainnya",
        status: "aktif",
        ttdAn: false,
        ttdUb: true,
        statusPejabat: false,
      }).ttdUb,
    ).toBe(true);
    expect(
      normalisasiFlagPejabat({
        jenis: "kades",
        status: "aktif",
        ttdAn: false,
        ttdUb: true,
        statusPejabat: false,
      }).ttdUb,
    ).toBe(false);
  });

  it("mematikan semua flag saat aparat nonaktif", () => {
    expect(
      normalisasiFlagPejabat({
        jenis: "kades",
        status: "nonaktif",
        ttdAn: true,
        ttdUb: true,
        statusPejabat: true,
      }),
    ).toEqual({
      jenis: "kades",
      status: "nonaktif",
      ttdAn: false,
      ttdUb: false,
      statusPejabat: false,
    });
  });
});

describe("validasiPejabatStruktural", () => {
  it("menolak Kepala Desa aktif kedua", () => {
    expect(() =>
      validasiPejabatStruktural(
        { jenis: "kades", status: "aktif", ttdAn: false, ttdUb: false, statusPejabat: false },
        [aparat({ id: 2, nama: "Sukarno", jenis: "kades" })],
      ),
    ).toThrow(/Kepala Desa aktif sudah ada/);
  });

  it("mengizinkan Kepala Desa baru bila yang lama sudah nonaktif", () => {
    expect(() =>
      validasiPejabatStruktural(
        { jenis: "kades", status: "aktif", ttdAn: false, ttdUb: false, statusPejabat: false },
        [aparat({ id: 2, nama: "Sukarno", jenis: "kades", status: "nonaktif" })],
      ),
    ).not.toThrow();
  });

  it("menolak Sekretaris Desa aktif kedua", () => {
    expect(() =>
      validasiPejabatStruktural(
        { jenis: "sekdes", status: "aktif", ttdAn: false, ttdUb: false, statusPejabat: false },
        [aparat({ id: 3, jenis: "sekdes" })],
      ),
    ).toThrow(/Sekretaris Desa aktif sudah ada/);
  });

  it("menolak penandatangan a.n ganda, termasuk data lama yang flag-nya tidak sesuai jenis", () => {
    expect(() =>
      validasiPejabatStruktural(
        { jenis: "sekdes", status: "aktif", ttdAn: true, ttdUb: false, statusPejabat: false },
        [aparat({ id: 4, nama: "Siti", jenis: "lainnya", ttdAn: true, status: "aktif" })],
      ),
    ).toThrow(/atas nama \(a\.n\) sudah dipegang Siti/);
  });

  it("menolak penandatangan u.b ganda", () => {
    expect(() =>
      validasiPejabatStruktural(
        { jenis: "lainnya", status: "aktif", ttdAn: false, ttdUb: true, statusPejabat: false },
        [aparat({ id: 5, nama: "Budi", ttdUb: true, status: "aktif" })],
      ),
    ).toThrow(/untuk beliau \(u\.b\) sudah dipegang Budi/);
  });

  it("tidak memeriksa bentrok untuk aparat nonaktif", () => {
    expect(() =>
      validasiPejabatStruktural(
        { jenis: "kades", status: "nonaktif", ttdAn: false, ttdUb: false, statusPejabat: false },
        [aparat({ id: 2, jenis: "kades" })],
      ),
    ).not.toThrow();
  });
});

const simpul = (overrides: Partial<SimpulBagan> & { id: number }): SimpulBagan => ({
  nama: `Aparat ${overrides.id}`,
  jabatan: null,
  jenis: "lainnya",
  statusPejabat: false,
  tingkat: null,
  offset: null,
  layout: null,
  warna: null,
  atasanId: null,
  urut: overrides.id,
  ...overrides,
});

describe("susunBagan", () => {
  it("menyusun anak berdasarkan atasan langsung dan urutan", () => {
    const pohon = susunBagan([
      simpul({ id: 1, urut: 1 }),
      simpul({ id: 3, atasanId: 1, urut: 3 }),
      simpul({ id: 2, atasanId: 1, urut: 2 }),
    ]);
    expect(pohon).toHaveLength(1);
    expect(pohon[0]?.anak.map((anak) => anak.id)).toEqual([2, 3]);
  });

  it("menjadikan aparat dengan atasan hilang sebagai akar agar tidak hilang dari bagan", () => {
    const pohon = susunBagan([simpul({ id: 7, atasanId: 99 })]);
    expect(pohon.map((akar) => akar.id)).toEqual([7]);
  });

  it("memutus relasi melingkar menjadi akar", () => {
    const pohon = susunBagan([simpul({ id: 1, atasanId: 2 }), simpul({ id: 2, atasanId: 1 })]);
    expect(pohon.length).toBeGreaterThanOrEqual(1);
    expect(pohon.flatMap((akar) => [akar.id, ...akar.anak.map((a) => a.id)])).toEqual(
      expect.arrayContaining([1, 2]),
    );
  });

  it("menambahkan simpul BPD hanya bila diminta", () => {
    const tanpa = susunBagan([simpul({ id: 1 })]);
    expect(tanpa).toHaveLength(1);
    const dengan = susunBagan([simpul({ id: 1 })], { denganBpd: true });
    expect(dengan).toHaveLength(2);
    expect(dengan.at(-1)?.jenis).toBe("bpd");
  });
});
