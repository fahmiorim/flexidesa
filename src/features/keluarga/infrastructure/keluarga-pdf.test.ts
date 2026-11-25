import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { KeluargaMemberDetail } from "@/features/keluarga/domain/keluarga";
import { buildKeluargaPdf } from "@/features/keluarga/infrastructure/keluarga-pdf";

function anggota(index: number): KeluargaMemberDetail {
  return {
    id: index,
    name: `Anggota ${index}`,
    nationalId: `32010101018500${String(index).padStart(2, "0")}`,
    gender: index % 2 === 0 ? "female" : "male",
    birthDate: "1985-04-12",
    relationName: index === 1 ? "KEPALA KELUARGA" : "ANAK",
    birthPlace: "Bandung",
    religionName: "ISLAM",
    educationName: "SLTA/SEDERAJAT",
    occupationName: "PETANI",
    maritalStatusName: "KAWIN",
    bloodTypeName: "O",
    citizenshipName: "WNI",
    passportNumber: null,
    kitasNumber: null,
    marriageDate: "2010-06-01",
    divorceDate: null,
    fatherName: "Ayah",
    motherName: "Ibu",
  };
}

describe("PDF Kartu Keluarga", () => {
  it("membuat dokumen KK dengan data wilayah dan halaman lanjutan", async () => {
    const bytes = await buildKeluargaPdf({
      desa: null,
      nomorKk: "3201010001000001",
      alamat: "Jl. Melati No. 3",
      wilayah: { dusun: "Mekar", rw: "02", rt: "03" },
      anggota: Array.from({ length: 14 }, (_, index) => anggota(index + 1)),
    });

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
  });
});
