import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { getNamaDesaUseCase } from "@/features/info-desa/desa/application/use-cases";
import {
  getPenandatanganStatistikData,
  getStatistikKependudukanData,
  labelFilterWilayah,
  nilaiFilter,
} from "@/features/kependudukan/statistik/application/statistik-kependudukan-use-cases";
import {
  persen,
  type HasilStatistikKependudukan,
  type PejabatPenandatanganStatistik,
} from "@/features/kependudukan/statistik/domain/statistik-kependudukan";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { getCurrentUser } from "@/lib/dal";

const angka = new Intl.NumberFormat("id-ID");

async function buatPdf(
  hasil: HasilStatistikKependudukan,
  namaDesa: string,
  filter: string,
  pejabat: PejabatPenandatanganStatistik | null,
  nomor: string | null,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const pageSize: [number, number] = [595.28, 841.89];
  let page = pdfDoc.addPage(pageSize);
  const { height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  const lineHeight = 13;
  let y = height - margin;

  const pastikanHalaman = () => {
    if (y < margin + lineHeight * 2) {
      page = pdfDoc.addPage(pageSize);
      y = height - margin;
    }
  };

  page.drawText("Statistik Kependudukan", {
    x: margin,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight * 1.6;

  page.drawText(`${namaDesa} — ${hasil.kategori.label}`, {
    x: margin,
    y,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= lineHeight;

  page.drawText(`Wilayah: ${filter}`, {
    x: margin,
    y,
    size: 9,
    font,
    color: rgb(0.42, 0.42, 0.42),
  });
  y -= lineHeight;

  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  page.drawText(`Dicetak: ${today}`, {
    x: margin,
    y,
    size: 9,
    font,
    color: rgb(0.42, 0.42, 0.42),
  });
  y -= lineHeight * 2;

  const kolom = [190, 78, 70, 78, 70];
  const headers = ["Kelompok", "Jumlah", "Persen", "Laki-laki", "Perempuan"];
  const lebarTabel = kolom.reduce((total, item) => total + item, 0);
  const total = hasil.total.jumlah;

  const gambarHeader = () => {
    page.drawRectangle({
      x: margin,
      y: y - 3,
      width: lebarTabel,
      height: lineHeight + 5,
      color: rgb(0.2, 0.4, 0.7),
    });
    let x = margin;
    headers.forEach((header, index) => {
      const width = kolom[index] ?? 0;
      page.drawText(header, {
        x: x + 4,
        y: y + 1,
        size: 9,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      x += width;
    });
    y -= lineHeight + 5;
  };

  gambarHeader();

  const tulisBaris = (
    nilai: [string, string, string, string, string],
    warna: { isi: ReturnType<typeof rgb>; teks: ReturnType<typeof rgb>; tebal: boolean },
  ) => {
    pastikanHalaman();
    page.drawRectangle({
      x: margin,
      y: y - 3,
      width: lebarTabel,
      height: lineHeight + 4,
      color: warna.isi,
    });
    let x = margin;
    nilai.forEach((teks, index) => {
      page.drawText(teks, {
        x: x + 4,
        y: y,
        size: 9,
        font: warna.tebal ? fontBold : font,
        color: warna.teks,
      });
      x += kolom[index] ?? 0;
    });
    y -= lineHeight + 4;
  };

  for (const row of hasil.baris) {
    tulisBaris(
      [
        row.label,
        angka.format(row.jumlah),
        `${persen(row.jumlah, total)}%`,
        angka.format(row.lakiLaki),
        angka.format(row.perempuan),
      ],
      { isi: rgb(0.96, 0.96, 0.99), teks: rgb(0, 0, 0), tebal: false },
    );
  }

  const ringkasan: Array<[string, typeof hasil.jumlah]> = [
    ["JUMLAH", hasil.jumlah],
    ["BELUM MENGISI", hasil.belumMengisi],
    ["TOTAL", hasil.total],
  ];
  for (const [label, nilai] of ringkasan) {
    tulisBaris(
      [
        label,
        angka.format(nilai.jumlah),
        `${persen(nilai.jumlah, total)}%`,
        angka.format(nilai.lakiLaki),
        angka.format(nilai.perempuan),
      ],
      { isi: rgb(0.93, 0.91, 0.99), teks: rgb(0.15, 0.1, 0.35), tebal: true },
    );
  }

  if (pejabat || nomor) {
    if (y < margin + 140) {
      page = pdfDoc.addPage(pageSize);
      y = height - margin;
    }
    y -= lineHeight * 2.5;
    const lebarTtd = 210;
    const xTtd = page.getSize().width - margin - lebarTtd;
    page.drawText(`${namaDesa}, ${today}`, {
      x: xTtd,
      y,
      size: 9,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= lineHeight;
    if (nomor) {
      page.drawText(`Nomor: ${nomor}`, {
        x: xTtd,
        y,
        size: 9,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= lineHeight;
    }
    page.drawText(pejabat?.jabatan ?? "Pejabat Desa", {
      x: xTtd,
      y,
      size: 9,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= lineHeight * 3.6;
    page.drawText(pejabat?.nama ?? "........................", {
      x: xTtd,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;
  }

  if (y > margin) {
    page.drawText("Sistem Informasi Desa — Statistik Kependudukan", {
      x: margin,
      y,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  return pdfDoc.save();
}

export async function GET(
  request: Request,
  _context: RouteContext<"/kependudukan/statistik/ekspor/pdf">,
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sesi Anda telah berakhir.", { status: 401 });
  if (!hasPermission(user.permissions, RESOURCES.penduduk, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  const url = new URL(request.url);
  const dusun = nilaiFilter(url.searchParams.get("dusun") ?? undefined);
  const rw = nilaiFilter(url.searchParams.get("rw") ?? undefined);
  const rt = nilaiFilter(url.searchParams.get("rt") ?? undefined);
  const villageId = await resolveVillageId(user);
  const ttdAngka = Number(url.searchParams.get("ttd"));
  const ttd = Number.isSafeInteger(ttdAngka) && ttdAngka > 0 ? ttdAngka : null;
  const nomor = nilaiFilter(url.searchParams.get("nomor") ?? undefined) ?? null;
  const [namaDesa, { kategori, hasil }, pejabatRows] = await Promise.all([
    getNamaDesaUseCase(villageId),
    getStatistikKependudukanData(villageId, {
      kategoriSlug: nilaiFilter(url.searchParams.get("kategori") ?? undefined) ?? "",
      dusun,
      rw,
      rt,
    }),
    getPenandatanganStatistikData(),
  ]);
  const pejabat = ttd === null ? null : (pejabatRows.find((item) => item.id === ttd) ?? null);

  try {
    const bytes = await buatPdf(
      hasil,
      namaDesa ?? "Desa",
      labelFilterWilayah({ dusun, rw, rt }),
      pejabat,
      nomor,
    );
    return new Response(bytes.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="statistik-kependudukan-${kategori.slug}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("PDF statistik kependudukan error:", error);
    return new Response("Gagal membuat PDF.", { status: 500 });
  }
}
