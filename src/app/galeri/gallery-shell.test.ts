import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";

import { GalleryShell } from "./gallery-shell";

vi.mock("@/features/info-desa/publik/application/website-admin", () => ({
  muatTemaPublik: vi.fn(),
}));
vi.mock("@/themes/renderer", () => ({
  TemaRenderer: ({ children }: { children?: unknown }) => children,
}));

const TEMA_DASAR = {
  slug: "cakrawala",
  versi: "1.0.0",
  templateOptions: null as Record<string, unknown> | null,
  primary: "#e64946",
  secondary: "#0d2136",
  accent: "#7a20f0",
  background: "#f1f6ff",
  surface: "#ffffff",
  text: "#101b4b",
  judulHero: "",
  subHero: "",
  taglineFooter: "",
  fontHeading: "sans" as const,
  logoTampil: true,
  radius: "15px",
  style: "terang" as const,
  layout: "klasik" as const,
  templateName: "Cakrawala",
};

describe("GalleryShell", () => {
  it("renders the existing gallery navigation, village identity, footer and page content", async () => {
    const markup = renderToStaticMarkup(
      await GalleryShell({
        villageName: "Desa Contoh",
        children: createElement("section", null, "Isi halaman"),
      }),
    );

    expect(markup).toContain('aria-label="Navigasi utama"');
    expect(markup).toContain("url=%2Fimages%2Flogo.png");
    expect(markup).toContain("Desa Contoh");
    expect(markup).toContain('href="/profil"');
    expect(markup).toContain('href="/berita"');
    expect(markup).toContain('href="/agenda"');
    expect(markup).toContain('href="/masuk"');
    expect(markup).toContain("Pemerintah Desa Contoh");
    expect(markup).not.toContain("FlexiDesa");
    expect(markup).toContain("Isi halaman");
  });

  it("menerapkan warna dasar tema dan menyembunyikan pintasan masuk dari opsi tenant", async () => {
    vi.mocked(muatTemaPublik).mockResolvedValue({
      ...TEMA_DASAR,
      templateOptions: { warna_dasar: "#abcdef", pintasan_masuk: "0" },
    });

    const markup = renderToStaticMarkup(
      await GalleryShell({ villageName: "Desa Contoh", villageId: 3 }),
    );

    expect(markup).toContain("--public-primary:#abcdef");
    expect(markup).not.toContain('href="/masuk"');
  });
});
