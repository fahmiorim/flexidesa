import ExcelJS from "exceljs";

import { getPerangkatDesaData } from "@/features/pemerintahan/application/use-cases";
import { isJenisJabatan, LABEL_JENIS_JABATAN } from "@/features/pemerintahan/domain/aparat-desa";

export async function GET() {
  const { rows } = await getPerangkatDesaData();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Pemerintah Desa";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Pemerintah Desa", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama", key: "nama", width: 28 },
    { header: "Gelar Depan", key: "gelarDepan", width: 14 },
    { header: "Gelar Belakang", key: "gelarBelakang", width: 14 },
    { header: "NIP", key: "nip", width: 18 },
    { header: "NIAP", key: "niap", width: 18 },
    { header: "NIK", key: "nik", width: 18 },
    { header: "Jabatan", key: "jabatan", width: 24 },
    { header: "Jenis Jabatan", key: "jenisJabatan", width: 18 },
    { header: "Jenis Kelamin", key: "jenisKelamin", width: 14 },
    { header: "Tempat Lahir", key: "tempatLahir", width: 20 },
    { header: "Tanggal Lahir", key: "tanggalLahir", width: 14 },
    { header: "Pendidikan", key: "pendidikan", width: 16 },
    { header: "Agama", key: "agama", width: 14 },
    { header: "Pangkat", key: "pangkat", width: 16 },
    { header: "Telepon", key: "telepon", width: 16 },
    { header: "Email", key: "email", width: 26 },
    { header: "Alamat", key: "alamat", width: 32 },
    { header: "Nomor SK Pengangkatan", key: "nomorSkPengangkatan", width: 22 },
    { header: "Tanggal Pengangkatan", key: "tanggalPengangkatan", width: 16 },
    { header: "Nomor SK Pemberhentian", key: "nomorSkPemberhentian", width: 22 },
    { header: "Tanggal Pemberhentian", key: "tanggalPemberhentian", width: 16 },
    { header: "Masa Jabatan", key: "periode", width: 22 },
    { header: "Status", key: "status", width: 12 },
    { header: "Kehadiran", key: "kehadiran", width: 12 },
    { header: "Penandatangan", key: "penandatangan", width: 14 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5122C8" } };
  header.alignment = { vertical: "middle", horizontal: "center" };
  rows.forEach((row, index) => {
    sheet.addRow({
      no: index + 1,
      nama: row.nama,
      gelarDepan: row.gelarDepan ?? "",
      gelarBelakang: row.gelarBelakang ?? "",
      nip: row.nip ?? "",
      niap: row.niap ?? "",
      nik: row.nik ?? "",
      jabatan: row.jabatan ?? "",
      jenisJabatan:
        row.jenisJabatan && isJenisJabatan(row.jenisJabatan)
          ? LABEL_JENIS_JABATAN[row.jenisJabatan]
          : "Jabatan lain",
      jenisKelamin:
        row.jenisKelamin === "male"
          ? "Laki-laki"
          : row.jenisKelamin === "female"
            ? "Perempuan"
            : "",
      tempatLahir: row.tempatLahir ?? "",
      tanggalLahir: row.tanggalLahir ?? "",
      pendidikan: row.pendidikan ?? "",
      agama: row.agama ?? "",
      pangkat: row.pangkat ?? "",
      telepon: row.telepon ?? "",
      email: row.email ?? "",
      alamat: row.alamat ?? "",
      nomorSkPengangkatan: row.nomorSkPengangkatan ?? "",
      tanggalPengangkatan: row.tanggalPengangkatan ?? "",
      nomorSkPemberhentian: row.nomorSkPemberhentian ?? "",
      tanggalPemberhentian: row.tanggalPemberhentian ?? "",
      periode: row.periode ?? "",
      status: row.status,
      kehadiran: row.kehadiran ? "Hadir" : "Tidak hadir",
      penandatangan: row.ttdAn ? "a.n" : row.ttdUb ? "u.b" : "",
    });
  });
  sheet.autoFilter = { from: "A1", to: "Z1" };
  sheet.eachRow((row, index) => {
    if (index > 1) row.alignment = { vertical: "middle" };
  });
  const bytes = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="buku-pemerintah-desa.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
}
