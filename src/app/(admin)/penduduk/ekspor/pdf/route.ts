import { getPendudukEksporPdf } from "@/features/penduduk/application/use-cases";
import { parseFilterPenduduk } from "@/features/penduduk/domain/penduduk";
import { isAppError } from "@/lib/errors";

export async function GET(request: Request, _context: RouteContext<"/penduduk/ekspor/pdf">) {
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

  try {
    const pdf = await getPendudukEksporPdf(filter);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="data-penduduk.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (isAppError(error) && error.code === "FORBIDDEN") {
      return new Response("Anda tidak memiliki hak akses.", { status: 403 });
    }
    if (isAppError(error) && error.code === "UNAUTHENTICATED") {
      return new Response("Sesi Anda telah berakhir.", { status: 401 });
    }
    console.error("Gagal membuat PDF penduduk:", error);
    return new Response("Gagal membuat PDF.", { status: 500 });
  }
}
