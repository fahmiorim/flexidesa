import { beforeEach, describe, expect, it, vi } from "vitest";

import { hapusOpsiTemaMedia, simpanOpsiTemaDesa } from "./pengaturan-desa-use-cases";

const mocks = vi.hoisted(() => ({
  bacaTemaAktif: vi.fn(),
  simpanOpsiTemaDesaRepo: vi.fn(),
  hapusMedia: vi.fn(),
  simpanBerkasMedia: vi.fn(),
}));

vi.mock("../infrastructure/pengaturan-desa-repository", () => ({
  bacaDataBackupDesa: vi.fn(),
  bacaKuotaMedia: vi.fn(async () => 0),
  bacaTemaAktif: mocks.bacaTemaAktif,
  bacaTemplateTerbit: vi.fn(),
  createLayananDesa: vi.fn(),
  listLayananAdminDesa: vi.fn(),
  listLayananDesa: vi.fn(),
  listTemplateTerbit: vi.fn(),
  nonaktifkanLayananDesa: vi.fn(),
  pulihkanDataBackupDesa: vi.fn(),
  simpanIntegrasiDesa: vi.fn(),
  simpanKontakDesa: vi.fn(),
  simpanOpsiTemaDesa: mocks.simpanOpsiTemaDesaRepo,
  terapkanTemaDesa: vi.fn(),
  updateLayananDesa: vi.fn(),
}));

vi.mock("../infrastructure/pengaturan-nilai-repository", () => ({
  bacaNilaiPengaturan: vi.fn(),
  simpanNilaiPengaturan: vi.fn(),
}));

vi.mock("./pengaturan-use-cases", () => ({
  bacaPengaturan: vi.fn(),
  simpanPengaturanTenant: vi.fn(),
}));

vi.mock("@/features/info-desa/identitas-desa/application/kontrak", () => ({
  bacaIdentitasDesa: vi.fn(),
  bacaProfilDesa: vi.fn(),
  bacaSebutanDesa: vi.fn(),
}));

vi.mock("@/features/info-desa/publik/application/simpan-berkas-media", () => ({
  simpanBerkasMedia: mocks.simpanBerkasMedia,
}));

vi.mock("@/features/media/infrastructure/media-storage", () => ({
  hapusMedia: mocks.hapusMedia,
  hitungUkuranMedia: vi.fn(),
}));

const VILLAGE_ID = 7;

function temaAktif(templateOptions: Record<string, unknown>) {
  return {
    id: 1,
    slug: "natra",
    nama: "Natra",
    versi: "1.0.0",
    opsi: JSON.stringify({ templateOptions }),
  };
}

/**
 * Path aset tema tersimpan di JSON `theme.opsi`, sehingga bisa berasal dari
 * database lama atau kiriman klien. Penghapusan hanya boleh menyasar berkas
 * milik tenant sendiri; path tenant lain tidak boleh dipakai maupun dihapus.
 */
describe("Opsi tema: aset media dibatasi ruang tenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.simpanOpsiTemaDesaRepo.mockResolvedValue(undefined);
    mocks.hapusMedia.mockResolvedValue(undefined);
    mocks.simpanBerkasMedia.mockResolvedValue(`${VILLAGE_ID}/umum/foto_baru.jpg`);
  });

  it("tidak menghapus berkas tenant lain saat opsi dihapus", async () => {
    mocks.bacaTemaAktif.mockResolvedValue(temaAktif({ foto_tidak_tersedia: "9/umum/foto.jpg" }));

    await hapusOpsiTemaMedia(VILLAGE_ID, "foto_tidak_tersedia");

    expect(mocks.hapusMedia).not.toHaveBeenCalled();
    expect(mocks.simpanOpsiTemaDesaRepo).toHaveBeenCalledTimes(1);
  });

  it("menghapus berkas tenant sendiri saat opsi dihapus", async () => {
    mocks.bacaTemaAktif.mockResolvedValue(
      temaAktif({ foto_tidak_tersedia: `${VILLAGE_ID}/umum/foto.jpg` }),
    );

    await hapusOpsiTemaMedia(VILLAGE_ID, "foto_tidak_tersedia");

    expect(mocks.hapusMedia).toHaveBeenCalledWith(`${VILLAGE_ID}/umum/foto.jpg`);
  });

  it("menolak simpan opsi dengan path media tenant lain", async () => {
    mocks.bacaTemaAktif.mockResolvedValue(temaAktif({}));

    await expect(
      simpanOpsiTemaDesa(VILLAGE_ID, { opsi: { foto_tidak_tersedia: "9/umum/foto.jpg" } }),
    ).rejects.toThrow(/unggahan desa ini/);
    expect(mocks.simpanOpsiTemaDesaRepo).not.toHaveBeenCalled();
  });

  it("menyimpan opsi dengan path media tenant sendiri", async () => {
    mocks.bacaTemaAktif.mockResolvedValue(temaAktif({}));

    await simpanOpsiTemaDesa(VILLAGE_ID, {
      opsi: { foto_tidak_tersedia: `${VILLAGE_ID}/umum/foto.jpg`, warna_dasar: "#123456" },
    });

    expect(mocks.simpanOpsiTemaDesaRepo).toHaveBeenCalledWith(
      VILLAGE_ID,
      expect.objectContaining({
        foto_tidak_tersedia: `${VILLAGE_ID}/umum/foto.jpg`,
        warna_dasar: "#123456",
      }),
    );
  });
});
