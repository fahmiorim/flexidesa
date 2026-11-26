import { beforeEach, describe, expect, it, vi } from "vitest";

import { sinkronkanKepalaDusun } from "@/features/info-desa/pemerintahan/application/sinkron-kepala-dusun";
import {
  cariKepalaWilayah,
  simpanBatasWilayah,
  simpanPetaKantor,
  ubahWilayah,
} from "@/features/info-desa/wilayah/application/use-cases";
import type { WilayahDTO } from "@/features/info-desa/wilayah/domain/wilayah";
import {
  cariPendudukKepala,
  findWilayahById,
  listWilayahOptions,
  pendudukMilikDesa,
  terapkanGantiNama,
  updateBatasWilayah,
  updateKantorWilayah,
  updateWilayah,
  type KepalaRingkas,
} from "@/features/info-desa/wilayah/infrastructure/wilayah-repository";

vi.mock("@/features/info-desa/wilayah/infrastructure/wilayah-repository", () => ({
  cariPendudukKepala: vi.fn(),
  deleteWilayah: vi.fn(),
  findWilayahById: vi.fn(),
  hitungPemakaiWilayah: vi.fn(),
  insertWilayah: vi.fn(),
  listWilayahOptions: vi.fn(),
  pendudukMilikDesa: vi.fn(),
  terapkanGantiNama: vi.fn(),
  tukarUrutanWilayah: vi.fn(),
  updateBatasWilayah: vi.fn(),
  updateKantorWilayah: vi.fn(),
  updateWilayah: vi.fn(),
  wilayahExists: vi.fn(),
}));
vi.mock("@/lib/dal", () => ({ requirePermission: vi.fn(async () => ({ id: 1 })) }));
vi.mock("@/features/info-desa/pemerintahan/application/sinkron-kepala-dusun", () => ({
  sinkronkanKepalaDusun: vi.fn(async () => undefined),
}));
vi.mock("@/features/info-desa/desa/application/resolve-village", () => ({
  resolveVillageId: vi.fn(async () => 7),
}));

const baris = (
  id: number,
  dusun: string,
  rw: string,
  rt: string,
  tambahan: Partial<WilayahDTO> = {},
): WilayahDTO => ({
  id,
  dusun,
  rw,
  rt,
  kepala: "",
  kepalaNik: "",
  kepalaResidentId: null,
  koordinat: "",
  path: "",
  zoom: null,
  mapTipe: null,
  warna: null,
  border: null,
  luasHa: null,
  urut: 0,
  ...tambahan,
});

const rows = [
  baris(1, "Sukamaju", "", ""),
  baris(2, "Sukamaju", "01", ""),
  baris(3, "Sukamaju", "01", "01"),
  baris(4, "Sukamaju", "02", ""),
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findWilayahById).mockResolvedValue(rows[0]!);
  vi.mocked(listWilayahOptions).mockResolvedValue(rows);
  vi.mocked(pendudukMilikDesa).mockResolvedValue(null);
  vi.mocked(cariPendudukKepala).mockResolvedValue([]);
});

