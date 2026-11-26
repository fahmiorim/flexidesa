import { beforeEach, describe, expect, it, vi } from "vitest";

import { simpanIdentitasWebsiteAction, ubahBeritaWebsiteAction } from "./website-admin-use-cases";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  resolveVillageId: vi.fn(),
  getIdentitasDesa: vi.fn(),
  updateIdentitas: vi.fn(),
  ubahBeritaAdmin: vi.fn(),
}));

vi.mock("@/features/info-desa/desa/application/resolve-village", () => ({
  resolveVillageId: mocks.resolveVillageId,
}));

vi.mock("@/features/info-desa/desa/application/use-cases", () => ({
  getIdentitasDesaUseCase: mocks.getIdentitasDesa,
  updateIdentitas: mocks.updateIdentitas,
}));

/**
 * Aksi Website → Konten tidak lagi menulis sendiri: seluruh perubahan berita
 * dan galeri didelegasikan ke operasi `konten-admin`, pemilik tunggal aturan
 * tulis dan kebijakan izinnya.
 */
vi.mock("@/features/info-desa/publik/application/konten-admin", () => ({
  ubahBeritaAdmin: mocks.ubahBeritaAdmin,
  slugBerita: (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 190),
}));

vi.mock("@/features/info-desa/publik/infrastructure/tampilan-repository", () => ({}));
vi.mock("@/features/info-desa/publik/infrastructure/galeri-repository", () => ({}));
vi.mock("@/features/info-desa/publik/application/simpan-berkas-media", () => ({
  simpanBerkasMedia: vi.fn(),
}));
vi.mock("@/features/media/infrastructure/media-storage", () => ({
  hapusMedia: vi.fn(),
}));
vi.mock("@/lib/dal", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/sanitize", () => ({ sanitasiHtml: (html: string) => html }));

function formData(values: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

describe("Website admin actions: preserve stored values on edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "user-1", villageId: 7 });
    mocks.resolveVillageId.mockResolvedValue(7);
    mocks.updateIdentitas.mockResolvedValue(undefined);
    mocks.ubahBeritaAdmin.mockResolvedValue(undefined);
  });

  it("keeps identity fields not present in the website settings form", async () => {
    const identity = {
      kodeKecamatan: "120701",
      kodeKabupaten: "1207",
      kodePropinsi: "12",
      namaKepalaDesa: "H. Kepala Desa Tetap",
      nipKepalaDesa: "198001012010011001",
      logo: "7/identitas/logo.png",
      tandaTangan: "7/identitas/ttd.png",
      stempel: "7/identitas/stempel.png",
      penomoranSurat: 4,
    };
    mocks.getIdentitasDesa.mockResolvedValue(identity);

    const result = simpanIdentitasWebsiteAction(
      formData({
        namaDesa: "Desa Uji",
        kodeDesa: "1207012001",
        kodePos: "20371",
        namaKecamatan: "Kecamatan Uji",
        namaKabupaten: "Kabupaten Uji",
        namaPropinsi: "Provinsi Uji",
        alamatKantor: "Kantor Desa",
        namaKepalaDesa: "Kepala Desa Dari Form",
        nipKepalaDesa: "999999",
        emailDesa: "",
        telepon: "",
        website: "",
      }),
    );

    await expect(result).resolves.toEqual({
      revalidate: ["/profil-desa/website", "/profil-desa/website/pengaturan"],
      redirectTo: "/profil-desa/website/pengaturan?saved=1",
    });
    expect(mocks.getIdentitasDesa).toHaveBeenCalledWith(7);
    expect(mocks.updateIdentitas).toHaveBeenCalledWith(expect.objectContaining(identity), {});
  });

  it("mendelegasikan perubahan berita ke operasi konten-admin tanpa mengarang tanggal terbit", async () => {
    const result = ubahBeritaWebsiteAction(
      formData({
        id: "21",
        judulBerita: "Judul diperbarui",
        slugBerita: "judul-diperbarui",
        isiBerita: "<p>Isi berita</p>",
        ringkasanBerita: "",
        kategoriId: "",
        statusBerita: "published",
      }),
    );

    await expect(result).resolves.toEqual({
      revalidate: ["/profil-desa/website/konten", "/profil-desa/website", "/profil-desa/berita"],
      redirectTo: "/profil-desa/website/konten?saved=1#berita",
    });
    // `terbitPada` null berarti "pertahankan tanggal tersimpan"; pengambilan
    // nilai lama adalah tanggung jawab `ubahBeritaAdmin`, bukan aksi route.
    expect(mocks.ubahBeritaAdmin).toHaveBeenCalledWith(
      21,
      expect.objectContaining({
        status: "published",
        terbitPada: null,
        kategoriId: null,
        ringkasan: null,
      }),
      undefined,
    );
  });
});
