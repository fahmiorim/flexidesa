import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";

import { PublicShell } from "./public-shell";

vi.mock("@/features/info-desa/publik/application/website-admin", () => ({
  muatTemaPublik: vi.fn(),
}));
vi.mock("@/themes/renderer", () => ({
  TemaRenderer: ({ children }: { children?: unknown }) => children,
}));

const navigation = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil Desa" },
  { href: "/berita", label: "Berita" },
  { href: "/kontak", label: "Kontak" },
];

describe("PublicShell", () => {
  it("renders the page-supplied navigation in order with the village identity and footer", async () => {
    const markup = renderToStaticMarkup(
      await PublicShell({
        villageName: "Desa Contoh",
        brandLabel: "Dokumen & Informasi Publik",
        navigation,
        children: createElement("section", null, "Isi halaman"),
      }),
    );

    expect(markup).toContain('aria-label="Navigasi utama"');
    expect(markup).toContain("url=%2Fimages%2Flogo.png");
    expect(markup).toContain("Desa Contoh");
    expect(markup).toContain("Dokumen &amp; Informasi Publik");

    const navMarkup = markup.slice(
      markup.indexOf('aria-label="Navigasi utama"'),
      markup.indexOf('href="/masuk"'),
    );
    const positions = navigation.map((item) => navMarkup.indexOf(`href="${item.href}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));

    expect(markup).toContain('href="/masuk"');
    expect(markup).toContain("Pemerintah Desa Contoh");
    expect(markup).not.toContain("FlexiDesa");
    expect(markup).toContain("Isi halaman");
  });

  it("renders data-driven external links as plain anchors", async () => {
    const markup = renderToStaticMarkup(
      await PublicShell({
        villageName: "Desa Contoh",
        brandLabel: "Informasi Publik",
        navigation: [
          { href: "/", label: "Beranda" },
          { href: "https://contoh.id/kanal", label: "Kanal Desa", eksternal: true },
        ],
      }),
    );

    expect(markup).toContain('href="https://contoh.id/kanal" target="_blank" rel="noreferrer"');
    expect(markup).toContain("Kanal Desa");
  });

  it("omits the brand mark for pages that do not render it today", async () => {
    const markup = renderToStaticMarkup(
      await PublicShell({
        villageName: "Desa Contoh",
        brandLabel: "Transparansi Anggaran",
        navigation: [{ href: "/", label: "Beranda" }],
        showMark: false,
      }),
    );

    expect(markup).not.toContain("logo.png");
    expect(markup).toContain("Transparansi Anggaran");
  });

  it("menerapkan warna dasar tema dan menyembunyikan pintasan masuk dari opsi tenant", async () => {
    vi.mocked(muatTemaPublik).mockResolvedValue({
      slug: "cakrawala",
      versi: "1.0.0",
      templateOptions: { warna_dasar: "#abcdef", pintasan_masuk: "0" },
      primary: "#e64946",
      secondary: "#0d2136",
      accent: "#7a20f0",
      background: "#f1f6ff",
      surface: "#ffffff",
      text: "#101b4b",
      judulHero: "",
      subHero: "",
      taglineFooter: "",
      fontHeading: "sans",
      logoTampil: true,
      radius: "15px",
      style: "terang",
      layout: "klasik",
      templateName: "Cakrawala",
    });

    const markup = renderToStaticMarkup(
      await PublicShell({
        villageName: "Desa Contoh",
        brandLabel: "Dokumen Publik",
        navigation,
        villageId: 3,
      }),
    );

    expect(markup).toContain("--public-primary:#abcdef");
    expect(markup).not.toContain('href="/masuk"');
  });
});
