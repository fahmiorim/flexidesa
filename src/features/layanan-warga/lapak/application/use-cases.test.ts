import { beforeEach, describe, expect, it, vi } from "vitest";

import { hapusProdukLapak, simpanLapakBaru, tambahProdukLapak, ubahLapak } from "./use-cases";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  resolveVillageId: vi.fn(),
  findLapakById: vi.fn(),
  insertLapak: vi.fn(),
  updateLapak: vi.fn(),
  deleteLapak: vi.fn(),
  listLapak: vi.fn(),
  listKategoriLapak: vi.fn(),
  listProdukLapak: vi.fn(),
  insertProdukLapak: vi.fn(),
  updateProdukLapak: vi.fn(),
  deleteProdukLapak: vi.fn(),
}));

vi.mock("@/features/info-desa/desa/application/resolve-village", () => ({
  resolveVillageId: mocks.resolveVillageId,
}));

vi.mock("@/features/layanan-warga/lapak/infrastructure/lapak-repository", () => ({
  deleteLapak: mocks.deleteLapak,
  deleteProdukLapak: mocks.deleteProdukLapak,
  findLapakById: mocks.findLapakById,
  insertLapak: mocks.insertLapak,
  insertProdukLapak: mocks.insertProdukLapak,
  listKategoriLapak: mocks.listKategoriLapak,
  listLapak: mocks.listLapak,
  listProdukLapak: mocks.listProdukLapak,
  updateLapak: mocks.updateLapak,
  updateProdukLapak: mocks.updateProdukLapak,
}));

vi.mock("@/features/pengaturan/rbac/application/authorization", () => ({
  hasPermission: (permissions: readonly string[], resource: string, action: string) =>
    permissions.includes(`${resource}:${action}`),
}));

vi.mock("@/lib/dal", () => ({ requirePermission: mocks.requirePermission }));

const izinPenuh = ["lapak:create", "lapak:update", "lapak:delete"];

const lapakTersimpan = {
  id: 7,
  villageId: 1,
  residentId: null,
  nama: "Warung Bu Ani",
  pemilik: "Ani",
  kategori: "Makanan",
  alamat: null,
  keterangan: null,
  produkCount: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requirePermission.mockResolvedValue({
    id: "user-1",
    permissions: izinPenuh.map((izin) => izin),
  });
  mocks.resolveVillageId.mockResolvedValue(1);
  mocks.findLapakById.mockResolvedValue(lapakTersimpan);
  mocks.insertLapak.mockResolvedValue(9);
  mocks.insertProdukLapak.mockResolvedValue(11);
  mocks.updateProdukLapak.mockResolvedValue(true);
  mocks.deleteProdukLapak.mockResolvedValue(true);
});

describe("use case lapak", () => {
  it("menyimpan lapak dengan desa dari sesi dan kolom kosong menjadi null", async () => {
    await simpanLapakBaru({
      nama: "  Warung Bu Ani  ",
      pemilik: "",
      kategori: "Makanan",
      alamat: "",
      keterangan: "",
    });

    expect(mocks.resolveVillageId).toHaveBeenCalled();
    expect(mocks.insertLapak).toHaveBeenCalledWith(1, {
      nama: "Warung Bu Ani",
      pemilik: null,
      kategori: "Makanan",
      alamat: null,
      keterangan: null,
    });
  });

  it("menolak nama lapak kosong tanpa menyentuh basis data", async () => {
    await expect(
      simpanLapakBaru({ nama: " ", pemilik: "", kategori: "", alamat: "", keterangan: "" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(mocks.insertLapak).not.toHaveBeenCalled();
  });

  it("menolak mengubah lapak milik desa lain", async () => {
    mocks.findLapakById.mockResolvedValue(null);

    await expect(
      ubahLapak(99, { nama: "Lapak lain", pemilik: "", kategori: "", alamat: "", keterangan: "" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.updateLapak).not.toHaveBeenCalled();
  });

  it("memetakan produk: harga kosong menjadi 0, stok kosong 0, aktif mati 0", async () => {
    await tambahProdukLapak(7, {
      nama: "Keripik Pisang",
      deskripsi: "",
      harga: "",
      stok: "",
      gambar: "",
      aktif: false,
      latitude: "",
      longitude: "",
    });

    expect(mocks.insertProdukLapak).toHaveBeenCalledWith(1, 7, {
      nama: "Keripik Pisang",
      deskripsi: null,
      harga: "0",
      stok: 0,
      gambar: null,
      aktif: 0,
      latitude: null,
      longitude: null,
    });
  });

  it("menolak produk pada lapak yang bukan milik desa pengguna", async () => {
    mocks.findLapakById.mockResolvedValue(null);

    await expect(
      tambahProdukLapak(77, {
        nama: "Produk asing",
        deskripsi: "",
        harga: "1000",
        stok: "1",
        gambar: "",
        aktif: true,
        latitude: "",
        longitude: "",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.insertProdukLapak).not.toHaveBeenCalled();
  });

  it("melaporkan produk yang tidak ditemukan saat dihapus", async () => {
    mocks.deleteProdukLapak.mockResolvedValue(false);

    await expect(hapusProdukLapak(7, 404)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
