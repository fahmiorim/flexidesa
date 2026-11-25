import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { KeluargaListRow } from "@/features/keluarga/domain/keluarga";
import {
  buildKeluargaDaftarPdf,
  buildKeluargaDaftarXlsx,
} from "@/features/keluarga/infrastructure/keluarga-daftar";

const baris: KeluargaListRow = {
  id: 1,
  number: "3201010001000001",
  temporary: false,
  address: "Jl. Melati No. 3",
  regionId: 1,
  welfareClass: 2,
  cardPrintedAt: "2026-01-20",
  registeredAt: "2024-02-11",
  headName: "Siti Aminah",
  headNationalId: "3201010101850001",
  headGender: "female",
  headIdCardTag: null,
  headLifeStatus: "alive",
  memberCount: 4,
  regionLabel: "Dusun Mekar, RW 02, RT 03",
  dusun: "Mekar",
  rw: "02",
  rt: "03",
};

describe("daftar KK untuk cetak/unduh", () => {
  it("membuat PDF daftar dengan data terfilter", async () => {
    const bytes = await buildKeluargaDaftarPdf({
      rows: [baris],
      namaDesa: "Desa Contoh",
      sensor: false,
    });

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("membuat XLSX dan menyensor NIK/No. KK bila diminta", async () => {
    const bytes = await buildKeluargaDaftarXlsx({
      rows: [baris],
      namaDesa: "Desa Contoh",
      sensor: true,
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet("Data Keluarga");

    expect(sheet?.getRow(6).getCell(2).value).toBe("32010100XXXXXXXX");
    expect(sheet?.getRow(6).getCell(4).value).toBe("32010101XXXXXXXX");
    expect(sheet?.getRow(6).getCell(5).value).toBe(4);
  });
});
