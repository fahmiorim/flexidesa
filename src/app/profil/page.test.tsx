import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfilDesaPage from "./page";

const sumber = vi.hoisted(() => ({
  getIdentitasFromRequest: vi.fn(),
  getStatistikDesa: vi.fn(),
  profilDesaPublik: vi.fn(),
  daftarPerangkatPublik: vi.fn(),
  daftarSliderBeranda: vi.fn(),
  daftarAlbumGaleri: vi.fn(),
  daftarFotoAlbum: vi.fn(),
}));

vi.mock("@/features/desa/application/resolve-village", () => ({
  getIdentitasFromRequest: sumber.getIdentitasFromRequest,
}));
vi.mock("@/features/desa/application/statistik-desa", () => ({
  getStatistikDesa: sumber.getStatistikDesa,
}));
vi.mock("@/features/publik/application/konten-publik", () => ({
  profilDesaPublik: sumber.profilDesaPublik,
  daftarPerangkatPublik: sumber.daftarPerangkatPublik,
  daftarSliderBeranda: sumber.daftarSliderBeranda,
  daftarAlbumGaleri: sumber.daftarAlbumGaleri,
  daftarFotoAlbum: sumber.daftarFotoAlbum,
}));
vi.mock("../public-site-layout", () => ({
  PublicSiteHeader: () => null,
  PublicSiteFooter: () => null,
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt?: string }) => <img src={src} alt={alt ?? ""} />,
}));

describe("ProfilDesaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sumber.getIdentitasFromRequest.mockResolvedValue({
      id: 1,
      namaDesa: "Kwala Gunung",
      kodeDesa: "1219102009",
      kodePos: "21255",
      namaKecamatan: "DATUK LIMA PULUH",
      kodeKecamatan: "121910",
      namaKabupaten: "BATU BARA",
      kodeKabupaten: "1219",
      namaPropinsi: "SUMATERA UTARA",
      kodePropinsi: "12",
      alamatKantor: null,
      namaKepalaDesa: "Suhardi",
      nipKepalaDesa: null,
      emailDesa: null,
      telepon: null,
      website: null,
      logo: null,
      fotoKantor: "foto-kantor.jpg",
      tandaTangan: null,
      stempel: null,
      domain: null,
      penomoranSurat: 2,
    });
    sumber.getStatistikDesa.mockResolvedValue({
      total: 1,
      lakiLaki: 1,
      perempuan: 0,
      keluarga: 1,
      perDusun: [],
    });
    sumber.profilDesaPublik.mockResolvedValue({
      visi: null,
      misi: null,
      sejarah: null,
      sambutan: null,
      koordinat: null,
      luasWilayah: "532.92",
      batasUtara: null,
      batasSelatan: null,
      batasTimur: null,
      batasBarat: null,
      ketinggian: null,
      suhuRataRata: null,
      curahHujan: null,
      topografi: null,
      batasDesa: null,
    });
    sumber.daftarPerangkatPublik.mockResolvedValue([]);
    sumber.daftarSliderBeranda.mockResolvedValue([]);
    sumber.daftarAlbumGaleri.mockResolvedValue([]);
    sumber.daftarFotoAlbum.mockResolvedValue([]);
  });

  it("menampilkan luas wilayah yang tersimpan dalam profil desa", async () => {
    const halaman = await ProfilDesaPage();
    const html = renderToStaticMarkup(halaman);

    expect(html).toContain("532,92 Ha");
  });
  it("memakai foto kantor untuk bagian Tentang sebelum gambar slider", async () => {
    sumber.daftarSliderBeranda.mockResolvedValue([
      { gambar: "slide-1.jpg" },
      { gambar: "slide-2.jpg" },
      { gambar: "slide-3.jpg" },
    ]);

    const halaman = await ProfilDesaPage();
    const html = renderToStaticMarkup(halaman);

    expect(html).toContain('src="/api/publik/media/1/foto-kantor.jpg"');
    expect(html).toContain('alt="Foto kantor Kwala Gunung"');
  });
});
