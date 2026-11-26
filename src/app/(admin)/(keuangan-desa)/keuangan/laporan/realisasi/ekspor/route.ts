import { getIdentitas } from "@/features/info-desa/desa/application/get-identitas";
import { getLaporanRealisasiResmi } from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import { LAPORAN_KEUANGAN_RESOURCE } from "@/features/keuangan-desa/keuangan/domain/keuangan";
import {
  buildLaporanRealisasiCsv,
  laporanRealisasiCsvFilename,
} from "@/features/keuangan-desa/keuangan/domain/laporan-realisasi";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { getCurrentUser } from "@/lib/dal";

export async function GET(
  request: Request,
  _context: RouteContext<"/keuangan/laporan/realisasi/ekspor">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Sesi Anda telah berakhir.", { status: 401 });
  }
  if (!hasPermission(user.permissions, LAPORAN_KEUANGAN_RESOURCE, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  const url = new URL(request.url);
  const tahunRaw = url.searchParams.get("tahun");
  const tahunParam = tahunRaw ? Number(tahunRaw) : undefined;

  try {
    const [laporan, desa] = await Promise.all([
      getLaporanRealisasiResmi(tahunParam),
      getIdentitas(),
    ]);

    const csv = buildLaporanRealisasiCsv({
      namaDesa: desa?.namaDesa ?? null,
      kecamatan: desa?.namaKecamatan ?? null,
      tahun: laporan.tahun,
      laporan: laporan.laporan,
    });

    const filename = laporanRealisasiCsvFilename(desa?.namaDesa ?? null, laporan.tahun);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Gagal membuat ekspor rincian realisasi:", error);
    return new Response("Gagal membuat ekspor laporan.", { status: 500 });
  }
}
