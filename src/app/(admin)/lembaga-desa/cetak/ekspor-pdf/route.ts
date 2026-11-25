import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { getLembagaCetakData } from "@/features/pemerintahan/application/use-cases";

function amanPdf(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .slice(0, 60);
}

export async function GET() {
  const { rows, master, ketua, desa } = await getLembagaCetakData();
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 842;
  const pageHeight = 595;
  const columns = [
    { title: "No", x: 30, width: 30 },
    { title: "Nama Lembaga", x: 65, width: 230 },
    { title: "Kode", x: 300, width: 70 },
    { title: "Kategori", x: 375, width: 140 },
    { title: "Ketua", x: 520, width: 150 },
    { title: "Masa Bakti", x: 675, width: 80 },
    { title: "Status", x: 760, width: 55 },
  ];
  const perPage = 28;
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawText("DATA LEMBAGA DESA", {
      x: 30,
      y: 555,
      size: 16,
      font: bold,
      color: rgb(0.22, 0.12, 0.48),
    });
    page.drawText(amanPdf(desa?.namaDesa ?? "Pemerintah Desa"), {
      x: 30,
      y: 533,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    const headerY = 505;
    for (const col of columns) {
      page.drawText(amanPdf(col.title), {
        x: col.x,
        y: headerY,
        size: 9,
        font: bold,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    page.drawRectangle({
      x: 28,
      y: headerY - 6,
      width: pageWidth - 56,
      height: 1,
      color: rgb(0.22, 0.12, 0.48),
    });
    const halaman = rows.slice(pageIndex * perPage, (pageIndex + 1) * perPage);
    halaman.forEach((row, index) => {
      const y = headerY - 24 - index * 16;
      const nilai = [
        String(pageIndex * perPage + index + 1),
        row.nama,
        row.kode ?? "—",
        master.find((item) => item.id === row.masterId)?.nama ?? "—",
        ketua.find((item) => item.lembagaId === row.id)?.nama ?? "—",
        `${row.masaBaktiMulai ?? "—"} – ${row.masaBaktiSelesai ?? "—"}`,
        row.status,
      ];
      columns.forEach((col, colIndex) => {
        page.drawText(amanPdf(nilai[colIndex]), {
          x: col.x,
          y,
          size: 9,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
      });
    });
    page.drawText(`Halaman ${pageIndex + 1} dari ${totalPages}`, {
      x: 30,
      y: 24,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }
  const bytes = await pdf.save();
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="data-lembaga-desa.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
