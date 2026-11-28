import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import type { IdentitasDesa } from "@/features/info-desa/desa/infrastructure/desa-repository";
import {
  genderLabelKk,
  isTemporaryFamilyNumber,
  kepalaKeluarga,
  tanggalKk,
  type KeluargaMemberDetail,
} from "@/features/kependudukan/keluarga/domain/keluarga";

/**
 * Penyusun PDF Kartu Keluarga.
 *
 * Tata letak: judul "KARTU KELUARGA" + "SALINAN" +
 * nomor KK, blok info wilayah, lalu **dua tabel** (kolom 1: identitas dasar;
 * kolom 2: status kawin, hubungan keluarga, kewarganegaraan, nama ayah/ibu) dan
 * blok tanda tangan kepala keluarga serta kepala desa.
 *
 * Orientasi **lanskap** karena KK memuat belasan kolom; A4 potrait akan membuat
 * teks terpotong. Font standar pdf-lib hanya mendukung WinAnsi, jadi seluruh
 * teks dinormalkan lebih dulu lewat `clean`.
 */

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

interface KeluargaPdfInput {
  desa: IdentitasDesa | null;
  nomorKk: string;
  alamat: string | null;
  wilayah: { dusun: string | null; rw: string | null; rt: string | null };
  anggota: readonly KeluargaMemberDetail[];
}

