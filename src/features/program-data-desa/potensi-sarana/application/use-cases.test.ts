import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  aksesPotensiAdmin,
  aksesSaranaAdmin,
  hapusPotensiAdmin,
  hapusSaranaAdmin,
  simpanPotensiAdmin,
  simpanSaranaAdmin,
} from "./use-cases";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  resolveVillageId: vi.fn(),
  simpanPotensiRepo: vi.fn(),
  hapusPotensiRepo: vi.fn(),
  simpanSaranaRepo: vi.fn(),
  hapusSaranaRepo: vi.fn(),
}));

vi.mock("@/features/info-desa/desa/application/resolve-village", () => ({
  resolveVillageId: mocks.resolveVillageId,
}));

vi.mock(
  "@/features/program-data-desa/potensi-sarana/infrastructure/potensi-sarana-repository",
  () => ({
    hapusPotensiAdmin: mocks.hapusPotensiRepo,
    hapusSaranaAdmin: mocks.hapusSaranaRepo,
    simpanPotensiAdmin: mocks.simpanPotensiRepo,
    simpanSaranaAdmin: mocks.simpanSaranaRepo,
  }),
);

vi.mock("@/features/pengaturan/rbac/application/authorization", () => ({
  hasPermission: (permissions: readonly string[], resource: string, action: string) =>
    permissions.includes(`${resource}:${action}`),
}));

vi.mock("@/lib/dal", () => ({ requirePermission: mocks.requirePermission }));

const potensiInput = {
  id: 0,
  kategori: "pertanian",
  judul: "Padi",
  slug: "padi",
  ringkasan: null,
  deskripsi: null,
  gambar: null,
  lokasi: null,
  kontak: null,
  unggulan: false,
  aktif: true,
  indikator: [],
};

const saranaInput = {
  id: 0,
  nama: "Balai Desa",
  kategori: "lainnya",
  lokasi: null,
  keterangan: null,
  aktif: true,
};

describe("Izin Potensi/Sarana mengikuti slug menu (bukan profil-desa)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveVillageId.mockResolvedValue(7);
    mocks.requirePermission.mockImplementation(async (resource: string, action: string) => ({
      id: "user-1",
      villageId: 7,
      permissions: [`${resource}:${action}`],
    }));
  });

  it("simpan potensi baru memakai potensi:create, ubah memakai potensi:update", async () => {
    await simpanPotensiAdmin(potensiInput);
    expect(mocks.requirePermission).toHaveBeenCalledWith("potensi", "create");

    vi.clearAllMocks();
    mocks.requirePermission.mockImplementation(async (resource: string, action: string) => ({
      id: "user-1",
      villageId: 7,
      permissions: [`${resource}:${action}`],
    }));
    await simpanPotensiAdmin({ ...potensiInput, id: 3 });
    expect(mocks.requirePermission).toHaveBeenCalledWith("potensi", "update");
  });

  it("hapus potensi memakai potensi:delete (bukan update)", async () => {
    await hapusPotensiAdmin(3);
    expect(mocks.requirePermission).toHaveBeenCalledWith("potensi", "delete");
  });

  it("simpan sarana baru/ubah/hapus memakai sarana-prasarana", async () => {
    await simpanSaranaAdmin(saranaInput);
    expect(mocks.requirePermission).toHaveBeenCalledWith("sarana-prasarana", "create");

    vi.clearAllMocks();
    mocks.requirePermission.mockImplementation(async (resource: string, action: string) => ({
      id: "user-1",
      villageId: 7,
      permissions: [`${resource}:${action}`],
    }));
    await simpanSaranaAdmin({ ...saranaInput, id: 5 });
    expect(mocks.requirePermission).toHaveBeenCalledWith("sarana-prasarana", "update");

    vi.clearAllMocks();
    mocks.requirePermission.mockImplementation(async (resource: string, action: string) => ({
      id: "user-1",
      villageId: 7,
      permissions: [`${resource}:${action}`],
    }));
    await hapusSaranaAdmin(5);
    expect(mocks.requirePermission).toHaveBeenCalledWith("sarana-prasarana", "delete");
  });

  it("aksesPotensiAdmin/aksesSaranaAdmin membaca izin per resource sendiri", async () => {
    mocks.requirePermission.mockResolvedValue({
      id: "user-1",
      villageId: 7,
      permissions: ["potensi:update", "sarana-prasarana:create"],
    });
    await expect(aksesPotensiAdmin()).resolves.toEqual({
      bolehTambah: false,
      bolehUbah: true,
      bolehHapus: false,
    });
    await expect(aksesSaranaAdmin()).resolves.toEqual({
      bolehTambah: true,
      bolehUbah: false,
      bolehHapus: false,
    });
  });
});
