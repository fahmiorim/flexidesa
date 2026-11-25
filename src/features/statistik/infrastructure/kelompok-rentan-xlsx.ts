import ExcelJS from "exceljs";

import {
  DISABILITAS_RENTAN,
  DISABILITAS_RENTAN_LABELS,
  KELOMPOK_UMUR_RENTAN,
  type BarisKelompokRentan,
} from "@/features/statistik/domain/kelompok-rentan";

/**
 * Unduhan laporan kelompok rentan dalam bentuk Excel.
 *
 * Isi mengikuti hasil cetak OpenSID (kop, judul Lampiran A-9, header dua baris,
 * baris wilayah, dan total), bukan CSV, sehingga berkas Excel yang diunduh
 * memuat tabel yang sama dengan yang tercetak.
 */

export interface KelompokRentanXlsxInput {
  rows: readonly BarisKelompokRentan[];
  total: BarisKelompokRentan;
  kabupaten: string | null;
  desa: string | null;
  kecamatan: string | null;
  bulan: string;
  dusun: string | null;
}

/** Kolom A–U: wilayah, KK, umur, cacat, sakit menahun, hamil. */
const JUMLAH_KOLOM = 21;
const KOLOM_TERAKHIR = "U";
const BARIS_HEADER_1 = 7;

const BORDER_TIPIS: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF9AA5B8" } },
  left: { style: "thin", color: { argb: "FF9AA5B8" } },
  bottom: { style: "thin", color: { argb: "FF9AA5B8" } },
  right: { style: "thin", color: { argb: "FF9AA5B8" } },
};

function angkaBaris(baris: BarisKelompokRentan): number[] {
  return [
    baris.lakiLaki,
    baris.perempuan,
    ...KELOMPOK_UMUR_RENTAN.map((umur) => baris[umur.key]),
    ...DISABILITAS_RENTAN.map((value) => baris.disabilitas[value]),
    baris.tidakCacat,
    baris.sakitLakiLaki,
    baris.sakitPerempuan,
    baris.hamil,
  ];
}

function beriBingkai(row: ExcelJS.Row) {
  for (let kolom = 1; kolom <= JUMLAH_KOLOM; kolom += 1) {
    row.getCell(kolom).border = BORDER_TIPIS;
  }
}