describe("ubahWilayah", () => {
  it("menerapkan ubah dusun lalu memperbarui kepala dan urutan", async () => {
    await ubahWilayah(1, {
      dusun: "Sukamaju Baru",
      rw: "",
      rt: "",
      kepala: "",
      kepalaResidentId: null,
      urut: 3,
    });

    expect(terapkanGantiNama).toHaveBeenCalledWith(
      7,
      expect.arrayContaining([expect.objectContaining({ id: 1, dusun: "Sukamaju Baru" })]),
    );
    expect(updateWilayah).toHaveBeenCalledWith(
      7,
      1,
      expect.objectContaining({ dusun: "Sukamaju Baru", urut: 3 }),
    );
    expect(sinkronkanKepalaDusun).toHaveBeenCalledWith(
      expect.objectContaining({ villageId: 7, wilayahId: 1, dusun: "Sukamaju Baru" }),
    );
  });

  it("menolak rename yang bentrok tanpa menulis apa pun", async () => {
    vi.mocked(findWilayahById).mockResolvedValue(rows[1]!);

    await expect(
      ubahWilayah(2, {
        dusun: "Sukamaju",
        rw: "02",
        rt: "",
        kepala: "",
        kepalaResidentId: null,
        urut: 0,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(terapkanGantiNama).not.toHaveBeenCalled();
    expect(updateWilayah).not.toHaveBeenCalled();
  });

  it("menolak id wilayah milik desa lain", async () => {
    vi.mocked(findWilayahById).mockResolvedValueOnce(null);

    await expect(
      ubahWilayah(9, {
        dusun: "X",
        rw: "",
        rt: "",
        kepala: "",
        kepalaResidentId: null,
        urut: 0,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(findWilayahById).toHaveBeenCalledWith(7, 9);
    expect(terapkanGantiNama).not.toHaveBeenCalled();
  });

  it("menolak nomor RW lebih dari 10 karakter", async () => {
    vi.mocked(findWilayahById).mockResolvedValue(rows[1]!);
    await expect(
      ubahWilayah(2, {
        dusun: "Sukamaju",
        rw: "12345678901",
        rt: "",
        kepala: "",
        kepalaResidentId: null,
        urut: 0,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("simpanBatasWilayah", () => {
  it("menyimpan MultiPolygon tertutup", async () => {
    await simpanBatasWilayah(1, {
      path: '{"type":"MultiPolygon","coordinates":[[[[106.8,-6.2],[106.9,-6.2],[106.9,-6.3],[106.8,-6.2]]]]}',
      zoom: 15,
      warna: "#10b981",
      border: "#047857",
    });
    expect(updateBatasWilayah).toHaveBeenCalledWith(
      7,
      1,
      expect.objectContaining({ zoom: 15, warna: "#10b981" }),
    );
  });

  it("menolak batas dengan ring terbuka", async () => {
    await expect(
      simpanBatasWilayah(1, {
        path: '{"type":"Polygon","coordinates":[[[106.8,-6.2],[106.9,-6.2],[106.9,-6.3],[106.8,-6.25]]]}',
        zoom: 15,
        warna: null,
        border: null,
        luasHa: null,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(updateBatasWilayah).not.toHaveBeenCalled();
  });

  it("menolak wilayah yang tidak ada", async () => {
    vi.mocked(findWilayahById).mockResolvedValueOnce(null);
    await expect(
      simpanBatasWilayah(99, { path: "", zoom: null, warna: null, border: null }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("simpanPetaKantor", () => {
  it("menyimpan koordinat dan zoom", async () => {
    await simpanPetaKantor(1, { koordinat: "-6.2, 106.8", zoom: 17, mapTipe: "osm" });
    expect(updateKantorWilayah).toHaveBeenCalledWith(7, 1, {
      koordinat: "-6.2, 106.8",
      zoom: 17,
      mapTipe: "osm",
    });
  });

  it("menolak zoom di luar 1..22", async () => {
    await expect(
      simpanPetaKantor(1, { koordinat: "", zoom: 30, mapTipe: "carto" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(updateKantorWilayah).not.toHaveBeenCalled();
  });
});

describe("cariKepalaWilayah", () => {
  it("tidak mencari penduduk untuk query satu karakter", async () => {
    expect(await cariKepalaWilayah("a")).toEqual([]);
    expect(cariPendudukKepala).not.toHaveBeenCalled();
  });

  it("meneruskan pencarian dengan desa dari sesi", async () => {
    const hasil: KepalaRingkas[] = [{ id: 5, nama: "Budi", nik: "3201", alamat: "" }];
    vi.mocked(cariPendudukKepala).mockResolvedValueOnce(hasil);

    expect(await cariKepalaWilayah("Budi")).toEqual(hasil);
    expect(cariPendudukKepala).toHaveBeenCalledWith(7, "Budi");
  });
});
