import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  aksesPotensiAdmin,
  aksesSaranaAdmin,
  hapusPotensiAdmin,
  hapusSaranaAdmin,
  simpanPotensiAdmin,
  simpanSaranaAdmin,
} from "./konten-admin";

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

vi.mock("@/features/info-desa/konten/domain/dokumen", () => ({
  DOKUMEN_RESOURCE: "dokumen",
  dokumenPublikFormSchema: { safeParse: (v: unknown) => ({ success: true, data: v }) },
}));

vi.mock("@/features/info-desa/konten/domain/galeri", () => ({
  albumFormSchema: { safeParse: (v: unknown) => ({ success: true, data: v }) },
  fotoFormSchema: { safeParse: (v: unknown) => ({ success: true, data: v }) },
  MAKS_FOTO_PER_UNGGAH: 10,
  slugAlbum: (v: string) => v,
}));

vi.mock("@/features/info-desa/publik/infrastructure/dokumen-repository", () => ({
  createDokumenPublik: vi.fn(),
  deleteDokumenPublik: vi.fn(),
  dokumenSlugExists: vi.fn(),
  updateDokumenPublik: vi.fn(),
}));

vi.mock("@/features/info-desa/publik/infrastructure/galeri-repository", () => ({
  hapusVideoGaleriAdmin: vi.fn(),
  listAlbumGaleri: vi.fn(),
  listVideoGaleriAdmin: vi.fn(),
  simpanMetadataAlbumAdmin: vi.fn(),
  tambahVideoGaleriAdmin: vi.fn(),
}));

vi.mock("@/features/info-desa/publik/infrastructure/potensi-sarana-repository", () => ({
  hapusPotensiAdmin: mocks.hapusPotensiRepo,
  hapusSaranaAdmin: mocks.hapusSaranaRepo,
  simpanPotensiAdmin: mocks.simpanPotensiRepo,
  simpanSaranaAdmin: mocks.simpanSaranaRepo,
}));

vi.mock("@/features/media/infrastructure/media-storage", () => ({
  hapusMedia: vi.fn(),
}));

vi.mock("@/features/info-desa/publik/infrastructure/berita-admin-repository", () => ({
  ambilGambarBerita: vi.fn(),
  buatBerita: vi.fn(),
  buatKategoriBerita: vi.fn(),
  cariBeritaById: vi.fn(),
  cariBeritaBySlug: vi.fn(),
  cariBeritaDenganKategori: vi.fn(),
  cariKategoriById: vi.fn(),
  cariKategoriBySlug: vi.fn(),
  hapusBerita: vi.fn(),
  hapusKategoriBerita: vi.fn(),
  listBeritaKontenAdmin: vi.fn(),
  listKategoriBeritaAdmin: vi.fn(),
  ubahBerita: vi.fn(),
  ubahKategoriBerita: vi.fn(),
  ubahStatusBerita: vi.fn(),
}));

vi.mock("@/features/info-desa/publik/infrastructure/galeri-admin-repository", () => ({
  buatAlbum: vi.fn(),
  buatFoto: vi.fn(),
  cariAlbumByIdLengkap: vi.fn(),
  cariAlbumBySlug: vi.fn(),
  cariFotoByIdLengkap: vi.fn(),
  hapusAlbum: vi.fn(),
  hapusFoto: vi.fn(),
  listAlbumAdminLengkap: vi.fn(),
  listFotoAdmin: vi.fn(),
  listFotoByAlbumAdmin: vi.fn(),
  listGambarFotoByAlbum: vi.fn(),
  ubahAlbum: vi.fn(),
  ubahFoto: vi.fn(),
}));

vi.mock("@/features/info-desa/publik/infrastructure/dokumen-admin-repository", () => ({
  cariDokumenById: vi.fn(),
  listDokumenAdmin: vi.fn(),
}));

vi.mock("@/features/pengaturan/rbac/application/authorization", () => ({
  hasPermission: (permissions: readonly string[], resource: string, action: string) =>
    permissions.includes(`${resource}:${action}`),
}));

vi.mock("@/lib/dal", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/sanitize", () => ({
  sanitasiHtml: (html: string) => html,
  teksPolos: (html: string) => html.replace(/<[^>]*>/g, ""),
}));
vi.mock("@/lib/utils", () => ({ slugify: (v: string) => v }));
vi.mock("./simpan-berkas-media", () => ({ simpanBerkasMedia: vi.fn() }));

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
