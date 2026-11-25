import { getIdentitas } from "@/features/desa/application/get-identitas";
import { listRiwayatExport } from "@/features/penduduk/application/riwayat-penduduk-use-cases";
import {
  buildRiwayatPendudukCsv,
  normalisasiMutationType,
  riwayatPendudukFilename,
  type ListRiwayatParams,
} from "@/features/penduduk/domain/riwayat-penduduk";

function angka(value: string | null, min: number, max: number): number | null {
  const parsed = Number(value);
  return value !== null && Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const type = normalisasiMutationType(url.searchParams.get("type"));
  const gender = url.searchParams.get("gender");
  const params: ListRiwayatParams = {
    q,
    type,
    year: angka(url.searchParams.get("year"), 1900, 2999),
    month: angka(url.searchParams.get("month"), 1, 12),
    gender: gender === "male" || gender === "female" ? gender : null,
    religionId: angka(url.searchParams.get("religionId"), 1, Number.MAX_SAFE_INTEGER),
    regionId: angka(url.searchParams.get("regionId"), 1, Number.MAX_SAFE_INTEGER),
  };
  const [rows, desa] = await Promise.all([listRiwayatExport(params), getIdentitas()]);
  const csv = buildRiwayatPendudukCsv({ namaDesa: desa?.namaDesa ?? null, rows });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${riwayatPendudukFilename(desa?.namaDesa ?? null)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
