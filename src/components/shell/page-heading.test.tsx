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
  it("memindah tombol aksi dari bilah atas ke badan halaman", () => {
    render(
      <PageHeading>
        <div className="page-heading">
          <div>
            <span className="eyebrow">Layanan Surat</span>
            <h1>Cetak Surat</h1>
            <p>Pilih jenis surat.</p>
          </div>
          <div className="page-heading-actions">
            <Link href="/persuratan/surat/baru" className="button button-primary">
              Buat Surat Baru
            </Link>
          </div>
        </div>
      </PageHeading>,
    );

    const slot = document.getElementById(PAGE_HEADING_SLOT_ID);
    expect(slot?.querySelector("h1")?.textContent).toBe("Cetak Surat");
    expect(slot?.querySelector("a")).toBeNull();

    const badan = document.querySelector(".page-heading-actions-body");
    expect(badan?.querySelector("a")?.textContent).toContain("Buat Surat Baru");
    expect(badan?.querySelector("a")?.getAttribute("href")).toBe("/persuratan/surat/baru");
  });

  it("memindah tautan kembali di dalam blok judul ke badan halaman", () => {
    render(
      <PageHeading>
        <div className="page-heading">
          <div>
            <Link href="/persuratan/surat" className="button button-secondary">
              Kembali
            </Link>
            <h1>Buat Surat Baru</h1>
            <p>Buat konsep surat.</p>
          </div>
        </div>
      </PageHeading>,
    );

    const slot = document.getElementById(PAGE_HEADING_SLOT_ID);
    expect(slot?.querySelector("h1")?.textContent).toBe("Buat Surat Baru");
    expect(slot?.querySelector("a")).toBeNull();
    expect(document.querySelector(".page-heading-actions-body a")?.textContent).toContain(
      "Kembali",
    );
  });

  it("membiarkan heading tanpa aksi tetap utuh di bilah atas", () => {
    render(
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Judul Saja</h1>
            <p>Tanpa tombol.</p>
          </div>
        </div>
      </PageHeading>,
    );

    const slot = document.getElementById(PAGE_HEADING_SLOT_ID);
    expect(slot?.querySelector("h1")?.textContent).toBe("Judul Saja");
    expect(document.querySelector(".page-heading-actions-body")).toBeNull();
  });

  it("menangani aksi berformat form tanpa mengubahnya", () => {
    render(
      <PageHeading>
        <header className="page-heading">
          <div aria-hidden="true">ikon</div>
          <div>
            <h1>Buku Administrasi</h1>
            <p>Semua buku.</p>
          </div>
          <div>
            <form action="/sinkron">
              <button type="submit">Sinkron</button>
            </form>
          </div>
        </header>
      </PageHeading>,
    );

    const slot = document.getElementById(PAGE_HEADING_SLOT_ID);
    expect(slot?.querySelector("h1")?.textContent).toBe("Buku Administrasi");
    expect(slot?.querySelector("form")).toBeNull();
    expect(document.querySelector(".page-heading-actions-body form button")?.textContent).toBe(
      "Sinkron",
    );
  });
});
