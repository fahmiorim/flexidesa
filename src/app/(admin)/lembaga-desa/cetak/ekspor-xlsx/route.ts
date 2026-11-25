import ExcelJS from "exceljs";

import { getLembagaCetakData } from "@/features/pemerintahan/application/use-cases";

export async function GET() {
  const { rows, master, ketua, desa } = await getLembagaCetakData();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = desa?.namaDesa ?? "Pemerintah Desa";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Data Lembaga", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Lembaga", key: "nama", width: 40 },
    { header: "Kode Lembaga", key: "kode", width: 16 },
    { header: "Kategori", key: "kategori", width: 24 },
    { header: "Ketua", key: "ketua", width: 28 },
    { header: "Masa Bakti Mulai", key: "mulai", width: 16 },
    { header: "Masa Bakti Selesai", key: "selesai", width: 16 },
    { header: "Status", key: "status", width: 12 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5122C8" } };
  header.alignment = { vertical: "middle", horizontal: "center" };
  rows.forEach((row, index) => {
    sheet.addRow({
      no: index + 1,
      nama: row.nama,
      kode: row.kode ?? "",
      kategori: master.find((item) => item.id === row.masterId)?.nama ?? "",
      ketua: ketua.find((item) => item.lembagaId === row.id)?.nama ?? "",
      mulai: row.masaBaktiMulai ?? "",
      selesai: row.masaBaktiSelesai ?? "",
      status: row.status,
    });
  });
  sheet.autoFilter = { from: "A1", to: "H1" };
  sheet.eachRow((row, index) => {
    if (index > 1) row.alignment = { vertical: "middle" };
  });
  const bytes = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="data-lembaga-desa.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
}
