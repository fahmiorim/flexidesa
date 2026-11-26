import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { getKopCetakData } from "@/features/info-desa/pemerintahan/application/lembaga";
import { getPerangkatDesaData } from "@/features/info-desa/pemerintahan/application/perangkat";

function amanPdf(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .slice(0, 55);
}

export async function GET() {
  const [{ rows }, { desa }] = await Promise.all([getPerangkatDesaData(), getKopCetakData()]);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 842;
  const pageHeight = 595;
  const columns = [
    { title: "No", x: 30, width: 30 },
    { title: "Nama", x: 65, width: 180 },
    { title: "Jabatan", x: 250, width: 150 },
    { title: "JK", x: 405, width: 70 },
    { title: "Tempat & Tanggal Lahir", x: 480, width: 150 },
    { title: "Pendidikan", x: 635, width: 80 },
    { title: "Status", x: 720, width: 60 },
  ];
  const perPage = 28;
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawText("DAFTAR APARAT PEMERINTAH DESA", {
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
      const nama = [row.gelarDepan, row.nama, row.gelarBelakang].filter(Boolean).join(" ");
      const nilai = [
        String(pageIndex * perPage + index + 1),
        nama,
        row.jabatan ?? "—",
        row.jenisKelamin === "male"
          ? "Laki-laki"
          : row.jenisKelamin === "female"
            ? "Perempuan"
            : "—",
        [row.tempatLahir, row.tanggalLahir].filter(Boolean).join(", ") || "—",
        row.pendidikan ?? "—",
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
      "Content-Disposition": 'attachment; filename="buku-pemerintah-desa.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
