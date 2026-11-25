import ExcelJS from "exceljs";

import {
  JUDUL_EKSPOR_REKAPITULASI,
  tanggalIndonesia,
  type BarisRekapitulasi,
} from "@/features/kehadiran/domain/rekapitulasi";

/**
 * Berkas Excel Rekapitulasi Kehadiran.
 *
 * Kolom mengikuti `ekspor()` OpenSID: Nama, Jabatan, Tanggal, Jam Masuk,
 * Jam Keluar, Total Waktu, Status Kehadiran.
 */
export async function buildRekapitulasiKehadiranXlsx(
  rows: readonly BarisRekapitulasi[],
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Rekapitulasi Kehadiran", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { width: 28 },
    { width: 26 },
    { width: 20 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 20 },
  ];

  const kepala = sheet.addRow([...JUDUL_EKSPOR_REKAPITULASI]);
  kepala.font = { bold: true };
  kepala.alignment = { vertical: "middle", horizontal: "center" };
  kepala.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE9FE" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FF9AA5B8" } } };
  });

  for (const row of rows) {
    const baris = sheet.addRow([
      row.nama,
      row.jabatan,
      tanggalIndonesia(row.tanggal),
      row.jamMasuk ?? "-",
      row.jamKeluar ?? "-",
      row.totalWaktu,
      row.status,
    ]);
    baris.alignment = { vertical: "middle" };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
