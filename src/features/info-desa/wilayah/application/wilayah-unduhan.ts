import ExcelJS from "exceljs";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import {
  LABEL_TINGKAT,
  tingkatWilayah,
  type WilayahDenganJumlah,
} from "@/features/info-desa/wilayah/domain/wilayah";

/**
 * Unduhan daftar wilayah administratif (XLSX & PDF).
 *
 * Isi kolomnya sama dengan tabel halaman: wilayah, kepala wilayah, NIK kepala,
 * jumlah turunan, KK, laki-laki, perempuan, dan total penduduk. Berkas dipakai
 * per tingkat penelusuran (dusun, atau RW/RT di bawah satu induk).
 */

interface WilayahUnduhanInput {
  rows: readonly WilayahDenganJumlah[];
  namaDesa: string;
  judul: string;
  indukLabel: string | null;
  /** Jumlah turunan tiap baris, sejajar dengan `rows`. */
  turunan: readonly number[];
}

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 28;
const FONT_SIZE = 7.5;
const ROW_HEIGHT = 16;
const HEADER_HEIGHT = 24;

const angka = (value: number) => new Intl.NumberFormat("id-ID").format(value);

function clean(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function sel(value: string | null | undefined): string {
  const teks = (value ?? "").trim();
  return teks === "" ? "-" : teks;
}

function labelBaris(row: Pick<WilayahDenganJumlah, "dusun" | "rw" | "rt">): string {
  return (
    [
      row.dusun ? `Dusun ${row.dusun}` : "",
      row.rw ? `RW ${row.rw}` : "",
      row.rt ? `RT ${row.rt}` : "",
    ]
      .filter(Boolean)
      .join(" · ") || "Wilayah tanpa nama"
  );
}

function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const value = clean(text);
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;

  let hasil = value;
  while (hasil.length > 1 && font.widthOfTextAtSize(`${hasil}...`, size) > maxWidth) {
    hasil = hasil.slice(0, -1);
  }
  return `${hasil}...`;
}

interface Kolom {
  label: string;
  width: number;
  value: (row: WilayahDenganJumlah, index: number) => string;
}

function kolom(turunan: readonly number[]): readonly Kolom[] {
  return [
    { label: "No", width: 26, value: (_row, index) => String(index + 1) },
    { label: "Wilayah", width: 190, value: (row) => labelBaris(row) },
    { label: "Tingkat", width: 56, value: (row) => LABEL_TINGKAT[tingkatWilayah(row)] },
    { label: "Kepala Wilayah", width: 150, value: (row) => sel(row.kepala) },
    { label: "NIK Kepala", width: 110, value: (row) => sel(row.kepalaNik) },
    { label: "Turunan", width: 52, value: (_row, index) => String(turunan[index] ?? 0) },
    { label: "KK", width: 44, value: (row) => angka(row.jumlahKk) },
    { label: "Laki-laki", width: 56, value: (row) => angka(row.lakiLaki) },
    { label: "Perempuan", width: 60, value: (row) => angka(row.perempuan) },
    { label: "Total", width: 52, value: (row) => angka(row.total) },
  ];
}

function gambarHeaderTabel(
  page: PDFPage,
  y: number,
  bold: PDFFont,
  columns: readonly Kolom[],
  totalWidth: number,
): number {
  page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width: totalWidth,
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

/** PDF lanskap: judul, keterangan cetak, lalu tabel wilayah berhalaman. */
export async function buildWilayahPdf(input: WilayahUnduhanInput): Promise<Uint8Array> {
  const columns = kolom(input.turunan);
  const totalWidth = columns.reduce((total, item) => total + item.width, 0);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  page.drawText("DATA WILAYAH ADMINISTRATIF", {
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
    input.indukLabel ? `Di bawah ${input.indukLabel}` : `Tingkat ${input.judul}`,
    `Dicetak: ${dicetak}`,
    `${input.rows.length.toLocaleString("id-ID")} baris`,
  ].join("  |  ");
  page.drawText(clean(keterangan), {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  y -= 22;

  y = gambarHeaderTabel(page, y, bold, columns, totalWidth);

  for (const [index, row] of input.rows.entries()) {
    if (y < MARGIN + ROW_HEIGHT + 18) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      y = gambarHeaderTabel(page, y, bold, columns, totalWidth);
    }

    if (index % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - 3,
        width: totalWidth,
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
    page.drawText("Belum ada wilayah pada tingkat ini.", {
      x: MARGIN,
      y: y - 2,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const halaman = pdf.getPages();
  halaman.forEach((item, index) => {
    item.drawText(`Halaman ${index + 1} dari ${halaman.length}`, {
      x: MARGIN,
      y: 16,
      size: 7,
      font,
      color: rgb(0.55, 0.55, 0.55),
    });
  });

  return pdf.save();
}

/** XLSX daftar wilayah; NIK disimpan sebagai teks agar tidak kehilangan angka nol. */
export async function buildWilayahXlsx(input: WilayahUnduhanInput): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FlexiDesa";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Wilayah Administratif", {
    views: [{ state: "frozen", ySplit: 5 }],
  });

  const headers = [
    "No",
    "Wilayah",
    "Tingkat",
    "Kepala Wilayah",
    "NIK Kepala",
    "Turunan",
    "KK",
    "Laki-laki",
    "Perempuan",
    "Total",
  ];
  sheet.columns = [
    { width: 6 },
    { width: 34 },
    { width: 10 },
    { width: 26 },
    { width: 20 },
    { width: 10 },
    { width: 8 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
  ];

  const dicetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const keterangan = [
    input.indukLabel ? `Di bawah ${input.indukLabel}` : `Tingkat ${input.judul}`,
    `Dicetak: ${dicetak}`,
    `${input.rows.length.toLocaleString("id-ID")} baris`,
  ].join("  |  ");

  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = "DATA WILAYAH ADMINISTRATIF";
  sheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1F2F52" } };
  sheet.mergeCells("A2:J2");
  sheet.getCell("A2").value = input.namaDesa;
  sheet.getCell("A2").font = { size: 10, color: { argb: "FF59637A" } };
  sheet.mergeCells("A3:J3");
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
      labelBaris(row),
      LABEL_TINGKAT[tingkatWilayah(row)],
      row.kepala,
      row.kepalaNik,
      input.turunan[index] ?? 0,
      row.jumlahKk,
      row.lakiLaki,
      row.perempuan,
      row.total,
    ]);
    data.getCell(5).numFmt = "@";
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

/** Nama berkas unduhan, mis. `wilayah-dusun.xlsx`. */
export function namaBerkasWilayah(judul: string, indukLabel: string | null, ext: string): string {
  const dasar = indukLabel ? `wilayah-${indukLabel}` : `wilayah-${judul}`;
  const slug =
    dasar
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "wilayah";
  return `${slug}.${ext}`;
}
