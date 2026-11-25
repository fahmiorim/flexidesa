import { getLaporanBulanan } from "@/features/laporan-bulanan/application/laporan-bulanan-use-cases";
import {
  buildLaporanBulananCsv,
  laporanBulananFilename,
  normalisasiPeriode,
} from "@/features/laporan-bulanan/domain/laporan-bulanan";
import { hasPermission } from "@/features/rbac/application/authorization";
import { RESOURCES } from "@/features/rbac/domain/resources";
import { getCurrentUser } from "@/lib/dal";

export async function GET(request: Request, _context: RouteContext<"/laporan-bulanan/ekspor">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sesi Anda telah berakhir.", { status: 401 });
  if (!hasPermission(user.permissions, RESOURCES.laporanBulanan, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  const url = new URL(request.url);
  const periode = normalisasiPeriode(url.searchParams.get("tahun"), url.searchParams.get("bulan"));

  try {
    const laporan = await getLaporanBulanan(String(periode.tahun), String(periode.bulan));
    const csv = buildLaporanBulananCsv({
      namaDesa: laporan.namaDesa,
      kecamatan: laporan.kecamatan,
      periode,
      baris: laporan.baris,
    });

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${laporanBulananFilename(laporan.namaDesa, periode)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Gagal membuat ekspor laporan bulanan:", error);
    return new Response("Gagal membuat ekspor laporan.", { status: 500 });
  }
}
