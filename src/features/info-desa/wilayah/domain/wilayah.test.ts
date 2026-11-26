import { describe, expect, it } from "vitest";

import {
  batasWilayahSchema,
  formatWilayahLabel,
  hitungJumlahWilayah,
  normalisasiTipePeta,
  petaKantorSchema,
  rencanaUbahWilayah,
  ubahWilayahSchema,
  wilayahDiBawah,
  wilayahFormSchema,
  wilayahTurunan,
} from "@/features/info-desa/wilayah/domain/wilayah";

describe("wilayahFormSchema", () => {
  it("menerima input valid dan memangkas spasi", () => {
    const result = wilayahFormSchema.parse({
      dusun: "  Sukamaju ",
      rw: " 01 ",
      rt: "02",
      kepala: "  Pak RT ",
      urut: "5",
    });

    expect(result).toEqual({
      dusun: "Sukamaju",
      rw: "01",
      rt: "02",
      kepala: "Pak RT",
      kepalaResidentId: null,
      luasHa: null,
      urut: 5,
    });
  });

  it("menerima titik kantor dan normalisasi tipe peta lama", () => {
    const result = petaKantorSchema.parse({
      koordinat: "-6.2, 106.816666",
      zoom: "15",
      mapTipe: "HYBRID",
    });

    expect(result).toEqual({ koordinat: "-6.2, 106.816666", zoom: 15, mapTipe: "carto" });
    expect(normalisasiTipePeta(null)).toBe("carto");
    expect(normalisasiTipePeta("osm")).toBe("osm");
  });

  it("menolak koordinat di luar batas bumi dan zoom di luar 1..22", () => {
    expect(petaKantorSchema.safeParse({ koordinat: "-95, 106.8", zoom: 15 }).success).toBe(false);
    expect(petaKantorSchema.safeParse({ koordinat: "", zoom: 30 }).success).toBe(false);
  });

  it("menerima Polygon dan MultiPolygon tertutup", () => {
    const polygon = batasWilayahSchema.parse({
      path: '{"type":"Polygon","coordinates":[[[106.8,-6.2],[106.9,-6.2],[106.9,-6.3],[106.8,-6.2]]]}',
      zoom: 14,
      warna: "#10b981",
      border: "#047857",
    });
    expect(polygon.zoom).toBe(14);

    const multi = batasWilayahSchema.safeParse({
      path: '{"type":"MultiPolygon","coordinates":[[[[106.8,-6.2],[106.9,-6.2],[106.9,-6.3],[106.8,-6.2]]]]}',
    });
    expect(multi.success).toBe(true);
  });

  it("menolak polygon terbuka dan warna bukan hex", () => {
    const terbuka = batasWilayahSchema.safeParse({
      path: '{"type":"Polygon","coordinates":[[[106.8,-6.2],[106.9,-6.2],[106.9,-6.3],[106.8,-6.25]]]}',
    });
    expect(terbuka.success).toBe(false);
    expect(batasWilayahSchema.safeParse({ path: "", warna: "hijau" }).success).toBe(false);
  });

  it("menerima ubah dusun/RW/RT dengan isian yang sama seperti form tambah", () => {
    const hasil = ubahWilayahSchema.parse({
      dusun: " Sukamaju ",
      rw: " 07 ",
      rt: "",
      urut: "2",
    });
    expect(hasil).toEqual({
      dusun: "Sukamaju",
      rw: "07",
      rt: "",
      kepala: "",
      kepalaResidentId: null,
      luasHa: null,
      urut: 2,
    });
  });

  it("mengubah urut dari teks menjadi angka", () => {
    const result = wilayahFormSchema.parse({ dusun: "A", rw: "", rt: "", urut: "12" });

    expect(result.urut).toBe(12);
  });

  it("menolak dusun kosong", () => {
    const result = wilayahFormSchema.safeParse({ dusun: "   ", rw: "", rt: "", urut: 0 });

    expect(result.success).toBe(false);
  });

  it("menolak urut di luar rentang", () => {
    const negative = wilayahFormSchema.safeParse({ dusun: "A", rw: "", rt: "", urut: -1 });
    const tooBig = wilayahFormSchema.safeParse({ dusun: "A", rw: "", rt: "", urut: 10000 });

    expect(negative.success).toBe(false);
    expect(tooBig.success).toBe(false);
  });

  it("menolak urut bukan bilangan bulat", () => {
    const result = wilayahFormSchema.safeParse({ dusun: "A", rw: "", rt: "", urut: 1.5 });

    expect(result.success).toBe(false);
  });

  it("menolak rw/rt yang terlalu panjang", () => {
    const result = wilayahFormSchema.safeParse({
      dusun: "A",
      rw: "12345678901",
      rt: "",
      urut: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe("rencanaUbahWilayah", () => {
  const rows = [
    { id: 1, dusun: "Sukamaju", rw: "", rt: "" },
    { id: 2, dusun: "Sukamaju", rw: "01", rt: "" },
    { id: 3, dusun: "Sukamaju", rw: "01", rt: "01" },
    { id: 4, dusun: "Sukamaju", rw: "02", rt: "" },
    { id: 5, dusun: "Makmur", rw: "", rt: "" },
  ];

  it("mengganti dusun pada semua baris dusun itu saja", () => {
    const hasil = rencanaUbahWilayah(rows, 1, { dusun: "Sukamaju Baru", rw: "", rt: "" });
    expect(hasil.bentrok).toBe(false);
    expect(hasil.patches.map((p) => p.id)).toEqual([1, 2, 3, 4]);
    expect(hasil.patches.every((p) => p.dusun === "Sukamaju Baru")).toBe(true);
  });

  it("mengganti RW hanya pada RW itu dan RT di bawahnya", () => {
    const hasil = rencanaUbahWilayah(rows, 2, { dusun: "Sukamaju", rw: "07", rt: "" });
    expect(hasil.patches.map((p) => p.id)).toEqual([2, 3]);
    expect(hasil.patches.every((p) => p.rw === "07")).toBe(true);
  });

  it("mengganti RT hanya pada baris itu", () => {
    expect(rencanaUbahWilayah(rows, 3, { dusun: "Sukamaju", rw: "01", rt: "02" })).toEqual({
      patches: [{ id: 3, dusun: "Sukamaju", rw: "01", rt: "02" }],
      bentrok: false,
    });
  });

  it("mengembalikan bentrok tanpa patch bila nilai baru sudah dipakai", () => {
    expect(rencanaUbahWilayah(rows, 2, { dusun: "Sukamaju", rw: "02", rt: "" })).toEqual({
      patches: [],
      bentrok: true,
    });
  });

  it("tidak menghasilkan patch bila nilai tidak berubah atau target tidak ada", () => {
    expect(rencanaUbahWilayah(rows, 2, { dusun: "Sukamaju", rw: "01", rt: "" }).patches).toEqual(
      [],
    );
    expect(rencanaUbahWilayah(rows, 99, { dusun: "X", rw: "", rt: "" })).toEqual({
      patches: [],
      bentrok: false,
    });
  });
});

describe("hitungJumlahWilayah", () => {
  it("menjumlahkan subtree dusun/RW dan tidak mencampur dusun lain", () => {
    const rows = [
      { id: 1, dusun: "Sukamaju", rw: "", rt: "" },
      { id: 2, dusun: "Sukamaju", rw: "01", rt: "" },
      { id: 3, dusun: "Sukamaju", rw: "01", rt: "02" },
      { id: 4, dusun: "Sukamaju", rw: "02", rt: "01" },
      { id: 5, dusun: "Makmur", rw: "", rt: "" },
    ];
    const exact = new Map([
      [2, { jumlahKk: 1, lakiLaki: 1, perempuan: 0, total: 1 }],
      [3, { jumlahKk: 3, lakiLaki: 6, perempuan: 4, total: 10 }],
      [4, { jumlahKk: 2, lakiLaki: 2, perempuan: 3, total: 5 }],
      [5, { jumlahKk: 2, lakiLaki: 3, perempuan: 4, total: 7 }],
    ]);

    const hasil = hitungJumlahWilayah(rows, exact);

    expect(hasil.get(1)).toEqual({ jumlahKk: 6, lakiLaki: 9, perempuan: 7, total: 16 });
    expect(hasil.get(2)).toEqual({ jumlahKk: 4, lakiLaki: 7, perempuan: 4, total: 11 });
    expect(hasil.get(3)).toEqual({ jumlahKk: 3, lakiLaki: 6, perempuan: 4, total: 10 });
    expect(hasil.get(4)).toEqual({ jumlahKk: 2, lakiLaki: 2, perempuan: 3, total: 5 });
    expect(hasil.get(5)).toEqual({ jumlahKk: 2, lakiLaki: 3, perempuan: 4, total: 7 });
  });
});

describe("formatWilayahLabel", () => {
  it("menggabungkan dusun, RT, dan RW", () => {
    expect(formatWilayahLabel({ dusun: "Sukamaju", rw: "01", rt: "02" })).toBe(
      "Dusun Sukamaju · RT 02 · RW 01",
    );
  });

  it("melewati bagian yang kosong", () => {
    expect(formatWilayahLabel({ dusun: "Sukamaju", rw: "", rt: "" })).toBe("Dusun Sukamaju");
    expect(formatWilayahLabel({ dusun: "", rw: "01", rt: "02" })).toBe("RT 02 · RW 01");
  });

  it("memberi label fallback bila semuanya kosong", () => {
    expect(formatWilayahLabel({ dusun: "", rw: "", rt: "" })).toBe("Wilayah tanpa nama");
  });
});

describe("validasi wilayah - rekap", () => {
  it("memastikan kombinasi dusun rw rt divalidasi", () => {
    const parsed = wilayahFormSchema.parse({ dusun: "Dusun A", rw: "001", rt: "001", urut: 1 });
    expect(parsed.dusun).toBe("Dusun A");
    expect(parsed.rw).toBe("001");
    expect(parsed.rt).toBe("001");
  });
});

describe("wilayahTurunan", () => {
  const dusun = { id: 1, dusun: "Sukamaju", rw: "", rt: "" };
  const rw01 = { id: 2, dusun: "Sukamaju", rw: "01", rt: "" };
  const rt01 = { id: 3, dusun: "Sukamaju", rw: "01", rt: "001" };
  const rtDusun = { id: 4, dusun: "Sukamaju", rw: "", rt: "002" };
  const dusunLain = { id: 5, dusun: "Mekarsari", rw: "", rt: "" };

  it("menampilkan RW dan RT langsung di bawah dusun", () => {
    const anak = wilayahTurunan([dusun, rw01, rt01, rtDusun, dusunLain], dusun);
    expect(anak.map((row) => row.id)).toEqual([2, 4]);
  });

  it("menampilkan RT di bawah RW dan tidak mencampur RW lain", () => {
    const rw02 = { id: 6, dusun: "Sukamaju", rw: "02", rt: "" };
    const rtRw02 = { id: 7, dusun: "Sukamaju", rw: "02", rt: "001" };
    const anak = wilayahTurunan([rw01, rt01, rw02, rtRw02], rw01);
    expect(anak.map((row) => row.id)).toEqual([3]);
  });

  it("tidak punya turunan pada tingkat RT", () => {
    expect(wilayahTurunan([rt01], rt01)).toEqual([]);
  });
});

describe("wilayahDiBawah", () => {
  it("mengumpulkan anak dan cucu untuk larangan hapus", () => {
    const rows = [
      { id: 1, dusun: "Sukamaju", rw: "", rt: "" },
      { id: 2, dusun: "Sukamaju", rw: "01", rt: "" },
      { id: 3, dusun: "Sukamaju", rw: "01", rt: "001" },
      { id: 4, dusun: "Mekarsari", rw: "", rt: "" },
    ];
    expect(wilayahDiBawah(rows, 1).map((row) => row.id)).toEqual([2, 3]);
    expect(wilayahDiBawah(rows, 3)).toEqual([]);
  });
});

describe("kepala wilayah dari penduduk", () => {
  it("menolak id penduduk yang tidak valid", () => {
    const hasil = wilayahFormSchema.safeParse({
      dusun: "Sukamaju",
      rw: "",
      rt: "",
      kepalaResidentId: 0,
      urut: 0,
    });
    expect(hasil.success).toBe(false);
  });

  it("menerima id penduduk positif", () => {
    const hasil = wilayahFormSchema.parse({
      dusun: "Sukamaju",
      rw: "",
      rt: "",
      kepalaResidentId: 42,
      urut: 0,
    });
    expect(hasil.kepalaResidentId).toBe(42);
  });
});
