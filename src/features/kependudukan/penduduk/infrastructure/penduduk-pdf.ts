import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import { calculateAge, LIFE_STATUS_LABELS } from "@/features/kependudukan/penduduk/domain/penduduk";
import type { PendudukEksporRow } from "@/features/kependudukan/penduduk/domain/penduduk-export";

/**
 * Laporan PDF data penduduk.
 *
 * PDF memakai kolom ringkas yang mudah dibaca (bukan 44 kolom ekspor mentah);
 * data lengkap tetap tersedia lewat ekspor CSV/Excel. Orientasi lanskap agar
 * kolom identitas, kependudukan, dan wilayah muat dalam satu baris.
 */

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 28;
const ROW_HEIGHT = 15;
const HEADER_HEIGHT = 24;
const FONT_SIZE = 6.5;

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

function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const value = clean(text);
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;

  let result = value;
  while (result.length > 1 && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}...`;
}

function tanggal(value: string | null): string {
  if (!value) return "-";
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return cocok ? `${cocok[3]}-${cocok[2]}-${cocok[1]}` : value;
}

function wilayah(row: PendudukEksporRow): string {
  return [
    row.dusun ? `Dusun ${row.dusun}` : null,
    row.rt ? `RT ${row.rt}` : null,
    row.rw ? `RW ${row.rw}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

interface Kolom {
  label: string;
  width: number;
  value: (row: PendudukEksporRow, index: number) => string;
}

const KOLOM: readonly Kolom[] = [
  { label: "No", width: 22, value: (_row, index) => String(index + 1) },
  { label: "NIK", width: 76, value: (row) => sel(row.nationalId) },
  { label: "Nama", width: 104, value: (row) => row.name },
  { label: "No. KK", width: 80, value: (row) => sel(row.familyNumber) },
  { label: "L/P", width: 28, value: (row) => (row.gender === "male" ? "L" : "P") },
  {
    label: "Tempat / Tgl Lahir",
    width: 92,
    value: (row) => `${sel(row.birthPlace)}, ${tanggal(row.birthDate)}`,
  },
  {
    label: "Usia",
    width: 28,
    value: (row) => {
      const usia = calculateAge(row.birthDate);
      return usia === null ? "-" : String(usia);
    },
  },
  { label: "Agama", width: 55, value: (row) => sel(row.religionName) },
  { label: "Pendidikan", width: 68, value: (row) => sel(row.educationName) },
  { label: "Pekerjaan", width: 70, value: (row) => sel(row.occupationName) },
  {
    label: "Alamat / Wilayah",
    width: 114,
    value: (row) =>
      [sel(row.address), wilayah(row)].filter((item) => item !== "-").join(" · ") || "-",
  },
  {
    label: "Status",
    width: 41,
    value: (row) => LIFE_STATUS_LABELS[row.lifeStatus],
  },
];

const TOTAL_WIDTH = KOLOM.reduce((total, kolom) => total + kolom.width, 0);

function gambarHeaderTabel(page: PDFPage, y: number, font: PDFFont, bold: PDFFont): number {
  page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width: TOTAL_WIDTH,
    height: HEADER_HEIGHT - 4,
    color: rgb(0.13, 0.27, 0.5),
  });

  let x = MARGIN;
  for (const kolom of KOLOM) {
    page.drawText(fit(kolom.label, bold, FONT_SIZE, kolom.width - 6), {
      x: x + 3,
      y: y + 4,
      size: FONT_SIZE,
      font: bold,
      color: rgb(1, 1, 1),
    });
    x += kolom.width;
  }

  return y - HEADER_HEIGHT;
}

export async function buildPendudukPdf(
  rows: readonly PendudukEksporRow[],
  villageName: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  page.drawText("DATA PENDUDUK", {
    x: MARGIN,
    y: y - 4,
    size: 17,
    font: bold,
    color: rgb(0.08, 0.15, 0.3),
  });
  y -= 24;

  page.drawText(clean(villageName), {
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
  page.drawText(clean(`Dicetak: ${dicetak}  ·  ${rows.length.toLocaleString("id-ID")} penduduk`), {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  y -= 22;

  y = gambarHeaderTabel(page, y, font, bold);

  for (const [index, row] of rows.entries()) {
    if (y < MARGIN + ROW_HEIGHT + 18) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      y = gambarHeaderTabel(page, y, font, bold);
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
    for (const kolom of KOLOM) {
      page.drawText(fit(kolom.value(row, index), font, FONT_SIZE, kolom.width - 6), {
        x: x + 3,
        y: y + 2,
        size: FONT_SIZE,
        font,
        color: rgb(0.12, 0.12, 0.12),
      });
      x += kolom.width;
    }
    y -= ROW_HEIGHT;
  }

  if (rows.length === 0) {
    page.drawText("Belum ada data penduduk yang sesuai filter.", {
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