export async function buildKelompokRentanXlsx(input: KelompokRentanXlsxInput): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = input.desa ?? "Pemerintah Desa";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Kelompok Rentan", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = [
    { width: 20 },
    { width: 6 },
    { width: 6 },
    ...Array.from({ length: 18 }, () => ({ width: 9 })),
  ];

  // Kop laporan, sama dengan halaman cetak OpenSID.
  sheet.mergeCells(`A1:${KOLOM_TERAKHIR}1`);
  const kop = sheet.getCell("A1");
  kop.value = `PEMERINTAH KABUPATEN/KOTA ${input.kabupaten?.toUpperCase() ?? "—"}`;
  kop.font = { bold: true, size: 12 };
  kop.alignment = { horizontal: "center" };

  sheet.mergeCells(`A2:${KOLOM_TERAKHIR}2`);
  const judul = sheet.getCell("A2");
  judul.value = "DATA PILAH KEPENDUDUKAN MENURUT UMUR DAN FAKTOR KERENTANAN (LAMPIRAN A - 9)";
  judul.font = { bold: true, size: 11 };
  judul.alignment = { horizontal: "center", wrapText: true };

  const informasi: [string, string][] = [
    ["Desa/Kelurahan", input.desa ?? "—"],
    ["Kecamatan", input.kecamatan ?? "—"],
    ["Laporan Bulan", input.bulan],
    ...(input.dusun ? [["Dusun", input.dusun] as [string, string]] : []),
  ];
  informasi.forEach(([label, nilai], index) => {
    const row = 3 + index;
    sheet.getCell(row, 1).value = label;
    sheet.getCell(row, 2).value = ":";
    sheet.getCell(row, 3).value = nilai;
  });

  if (input.dusun) {
    sheet.mergeCells(`A6:${KOLOM_TERAKHIR}6`);
    const subjudul = sheet.getCell("A6");
    subjudul.value = `DATA PILAH DUSUN ${input.dusun.toUpperCase()}`;
    subjudul.font = { bold: true };
  }

  // Header dua baris dengan penggabungan sel seperti tabel cetak.
  const header1 = sheet.getRow(BARIS_HEADER_1);
  const header2 = sheet.getRow(BARIS_HEADER_1 + 1);
  const gabungVertikal = (kolom: number) => {
    sheet.mergeCells(BARIS_HEADER_1, kolom, BARIS_HEADER_1 + 1, kolom);
  };

  header1.getCell(1).value = "Dusun";
  header1.getCell(2).value = "RW";
  header1.getCell(3).value = "RT";
  [1, 2, 3, JUMLAH_KOLOM].forEach(gabungVertikal);

  sheet.mergeCells(BARIS_HEADER_1, 4, BARIS_HEADER_1, 5);
  header1.getCell(4).value = "KK";

  const umurMulai = 6;
  sheet.mergeCells(
    BARIS_HEADER_1,
    umurMulai,
    BARIS_HEADER_1,
    umurMulai + KELOMPOK_UMUR_RENTAN.length - 1,
  );
  header1.getCell(umurMulai).value = "Kondisi dan Kelompok Umur";

  const cacatMulai = umurMulai + KELOMPOK_UMUR_RENTAN.length;
  sheet.mergeCells(
    BARIS_HEADER_1,
    cacatMulai,
    BARIS_HEADER_1,
    cacatMulai + DISABILITAS_RENTAN.length,
  );
  header1.getCell(cacatMulai).value = "Cacat";

  const sakitMulai = cacatMulai + DISABILITAS_RENTAN.length + 1;
  sheet.mergeCells(BARIS_HEADER_1, sakitMulai, BARIS_HEADER_1, sakitMulai + 1);
  header1.getCell(sakitMulai).value = "Sakit Menahun";

  header2.getCell(4).value = "L";
  header2.getCell(5).value = "P";
  KELOMPOK_UMUR_RENTAN.forEach((umur, index) => {
    header2.getCell(umurMulai + index).value = umur.label;
  });
  DISABILITAS_RENTAN.forEach((value, index) => {
    header2.getCell(cacatMulai + index).value = DISABILITAS_RENTAN_LABELS[value];
  });
  header2.getCell(cacatMulai + DISABILITAS_RENTAN.length).value = "Tidak Cacat";
  header2.getCell(sakitMulai).value = "L";
  header2.getCell(sakitMulai + 1).value = "P";
  header2.getCell(JUMLAH_KOLOM).value = "Hamil";

  for (const row of [header1, header2]) {
    row.height = 30;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7EAF3" } };
    });
    beriBingkai(row);
  }

  for (const baris of input.rows) {
    const row = sheet.addRow([baris.dusun, baris.rw, baris.rt, ...angkaBaris(baris)]);
    row.eachCell({ includeEmpty: true }, (cell, kolom) => {
      if (kolom >= 4) {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0";
      }
    });
    beriBingkai(row);
  }

  // Total mengikuti tfoot OpenSID: label melebar sampai kolom RT, lalu angka
  // dimulai dari kolom umur (kolom KK dan sebelumnya kosong).
  const totalRow = sheet.addRow(["Total", "", "", ...new Array(18).fill(null)]);
  sheet.mergeCells(totalRow.number, 1, totalRow.number, 5);
  angkaBaris(input.total).forEach((nilai, index) => {
    const cell = totalRow.getCell(6 + index);
    cell.value = nilai;
    cell.numFmt = "#,##0";
    cell.alignment = { horizontal: "right" };
  });
  totalRow.font = { bold: true };
  totalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F5FB" } };
  });
  beriBingkai(totalRow);

  const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date());
  const catatan = sheet.addRow([]);
  sheet.mergeCells(catatan.number, 1, catatan.number, 6);
  catatan.getCell(1).value = `Tanggal cetak : ${tanggal}`;

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
