import { beforeEach, describe, expect, it, vi } from "vitest";

import { simpanIdentitasWebsiteAction, ubahBeritaWebsiteAction } from "./website-admin-actions";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  resolveVillageId: vi.fn(),
  getIdentitasDesa: vi.fn(),
  updateIdentitas: vi.fn(),
  cariBeritaById: vi.fn(),
  cariBeritaBySlug: vi.fn(),
  cariKategoriById: vi.fn(),
  ubahBerita: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("@/features/desa/application/resolve-village", () => ({
  resolveVillageId: mocks.resolveVillageId,
}));

vi.mock("@/features/desa/application/use-cases", () => ({
  getIdentitasDesaUseCase: mocks.getIdentitasDesa,
  updateIdentitas: mocks.updateIdentitas,
}));

vi.mock("@/features/publik/infrastructure/website-admin-repository", () => ({
  cariBeritaById: mocks.cariBeritaById,
  cariBeritaBySlug: mocks.cariBeritaBySlug,
  cariKategoriById: mocks.cariKategoriById,
  ubahBerita: mocks.ubahBerita,
}));

vi.mock("@/features/publik/infrastructure/content-repository", () => ({}));
vi.mock("@/features/publik/application/simpan-berkas-media", () => ({
  simpanBerkasMedia: vi.fn(),
}));
vi.mock("@/features/publik/infrastructure/media-storage", () => ({
  hapusMedia: vi.fn(),
}));
vi.mock("@/lib/dal", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/sanitize", () => ({ sanitasiHtml: (html: string) => html }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

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
    mocks.ubahBerita.mockResolvedValue(undefined);
    mocks.cariBeritaBySlug.mockResolvedValue(undefined);
    mocks.cariKategoriById.mockResolvedValue(undefined);
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

    await expect(result).rejects.toThrow("NEXT_REDIRECT:/website/pengaturan?saved=1");
    expect(mocks.getIdentitasDesa).toHaveBeenCalledWith(7);
    expect(mocks.updateIdentitas).toHaveBeenCalledWith(expect.objectContaining(identity), {});
  });

  it("preserves the existing publication date when editing a published article", async () => {
    const publicationDate = new Date("2024-05-06T07:08:09.000Z");
    mocks.cariBeritaById.mockResolvedValue({
      id: 21,
      gambar: "7/berita/cover.jpg",
      terbitPada: publicationDate,
    });

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

    await expect(result).rejects.toThrow("NEXT_REDIRECT:/website/konten?saved=1#berita");
    expect(mocks.cariBeritaById).toHaveBeenCalledWith(7, 21);
    expect(mocks.ubahBerita).toHaveBeenCalledWith(
      7,
      21,
      expect.objectContaining({ status: "published", terbitPada: publicationDate }),
    );
  });
});
