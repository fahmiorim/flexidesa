import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { PendudukEksporRow } from "@/features/kependudukan/penduduk/domain/penduduk-export";

import { buildPendudukPdf } from "./penduduk-pdf";

function baris(nama: string): PendudukEksporRow {
  return {
    name: nama,
    gender: "male",
    lifeStatus: "alive",
    nationalId: "3201010101010009",
    familyNumber: "3201010101010001",
    birthPlace: "Bukittinggi",
    birthDate: "1990-02-01",
    religionName: "Islam",
    educationName: "SLTA/Sederajat",
    occupationName: "Petani",
    address: "Jl. Contoh No. 1",
    dusun: "Sukamaju",
    rw: "01",
    rt: "02",
  } as PendudukEksporRow;
}

describe("PDF data penduduk", () => {
  it("membuat PDF yang dapat dibuka dan menambah halaman saat data panjang", async () => {
    const isi = await buildPendudukPdf(
      Array.from({ length: 60 }, (_, index) => baris(`Penduduk ${index + 1}`)),
      "Desa Contoh",
    );
    const pdf = await PDFDocument.load(isi);

    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(isi.byteLength).toBeGreaterThan(1000);
  });

  it("tetap membuat PDF saat filter tidak menghasilkan data", async () => {
    const isi = await buildPendudukPdf([], "Desa Contoh");
    const pdf = await PDFDocument.load(isi);

    expect(pdf.getPageCount()).toBe(1);
  });
});
