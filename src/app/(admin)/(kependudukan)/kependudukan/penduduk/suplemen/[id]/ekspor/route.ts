import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { exportSuplemenUseCase } from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/kependudukan/penduduk/domain/suplemen";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { getCurrentUser } from "@/lib/dal";

export async function GET(
  _request: Request,
  context: RouteContext<"/kependudukan/penduduk/suplemen/[id]/ekspor">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Sesi Anda telah berakhir.", { status: 401 });
  }
  if (!hasPermission(user.permissions, SUPLEMEN_RESOURCE, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  const { id } = await context.params;
  const suplemenId = Number(id);
  if (!Number.isInteger(suplemenId) || suplemenId <= 0) {
    return new Response("Suplemen tidak valid.", { status: 400 });
  }

  try {
    const villageId = await resolveVillageId(user);
    const hasil = await exportSuplemenUseCase(villageId, suplemenId);
    if (!hasil) {
      return new Response("Suplemen tidak ditemukan.", { status: 404 });
    }

    return new Response(hasil.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${hasil.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Gagal membuat ekspor suplemen:", error);
    return new Response("Gagal membuat ekspor suplemen.", { status: 500 });
  }
}
