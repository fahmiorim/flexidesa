import { listSemuaKeluarga } from "@/features/kependudukan/keluarga/application/use-cases";
import {
  parseKeluargaFilter,
  welfareClassLabel,
} from "@/features/kependudukan/keluarga/domain/keluarga";
import { GENDER_LABELS } from "@/features/kependudukan/penduduk/domain/penduduk";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const rows = await listSemuaKeluarga(parseKeluargaFilter(new URL(request.url).searchParams));
  const csv = `\uFEFF${toCsv([
    [
      "Nomor KK",
      "Status Nomor",
      "Kepala Keluarga",
      "NIK",
      "Tag ID Card",
      "Jenis Kelamin",
      "Jumlah Anggota",
      "Alamat",
      "Wilayah",
      "Tanggal Terdaftar",
      "Tanggal Cetak KK",
      "Kelas Sosial",
    ],
    ...rows.map((row) => [
      row.number,
      row.temporary ? "Sementara" : "Permanen",
      row.headName ?? "",
      row.headNationalId ?? "",
      row.headIdCardTag ?? "",
      row.headGender ? GENDER_LABELS[row.headGender] : "",
      String(row.memberCount),
      row.address ?? "",
      row.regionLabel ?? "",
      row.registeredAt.slice(0, 10),
      row.cardPrintedAt ?? "",
      row.welfareClass === null ? "" : welfareClassLabel(row.welfareClass),
    ]),
  ])}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="data-kartu-keluarga.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
