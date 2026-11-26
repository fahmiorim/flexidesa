import { describe, expect, it } from "vitest";

import {
  buildKelompokRentanCsv,
  disabilitasKosong,
  jumlahkanKelompokRentan,
  lengkapiBarisKelompokRentan,
  urutkanKelompokRentan,
  type BarisKelompokRentan,
} from "./kelompok-rentan";

function baris(
  overrides: Partial<Omit<BarisKelompokRentan, "total" | "tidakCacat">> = {},
): BarisKelompokRentan {
  return lengkapiBarisKelompokRentan({
    regionId: 1,
    dusun: "Sukamaju",
    rw: "01",
    rt: "02",
    lakiLaki: 20,
    perempuan: 15,
    bayi: 1,
    balita: 2,
    sd: 3,
    smp: 2,
    sma: 2,
    lansia: 4,
    disabilitas: { ...disabilitasKosong(), physical: 1 },
    sakitLakiLaki: 1,
    sakitPerempuan: 2,
    hamil: 1,
    ...overrides,
  });
}

describe("lengkapiBarisKelompokRentan", () => {
  it("menghitung total penduduk dan tidak cacat sebagai sisa", () => {
    const hasil = baris();

    expect(hasil.total).toBe(35);
    expect(hasil.tidakCacat).toBe(34);
  });

  it("tidak menghasilkan tidak cacat negatif saat data disabilitas melebihi total", () => {
    const hasil = baris({
      lakiLaki: 0,
      perempuan: 1,
      disabilitas: { ...disabilitasKosong(), physical: 3 },
    });

    expect(hasil.total).toBe(1);
    expect(hasil.tidakCacat).toBe(0);
  });
});

describe("jumlahkanKelompokRentan", () => {
  it("menjumlahkan angka dan seluruh kategori disabilitas", () => {
    const total = jumlahkanKelompokRentan([
      baris({ regionId: 1, lakiLaki: 2, perempuan: 3 }),
      baris({
        regionId: 2,
        lakiLaki: 5,
        perempuan: 1,
        disabilitas: { ...disabilitasKosong(), blind: 2 },
      }),
    ]);

    expect(total.lakiLaki).toBe(7);
    expect(total.perempuan).toBe(4);
    expect(total.total).toBe(11);
    expect(total.disabilitas.physical).toBe(1);
    expect(total.disabilitas.blind).toBe(2);
    expect(total.tidakCacat).toBe(8);
  });
});

describe("urutkanKelompokRentan", () => {
  it("mengurutkan per dusun/RW/RT secara numerik", () => {
    const rows = [
      baris({ regionId: 2, dusun: "Sukamaju", rw: "10", rt: "01" }),
      baris({ regionId: 1, dusun: "Sukamaju", rw: "2", rt: "01" }),
      baris({ regionId: 3, dusun: "Mekarsari", rw: "01", rt: "01" }),
    ].sort(urutkanKelompokRentan);

    expect(rows.map((row) => row.regionId)).toEqual([3, 1, 2]);
  });
});

describe("buildKelompokRentanCsv", () => {
  it("berisi header tabel, baris wilayah, dan total mulai kolom umur", () => {
    const rows = [baris({ regionId: 1, dusun: "Sukamaju", rw: "01", rt: "02" })];
    const csv = buildKelompokRentanCsv({
      rows,
      total: jumlahkanKelompokRentan(rows),
    });
    const lines = csv.split("\r\n");

    expect(lines[0]).toBe(
      "Dusun;RW;RT;KK L;KK P;Di bawah 1 Tahun;1-5 Tahun;6-12 Tahun;13-15 Tahun;16-18 Tahun;Di atas 60 Tahun;Cacat Fisik;Cacat Netra/ Buta;Cacat Rungu/ Wicara;Cacat Mental/ Jiwa;Cacat Fisik dan Mental;Cacat Lainnya;Tidak Cacat;Sakit Menahun L;Sakit Menahun P;Hamil",
    );
    expect(lines).toContain("Sukamaju;01;02;20;15;1;2;3;2;2;4;1;0;0;0;0;0;34;1;2;1");
    expect(lines.at(-1)).toBe("Total;;;;;1;2;3;2;2;4;1;0;0;0;0;0;34;1;2;1");
  });
});
