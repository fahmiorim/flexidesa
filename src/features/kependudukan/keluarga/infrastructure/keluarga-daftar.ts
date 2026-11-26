import ExcelJS from "exceljs";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import {
  genderLabelKk,
  sensorIdentitas,
  tanggalKk,
  type KeluargaListRow,
} from "@/features/kependudukan/keluarga/domain/keluarga";

/**
 * Daftar KK untuk cetak/unduh (paritas "Aksi Lainnya" OpenSID).
 *
 * Berbeda dari Kartu Keluarga per KK, laporan ini memuat banyak KK sekaligus:
 * nomor KK, kepala keluarga, NIK, jumlah anggota, jenis kelamin, alamat,
 * dusun/RW/RT, tanggal terdaftar, dan tanggal cetak KK.
 */

export interface KeluargaDaftarInput {
  rows: readonly KeluargaListRow[];
  namaDesa: string;
  sensor: boolean;
}

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 28;
const FONT_SIZE = 6.5;
const ROW_HEIGHT = 15;
const HEADER_HEIGHT = 24;

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

function upper(value: string | null | undefined): string {
  return sel(value).toUpperCase();
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

function nomor(value: string | null, sensor: boolean): string {
  if (!value) return "-";
  return sensor ? sensorIdentitas(value) : value;
}

interface Kolom {
  label: string;
  width: number;
  value: (row: KeluargaListRow, index: number) => string;
}

function kolom(sensor: boolean): readonly Kolom[] {
  return [
    { label: "No", width: 20, value: (_row, index) => String(index + 1) },
    { label: "Nomor KK", width: 78, value: (row) => nomor(row.number, sensor) },
    { label: "Kepala Keluarga", width: 140, value: (row) => upper(row.headName) },
    { label: "NIK", width: 78, value: (row) => nomor(row.headNationalId, sensor) },
    { label: "Jumlah Anggota", width: 38, value: (row) => String(row.memberCount) },
    {
      label: "Jenis Kelamin",
      width: 54,
      value: (row) => (row.headGender ? genderLabelKk(row.headGender) : "-"),
    },
    { label: "Alamat", width: 135, value: (row) => upper(row.address) },
    { label: "Dusun", width: 48, value: (row) => upper(row.dusun) },
    { label: "RW", width: 25, value: (row) => upper(row.rw) },
    { label: "RT", width: 25, value: (row) => upper(row.rt) },
    { label: "Tanggal Terdaftar", width: 64, value: (row) => tanggalKk(row.registeredAt) ?? "-" },
    { label: "Tanggal Cetak KK", width: 64, value: (row) => tanggalKk(row.cardPrintedAt) ?? "-" },
  ];
}

const TOTAL_WIDTH = kolom(false).reduce((total, item) => total + item.width, 0);

function gambarHeaderTabel(
  page: PDFPage,
  y: number,
  font: PDFFont,
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
    page.drawText(fit(item.label, bold, FONT_SIZE, item.width - 6), {
      x: x + 3,
      y: y + 4,
      size: FONT_SIZE,
      font: bold,
      color: rgb(1, 1, 1),
    });
    x += item.width;
  }

  return y - HEADER_HEIGHT;
}

export async function buildKeluargaDaftarPdf(input: KeluargaDaftarInput): Promise<Uint8Array> {
  const columns = kolom(input.sensor);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  page.drawText("DATA KELUARGA", {
    x: MARGIN,
    y: y - 4,
    size: 17,
    font: bold,
    color: rgb(0.08, 0.15, 0.3),
  });
  y -= 24;

  page.drawText(clean(input.namaDesa), {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: rgb(0.35, 0.4, 0.5),
  });
  y -= 16;

  const dicetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const keterangan = [
    `Dicetak: ${dicetak}`,
    `${input.rows.length.toLocaleString("id-ID")} KK`,
    input.sensor ? "NIK dan No. KK disensor" : null,
  ]
    .filter(Boolean)
    .join("  |  ");
  page.drawText(clean(keterangan), {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  y -= 22;

  y = gambarHeaderTabel(page, y, font, bold, columns);

  for (const [index, row] of input.rows.entries()) {
    if (y < MARGIN + ROW_HEIGHT + 18) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      y = gambarHeaderTabel(page, y, font, bold, columns);
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
      page.drawText(fit(item.value(row, index), font, FONT_SIZE, item.width - 6), {
        x: x + 3,
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
    page.drawText("Belum ada Kartu Keluarga yang sesuai filter.", {
      x: MARGIN,
      y: y - 2,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const halaman = pdf.getPages();
  halaman.forEach((item, index) => {
    item.drawText(`Sistem Informasi Desa  ·  Halaman ${index + 1} dari ${halaman.length}`, {
      x: MARGIN,
      y: 16,
      size: 7,
      font,
      color: rgb(0.55, 0.55, 0.55),
    });
  });

  return pdf.save();
}

/** XLSX daftar KK; semua nomor identitas disimpan sebagai teks. */
export async function buildKeluargaDaftarXlsx(input: KeluargaDaftarInput): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FlexiDesa";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Data Keluarga", {
    views: [{ state: "frozen", ySplit: 5 }],
  });

  const headers = [
    "No",
    "Nomor KK",
    "Kepala Keluarga",
    "NIK",
    "Jumlah Anggota",
    "Jenis Kelamin",
    "Alamat",
    "Dusun",
    "RW",
    "RT",
    "Tanggal Terdaftar",
    "Tanggal Cetak KK",
  ];
  sheet.columns = [
    { width: 6 },
    { width: 20 },
    { width: 28 },
    { width: 20 },
    { width: 15 },
    { width: 16 },
    { width: 32 },
    { width: 16 },
    { width: 7 },
    { width: 7 },
    { width: 18 },
    { width: 18 },
  ];

  const dicetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const keterangan = [
    `Dicetak: ${dicetak}`,
    `${input.rows.length.toLocaleString("id-ID")} KK`,
    input.sensor ? "NIK dan No. KK disensor" : null,
  ]
    .filter(Boolean)
    .join("  |  ");

  sheet.mergeCells("A1:L1");
  sheet.getCell("A1").value = "DATA KELUARGA";
  sheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1F2F52" } };
  sheet.mergeCells("A2:L2");
  sheet.getCell("A2").value = input.namaDesa;
  sheet.getCell("A2").font = { size: 10, color: { argb: "FF59637A" } };
  sheet.mergeCells("A3:L3");
  sheet.getCell("A3").value = keterangan;
  sheet.getCell("A3").font = { size: 9, color: { argb: "FF737B8C" } };
  sheet.addRow([]);

  const header = sheet.addRow(headers);
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF21457F" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  header.height = 28;

  input.rows.forEach((row, index) => {
    const data = sheet.addRow([
      index + 1,
      nomor(row.number, input.sensor),
      row.headName ?? "",
      nomor(row.headNationalId, input.sensor),
      row.memberCount,
      row.headGender ? genderLabelKk(row.headGender) : "",
      row.address ?? "",
      row.dusun ?? "",
      row.rw ?? "",
      row.rt ?? "",
      tanggalKk(row.registeredAt) ?? "",
      tanggalKk(row.cardPrintedAt) ?? "",
    ]);
    data.getCell(2).numFmt = "@";
    data.getCell(4).numFmt = "@";
  });

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle" };
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
