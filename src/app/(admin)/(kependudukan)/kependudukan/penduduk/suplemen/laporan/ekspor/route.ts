import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { exportRekapSuplemenUseCase } from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/kependudukan/penduduk/domain/suplemen";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { getCurrentUser } from "@/lib/dal";

export async function GET(
  _request: Request,
  _context: RouteContext<"/kependudukan/penduduk/suplemen/laporan/ekspor">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Sesi Anda telah berakhir.", { status: 401 });
  }
  if (!hasPermission(user.permissions, SUPLEMEN_RESOURCE, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  try {
    const villageId = await resolveVillageId(user);
    const { csv, filename } = await exportRekapSuplemenUseCase(villageId);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Gagal membuat rekap suplemen:", error);
    return new Response("Gagal membuat rekap suplemen.", { status: 500 });
  }
}
