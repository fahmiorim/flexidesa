import { listPendudukEksporData } from "@/features/penduduk/application/use-cases";
import { parseFilterPenduduk } from "@/features/penduduk/domain/penduduk";
import {
  barisEksporPenduduk,
  KOLOM_EKSPOR_PENDUDUK,
} from "@/features/penduduk/domain/penduduk-export";
import { toCsv } from "@/lib/csv";
import { isAppError } from "@/lib/errors";

export async function GET(request: Request, _context: RouteContext<"/penduduk/ekspor">) {
  const url = new URL(request.url);
  const filter = parseFilterPenduduk({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    gender: url.searchParams.get("gender") ?? undefined,
    religionId: url.searchParams.get("religionId") ?? undefined,
    educationId: url.searchParams.get("educationId") ?? undefined,
    occupationId: url.searchParams.get("occupationId") ?? undefined,
    maritalStatusId: url.searchParams.get("maritalStatusId") ?? undefined,
    dusun: url.searchParams.get("dusun") ?? undefined,
    rw: url.searchParams.get("rw") ?? undefined,
    rt: url.searchParams.get("rt") ?? undefined,
    umurMin: url.searchParams.get("umurMin") ?? undefined,
    umurMax: url.searchParams.get("umurMax") ?? undefined,
  });

  let result;
  try {
    result = await listPendudukEksporData(filter);
  } catch (error) {
    if (isAppError(error) && error.code === "FORBIDDEN") {
      return new Response("Anda tidak memiliki hak akses.", { status: 403 });
    }
    if (isAppError(error) && error.code === "UNAUTHENTICATED") {
      return new Response("Sesi Anda telah berakhir.", { status: 401 });
    }
    throw error;
  }

  const csv = `\uFEFF${toCsv([
    [...KOLOM_EKSPOR_PENDUDUK],
    ...result.map((row) => barisEksporPenduduk(row)),
  ])}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="data-penduduk.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
