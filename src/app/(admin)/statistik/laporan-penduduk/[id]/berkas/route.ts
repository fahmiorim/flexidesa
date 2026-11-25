import { getBerkasLaporanPenduduk } from "@/features/statistik/application/laporan-penduduk-use-cases";
import { isAppError } from "@/lib/errors";

/** Unduh/tampilkan berkas PDF arsip Laporan Penduduk. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/statistik/laporan-penduduk/[id]/berkas">,
) {
  const { id } = await params;
  const laporanId = Number(id);
  if (!Number.isInteger(laporanId) || laporanId <= 0) {
    return new Response("Laporan penduduk tidak valid.", { status: 400 });
  }

  try {
    const { row, isi } = await getBerkasLaporanPenduduk(laporanId);
    const unduh = new URL(request.url).searchParams.get("unduh") === "1";

    return new Response(Buffer.from(isi), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${unduh ? "attachment" : "inline"}; filename="${row.namaFile.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      if (error.code === "NOT_FOUND") return new Response(error.message, { status: 404 });
      if (error.code === "FORBIDDEN") return new Response(error.message, { status: 403 });
      if (error.code === "UNAUTHENTICATED") {
        return new Response(error.message, { status: 401 });
      }
    }

    console.error("Gagal membaca berkas laporan penduduk:", error);
    return new Response("Gagal membaca berkas laporan.", { status: 500 });
  }
}
