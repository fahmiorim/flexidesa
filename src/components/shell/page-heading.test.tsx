// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import Link from "next/link";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PAGE_HEADING_SLOT_ID, PageHeading } from "./page-heading";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  document.body.innerHTML = `<div id="${PAGE_HEADING_SLOT_ID}"></div>`;
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("PageHeading", () => {
  it("merender judul dan deskripsi ke bilah atas", () => {
    render(<PageHeading judul="Cetak Surat" deskripsi="Pilih jenis surat." />);

    const slot = document.getElementById(PAGE_HEADING_SLOT_ID);
    expect(slot?.querySelector("h1")?.textContent).toBe("Cetak Surat");
    expect(slot?.querySelector("p")?.textContent).toBe("Pilih jenis surat.");
    expect(document.querySelector(".page-heading-actions-body")).toBeNull();
  });

  it("merender aksi di badan halaman, bukan di bilah atas", () => {
    render(
      <PageHeading
        judul="Daftar Surat"
        aksi={
          <Link href="/layanan-surat/persuratan/surat/baru" className="button button-primary">
            Buat Surat Baru
          </Link>
        }
      />,
    );

    const slot = document.getElementById(PAGE_HEADING_SLOT_ID);
    expect(slot?.querySelector("a")).toBeNull();

    const badan = document.querySelector(".page-heading-actions-body");
    expect(badan?.querySelector("a")?.textContent).toContain("Buat Surat Baru");
    expect(badan?.querySelector("a")?.getAttribute("href")).toBe(
      "/layanan-surat/persuratan/surat/baru",
    );
  });

  it("mendukung judul berupa JSX dan teks di atas judul", () => {
    render(
      <PageHeading
        atasJudul={<span className="eyebrow">PEMERINTAHAN DESA</span>}
        judul={
          <>
            Data <strong>Lembaga</strong>
          </>
        }
        deskripsi="Daftar lembaga desa."
      />,
    );

    const slot = document.getElementById(PAGE_HEADING_SLOT_ID);
    expect(slot?.querySelector(".eyebrow")?.textContent).toBe("PEMERINTAHAN DESA");
    expect(slot?.querySelector("h1 strong")?.textContent).toBe("Lembaga");
  });

  it("mempertahankan kelas wadah kustom", () => {
    render(<PageHeading kelas="page-heading pemerintahan-cetak-toolbar" judul="Cetak Data" />);

    const slot = document.getElementById(PAGE_HEADING_SLOT_ID);
    expect(slot?.querySelector("header")?.className).toBe(
      "page-heading pemerintahan-cetak-toolbar",
    );
  });
});
