import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { DptRow } from "@/features/kependudukan/penduduk/domain/dpt";
import {
  buildDptPdf,
  buildDptXlsx,
  type DptExportInput,
} from "@/features/kependudukan/penduduk/infrastructure/dpt-export";

const baris: DptRow = {
  id: 1,
  nationalId: "3201012001000001",
  idCardTag: "123456789",
  name: "Ani",
  gender: "female",
  birthPlace: "Bandung",
  birthDate: "1990-01-01",
  familyId: 1,
  familyNumber: "3201010001000001",
  address: "Jl. Melati No. 3",
  dusun: "Sukamaju",
  rw: "01",
  rt: "02",
  agama: "Islam",
  pendidikan: "SMA",
  pendidikanSedang: null,
  pekerjaan: "Petani",
  statusKawin: "Kawin",
  familyRelation: "KEPALA KELUARGA",
  fatherName: "Ayah",
  motherName: "Ibu",
  umurPemilihan: 36,
};

function input(sensor: boolean): DptExportInput {
  return {
    rows: [baris],
    namaDesa: "Desa Sukamaju",
    judulPemilihan: "Pemilihan Kepala Desa 2026",
    tanggalPemilihan: "2026-06-01",
    sensor,
  };
}

describe("ekspor calon pemilih", () => {
  it("membuat PDF daftar pemilih", async () => {
    const bytes = await buildDptPdf(input(false));
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("membuat XLSX dan menyensor NIK/No. KK", async () => {
    const bytes = await buildDptXlsx(input(true));
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet("Calon Pemilih");

    expect(sheet?.getRow(2).getCell(2).value).toBe("32010100XXXXXXXX");
    expect(sheet?.getRow(2).getCell(3).value).toBe("32010120XXXXXXXX");
  });
});