/** Normalkan karakter agar aman dengan font WinAnsi. */
function clean(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

/** Teks sel: nilai atau tanda hubung bila kosong. */
function sel(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text === "" ? "-" : text;
}

/** Motong teks bila melebihi lebar kolom (tanpa ellipsis berlebih). */
function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const value = clean(text);
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;

  let result = value;
  while (result.length > 1 && font.widthOfTextAtSize(`${result}…`, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

interface Column {
  label: string;
  width: number;
  value: (row: KeluargaMemberDetail, index: number) => string;
}

/** Tabel pertama: identitas dasar anggota. */
const KOLOM_SATU: readonly Column[] = [
  { label: "No", width: 18, value: (_row, index) => String(index + 1) },
  { label: "Nama", width: 120, value: (row) => row.name.toUpperCase() },
  { label: "NIK", width: 88, value: (row) => sel(row.nationalId) },
  { label: "Jenis Kelamin", width: 52, value: (row) => genderLabelKk(row.gender) },
  { label: "Tempat Lahir", width: 78, value: (row) => sel(row.birthPlace) },
  { label: "Tanggal Lahir", width: 62, value: (row) => sel(tanggalKk(row.birthDate)) },
  { label: "Agama", width: 64, value: (row) => sel(row.religionName) },
  { label: "Pendidikan", width: 88, value: (row) => sel(row.educationName) },
  { label: "Pekerjaan", width: 155, value: (row) => sel(row.occupationName) },
  { label: "Gol. Darah", width: 60, value: (row) => sel(row.bloodTypeName) },
];

/** Tabel kedua: status, hubungan, dokumen, dan orang tua. */
const KOLOM_DUA: readonly Column[] = [
  { label: "No", width: 18, value: (_row, index) => String(index + 1) },
  { label: "Status Perkawinan", width: 82, value: (row) => sel(row.maritalStatusName) },
  {
    label: "Tgl. Kawin/Cerai",
    width: 68,
    value: (row) =>
      sel(
        tanggalKk(
          (row.maritalStatusName ?? "").toUpperCase().includes("KAWIN")
            ? row.marriageDate
            : row.divorceDate,
        ),
      ),
  },
  { label: "Hubungan Keluarga", width: 120, value: (row) => sel(row.relationName) },
  { label: "Kewarganegaraan", width: 72, value: (row) => sel(row.citizenshipName) },
  { label: "No. Paspor", width: 78, value: (row) => sel(row.passportNumber) },
  { label: "No. KITAS/KITAP", width: 78, value: (row) => sel(row.kitasNumber) },
  { label: "Nama Ayah", width: 134, value: (row) => sel(row.fatherName).toUpperCase() },
  { label: "Nama Ibu", width: 135, value: (row) => sel(row.motherName).toUpperCase() },
];

const CELL_SIZE = 6.5;
const LABEL_SIZE = 6.5;
const ROW_HEIGHT = 16;
const HEADER_HEIGHT = 21;

/** Gambar satu tabel; mengembalikan `y` setelah tabel selesai. */
function gambarTabel(
  page: PDFPage,
  y: number,
  font: PDFFont,
  bold: PDFFont,
  judul: string,
  kolom: readonly Column[],
  anggota: readonly KeluargaMemberDetail[],
): number {
  page.drawText(clean(judul), { x: MARGIN, y, size: 9, font: bold });
  page.drawRectangle({
    x: MARGIN,
    y: y - 3,
    width: CONTENT_WIDTH,
    height: 1.5,
    color: rgb(0.12, 0.3, 0.55),
  });
  y -= 16;

  // Simpan posisi awal kolom agar garis vertikal dapat digambar konsisten.
  const batasX: number[] = [];
  let x = MARGIN;
  for (const kolomItem of kolom) {
    batasX.push(x);
    x += kolomItem.width;
  }
  const tableRight = x;
  const tableTop = y;
  const headBottom = tableTop - HEADER_HEIGHT;

  // Kepala tabel dengan latar lembut agar terbaca tanpa garis tebal.
  page.drawRectangle({
    x: MARGIN,
    y: headBottom,
    width: tableRight - MARGIN,
    height: HEADER_HEIGHT,
    color: rgb(0.93, 0.96, 0.99),
  });
  for (const [index, kolomItem] of kolom.entries()) {
    page.drawText(fit(kolomItem.label, bold, LABEL_SIZE, kolomItem.width - 5), {
      x: batasX[index]! + 4,
      y: headBottom + 7,
      size: LABEL_SIZE,
      font: bold,
    });
  }

  let rowTop = headBottom;
  for (const [index, row] of anggota.entries()) {
    if (index % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: rowTop - ROW_HEIGHT,
        width: tableRight - MARGIN,
        height: ROW_HEIGHT,
        color: rgb(0.98, 0.985, 0.995),
      });
    }
    for (const [kolomIndex, kolomItem] of kolom.entries()) {
      page.drawText(fit(kolomItem.value(row, index), font, CELL_SIZE, kolomItem.width - 5), {
        x: batasX[kolomIndex]! + 4,
        y: rowTop - 11,
        size: CELL_SIZE,
        font,
      });
    }
    rowTop -= ROW_HEIGHT;
  }

  // Garis: tepi atas, bawah kepala, dan bawah tabel, plus pemisah vertikal.
  for (const lineY of [tableTop, headBottom, rowTop]) {
    page.drawLine({
      start: { x: MARGIN, y: lineY },
      end: { x: tableRight, y: lineY },
      thickness: lineY === rowTop || lineY === tableTop ? 0.8 : 0.4,
      color: rgb(0.45, 0.5, 0.58),
    });
  }
  for (const posX of [...batasX, tableRight]) {
    page.drawLine({
      start: { x: posX, y: tableTop },
      end: { x: posX, y: rowTop },
      thickness: 0.4,
      color: rgb(0.55, 0.59, 0.66),
    });
  }

  return rowTop - 24;
}

export async function buildKeluargaPdf(input: KeluargaPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const desa = input.desa;
  const tinggiTabel = (jumlah: number) => 16 + HEADER_HEIGHT + jumlah * ROW_HEIGHT + 24;
  const halamanBaru = (lanjutan: boolean) => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    if (lanjutan) {
      const label = "KARTU KELUARGA - LANJUTAN";
      page.drawText(label, {
        x: (PAGE_WIDTH - bold.widthOfTextAtSize(label, 9)) / 2,
        y: PAGE_HEIGHT - MARGIN - 6,
        size: 9,
        font: bold,
      });
    }
    return PAGE_HEIGHT - MARGIN - (lanjutan ? 34 : 0);
  };

  // --- Judul ---
  let y = PAGE_HEIGHT - MARGIN;
  const title = "KARTU KELUARGA";
  page.drawText(title, {
    x: (PAGE_WIDTH - bold.widthOfTextAtSize(title, 16)) / 2,
    y: y - 16,
    size: 16,
    font: bold,
  });
  y -= 34;

  const salinan = "SALINAN";
  page.drawText(salinan, {
    x: (PAGE_WIDTH - font.widthOfTextAtSize(salinan, 9)) / 2,
    y,
    size: 9,
    font,
  });
  y -= 14;

  const nomor = `No. ${isTemporaryFamilyNumber(input.nomorKk) ? "0" : input.nomorKk}`;
  page.drawText(nomor, {
    x: (PAGE_WIDTH - bold.widthOfTextAtSize(nomor, 11)) / 2,
    y,
    size: 11,
    font: bold,
  });
  y -= 14;
  if (isTemporaryFamilyNumber(input.nomorKk)) {
    const label = "NOMOR SEMENTARA";
    page.drawText(label, {
      x: (PAGE_WIDTH - font.widthOfTextAtSize(label, 7)) / 2,
      y,
      size: 7,
      font,
      color: rgb(0.7, 0.35, 0.05),
    });
  }
  y -= 14;

  // --- Blok info (dua kolom berpasangan) ---
  const alamat = [input.alamat, input.wilayah.dusun ? `Dusun ${input.wilayah.dusun}` : null]
    .filter(Boolean)
    .join(", ");

  const infoKiri: [string, string][] = [
    ["Nama KK", clean(sel(kepalaKeluarga(input.anggota)?.name)).toUpperCase()],
    ["Alamat", clean(sel(alamat)).toUpperCase()],
    ["RT / RW", clean(sel([input.wilayah.rt, input.wilayah.rw].filter(Boolean).join(" / ")))],
    ["Kelurahan/Desa", clean(sel(desa?.namaDesa)).toUpperCase()],
  ];
  const infoKanan: [string, string][] = [
    ["Kecamatan", clean(sel(desa?.namaKecamatan)).toUpperCase()],
    ["Kabupaten/Kota", clean(sel(desa?.namaKabupaten)).toUpperCase()],
    ["Kode Pos", clean(sel(desa?.kodePos))],
    ["Provinsi", clean(sel(desa?.namaPropinsi)).toUpperCase()],
  ];

  const labelWidth = 82;
  const colWidth = CONTENT_WIDTH / 2;
  const infoTop = y;

  infoKiri.forEach(([label, value], index) => {
    const rowY = infoTop - index * 13;
    page.drawText(clean(label), { x: MARGIN, y: rowY, size: 8, font });
    page.drawText(":", { x: MARGIN + labelWidth, y: rowY, size: 8, font });
    page.drawText(fit(value, font, 8, colWidth - labelWidth - 8), {
      x: MARGIN + labelWidth + 6,
      y: rowY,
      size: 8,
      font: bold,
    });
  });

  infoKanan.forEach(([label, value], index) => {
    const rowY = infoTop - index * 13;
    const baseX = MARGIN + colWidth;
    page.drawText(clean(label), { x: baseX, y: rowY, size: 8, font });
    page.drawText(":", { x: baseX + labelWidth, y: rowY, size: 8, font });
    page.drawText(fit(value, font, 8, colWidth - labelWidth - 8), {
      x: baseX + labelWidth + 6,
      y: rowY,
      size: 8,
      font: bold,
    });
  });

  y = infoTop - Math.max(infoKiri.length, infoKanan.length) * 13 - 12;

  // --- Tabel ---
  if (y - tinggiTabel(input.anggota.length) < MARGIN) {
    y = halamanBaru(true);
  }
  y = gambarTabel(page, y, font, bold, "I. IDENTITAS ANGGOTA KELUARGA", KOLOM_SATU, input.anggota);

  if (y - tinggiTabel(input.anggota.length) < MARGIN) {
    y = halamanBaru(true);
  }
  y = gambarTabel(
    page,
    y,
    font,
    bold,
    "II. STATUS, HUBUNGAN, DAN ORANG TUA",
    KOLOM_DUA,
    input.anggota,
  );

  if (input.anggota.length === 0) {
    page.drawText("Belum ada anggota keluarga yang tercatat.", {
      x: MARGIN,
      y: y + 20,
      size: 9,
      font,
    });
  }

  // --- Tanda tangan ---
  if (y < MARGIN + 110) {
    y = halamanBaru(true);
  }
  const kepala = kepalaKeluarga(input.anggota);
  const ttdY = Math.min(y - 18, MARGIN + 96);
  const leftX = MARGIN + 40;
  const rightX = PAGE_WIDTH - MARGIN - 220;
  const tanggalCetak = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  page.drawText(clean(`${desa?.namaDesa ?? ""}, ${tanggalCetak}`), {
    x: rightX,
    y: ttdY + 14,
    size: 8,
    font,
  });

  page.drawText(clean("KEPALA KELUARGA"), { x: leftX, y: ttdY, size: 9, font: bold });
  page.drawText(clean(kepala?.name ?? "-"), { x: leftX, y: ttdY - 46, size: 9, font: bold });
  page.drawLine({
    start: { x: leftX, y: ttdY - 49 },
    end: {
      x: leftX + Math.max(140, font.widthOfTextAtSize(clean(kepala?.name ?? "-"), 9)),
      y: ttdY - 49,
    },
    thickness: 0.5,
  });

  const jabatan = desa?.namaDesa ? `KEPALA DESA ${desa.namaDesa.toUpperCase()}` : "KEPALA DESA";
  page.drawText(clean(jabatan), { x: rightX, y: ttdY, size: 9, font: bold });
  const namaKades = clean(desa?.namaKepalaDesa ?? "-");
  page.drawText(namaKades, { x: rightX, y: ttdY - 46, size: 9, font: bold });
  page.drawLine({
    start: { x: rightX, y: ttdY - 49 },
    end: {
      x: rightX + Math.max(140, font.widthOfTextAtSize(namaKades, 9)),
      y: ttdY - 49,
    },
    thickness: 0.5,
  });

  return pdf.save();
}

/** Gabungkan beberapa PDF KK menjadi satu dokumen untuk cetak/unduh massal. */
export async function gabungKeluargaPdf(dokumen: readonly Uint8Array[]): Promise<Uint8Array> {
  if (dokumen.length === 0) throw new Error("Tidak ada Kartu Keluarga untuk digabungkan.");
  if (dokumen.length === 1) return dokumen[0]!;

  const hasil = await PDFDocument.create();
  for (const bytes of dokumen) {
    const sumber = await PDFDocument.load(bytes);
    const halaman = await hasil.copyPages(sumber, sumber.getPageIndices());
    for (const page of halaman) hasil.addPage(page);
  }
  return hasil.save();
}
