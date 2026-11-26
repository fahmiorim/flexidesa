import ExcelJS from "exceljs";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import type { DptRow } from "@/features/kependudukan/penduduk/domain/dpt";

/**
 * Laporan daftar calon pemilih, mengikuti kolom cetak OpenSID.
 * NIK dan nomor KK dapat disensor untuk kebutuhan tampilan publik.
 */

export interface DptExportInput {
  rows: readonly DptRow[];
  namaDesa: string;
  judulPemilihan: string;
  tanggalPemilihan: string;
  sensor: boolean;
}

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 24;
const FONT_SIZE = 5.8;
const ROW_HEIGHT = 14;
const HEADER_HEIGHT = 22;

function clean(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function sel(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text === "" ? "-" : text;
}

function sensorNomor(value: string | null, sensor: boolean): string {
  if (!value) return "-";
  return sensor ? `${value.slice(0, 8)}${"X".repeat(Math.max(0, value.length - 8))}` : value;
}

function tanggal(value: string | null): string {
  if (!value) return "-";
  const [tahun, bulan, hari] = value.slice(0, 10).split("-");
  return tahun && bulan && hari ? `${hari}-${bulan}-${tahun}` : value;
}

function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const value = clean(text);
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;

  let result = value;
  while (result.length > 1 && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}...`;
}

interface Kolom {
  label: string;
  width: number;
  value: (row: DptRow, index: number) => string;
}

function kolom(sensor: boolean): readonly Kolom[] {
  return [
    { label: "No", width: 16, value: (_row, index) => String(index + 1) },
    { label: "No. KK", width: 56, value: (row) => sensorNomor(row.familyNumber, sensor) },
    { label: "NIK", width: 56, value: (row) => sensorNomor(row.nationalId, sensor) },
    { label: "Tag ID", width: 34, value: (row) => sel(row.idCardTag) },
    { label: "Nama", width: 72, value: (row) => sel(row.name).toUpperCase() },
    { label: "L/P", width: 20, value: (row) => (row.gender === "male" ? "L" : "P") },
    { label: "Alamat", width: 70, value: (row) => sel(row.address).toUpperCase() },
    { label: "Dusun", width: 38, value: (row) => sel(row.dusun).toUpperCase() },
    { label: "RW", width: 20, value: (row) => sel(row.rw) },
    { label: "RT", width: 20, value: (row) => sel(row.rt) },
    { label: "Tempat Lahir", width: 42, value: (row) => sel(row.birthPlace) },
    { label: "Tgl Lahir", width: 44, value: (row) => tanggal(row.birthDate) },
    { label: "Umur", width: 24, value: (row) => row.umurPemilihan?.toString() ?? "-" },
    { label: "Agama", width: 32, value: (row) => sel(row.agama) },
    { label: "Pendidikan KK", width: 42, value: (row) => sel(row.pendidikan) },
    { label: "Pekerjaan", width: 42, value: (row) => sel(row.pekerjaan) },
    { label: "Kawin", width: 32, value: (row) => sel(row.statusKawin) },
    { label: "Hub. Keluarga", width: 42, value: (row) => sel(row.familyRelation) },
    { label: "Nama Ayah", width: 40, value: (row) => sel(row.fatherName) },
    { label: "Nama Ibu", width: 40, value: (row) => sel(row.motherName) },
  ];
}

const TOTAL_WIDTH = kolom(false).reduce((total, item) => total + item.width, 0);

function gambarHeaderTabel(
  page: PDFPage,
  y: number,
  bold: PDFFont,
  columns: readonly Kolom[],
): number {
  page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width: TOTAL_WIDTH,
    height: HEADER_HEIGHT - 4,
    color: rgb(0.13, 0.27, 0.5),
  });

  let x = MARGIN;
  for (const item of columns) {
    page.drawText(fit(item.label, bold, FONT_SIZE, item.width - 4), {
      x: x + 2,
      y: y + 3,
      size: FONT_SIZE,
      font: bold,
      color: rgb(1, 1, 1),
    });
    x += item.width;
  }

  return y - HEADER_HEIGHT;
}

export async function buildDptPdf(input: DptExportInput): Promise<Uint8Array> {
  const columns = kolom(input.sensor);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  page.drawText("DAFTAR CALON PEMILIH", {
    x: MARGIN,
    y: y - 4,
    size: 16,
    font: bold,
    color: rgb(0.08, 0.15, 0.3),
  });
  y -= 22;
  page.drawText(clean(`${input.namaDesa}  |  ${input.judulPemilihan}`), {
    x: MARGIN,
    y,
    size: 9.5,
    font,
    color: rgb(0.35, 0.4, 0.5),
  });
  y -= 14;
  page.drawText(
    clean(
      `Tanggal pemilihan: ${tanggal(input.tanggalPemilihan)}  |  ${
        input.rows.length
      } pemilih${input.sensor ? "  |  NIK/No. KK disensor" : ""}`,
    ),
    { x: MARGIN, y, size: 7.5, font, color: rgb(0.45, 0.45, 0.45) },
  );
  y -= 20;

  y = gambarHeaderTabel(page, y, bold, columns);

  for (const [index, row] of input.rows.entries()) {
    if (y < MARGIN + ROW_HEIGHT + 18) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      y = gambarHeaderTabel(page, y, bold, columns);
    }

    if (index % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - 3,
        width: TOTAL_WIDTH,
        height: ROW_HEIGHT,
        color: rgb(0.96, 0.97, 0.99),
      });
    }

    let x = MARGIN;
    for (const item of columns) {
      page.drawText(fit(item.value(row, index), font, FONT_SIZE, item.width - 4), {
        x: x + 2,
        y: y + 2,
        size: FONT_SIZE,
        font,
        color: rgb(0.12, 0.12, 0.12),
      });
      x += item.width;
    }
    y -= ROW_HEIGHT;
  }

  if (input.rows.length === 0) {
    page.drawText("Belum ada calon pemilih yang sesuai filter.", {
      x: MARGIN,
      y: y - 2,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const halaman = pdf.getPages();
  halaman.forEach((item, index) => {
    item.drawText(`Sistem Informasi Desa  |  Halaman ${index + 1} dari ${halaman.length}`, {
      x: MARGIN,
      y: 14,
      size: 6.5,
      font,
      color: rgb(0.55, 0.55, 0.55),
    });
  });

  return pdf.save();
}

export async function buildDptXlsx(input: DptExportInput): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FlexiDesa";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Calon Pemilih", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { width: 6 },
    { width: 20 },
    { width: 20 },
    { width: 13 },
    { width: 28 },
    { width: 7 },
    { width: 34 },
    { width: 16 },
    { width: 7 },
    { width: 7 },
    { width: 20 },
    { width: 14 },
    { width: 8 },
    { width: 15 },
    { width: 18 },
    { width: 20 },
    { width: 16 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];

  const header = sheet.addRow([
    "No",
    "No. KK",
    "NIK",
    "Tag ID Card",
    "Nama",
    "L/P",
    "Alamat",
    "Dusun",
    "RW",
    "RT",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Umur",
    "Agama",
    "Pendidikan dalam KK",
    "Pekerjaan",
    "Kawin",
    "Hub. Keluarga",
    "Nama Ayah",
    "Nama Ibu",
  ]);
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF21457F" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  header.height = 30;

  input.rows.forEach((row, index) => {
    const data = sheet.addRow([
      index + 1,
      sensorNomor(row.familyNumber, input.sensor),
      sensorNomor(row.nationalId, input.sensor),
      row.idCardTag ?? "",
      row.name,
      row.gender === "male" ? "L" : "P",
      row.address ?? "",
      row.dusun ?? "",
      row.rw ?? "",
      row.rt ?? "",
      row.birthPlace ?? "",
      tanggal(row.birthDate),
      row.umurPemilihan,
      row.agama ?? "",
      row.pendidikan ?? "",
      row.pekerjaan ?? "",
      row.statusKawin ?? "",
      row.familyRelation ?? "",
      row.fatherName ?? "",
      row.motherName ?? "",
    ]);
    data.getCell(2).numFmt = "@";
    data.getCell(3).numFmt = "@";
    data.getCell(4).numFmt = "@";
  });

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle" };
      cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
    });
  });

  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
