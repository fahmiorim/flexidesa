import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeroBeranda } from "./bagian-hero";

type Props = ComponentProps<typeof HeroBeranda>;

/**
 * Fixture parsial untuk test markup: hero hanya membaca sebagian kecil data
 * identitas dan perangkat, jadi field lain diisi lewat assertion ini.
 */
function fixture<T>(nilai: Partial<T>): T {
  return nilai as T;
}

const desa = fixture<Props["desa"]>({
  id: 1,
  namaDesa: "Desa Contoh",
  namaKecamatan: "Sei Balai",
  namaKabupaten: "Batu Bara",
  namaPropinsi: "Sumatera Utara",
  logo: null,
});

const leader = fixture<NonNullable<Props["leader"]>>({
  id: 9,
  nama: "Budi",
  gelarDepan: null,
  gelarBelakang: null,
  jabatan: "Kepala Desa",
  foto: null,
  urut: 1,
});

describe("HeroBeranda varian template", () => {
  it("memakai varian klasik secara bawaan", () => {
    const markup = renderToStaticMarkup(
      <HeroBeranda desa={desa} leader={leader} heroImage={null} />,
    );
    expect(markup).toContain('data-varian="klasik"');
    expect(markup).not.toContain("heroLeader");
  });

  it("meneruskan varian template ke markup hero", () => {
    const markup = renderToStaticMarkup(
      <HeroBeranda desa={desa} leader={leader} heroImage={null} varian="modern" />,
    );
    expect(markup).toContain('data-varian="modern"');
    expect(markup).toContain("Kepala Desa");
  });
});
