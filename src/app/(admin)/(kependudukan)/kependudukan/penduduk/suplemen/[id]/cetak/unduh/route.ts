import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  exportFilteredSuplemenUseCase,
  filterTerdataDariQuery,
} from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/kependudukan/penduduk/domain/suplemen";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { getCurrentUser } from "@/lib/dal";

/** Unduh daftar terdata sesuai filter. */
export async function GET(
  request: Request,
  context: RouteContext<"/kependudukan/penduduk/suplemen/[id]/cetak/unduh">,
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
    await resolveVillageId(user);
    const filter = filterTerdataDariQuery(new URL(request.url).searchParams);
    const hasil = await exportFilteredSuplemenUseCase(suplemenId, filter);
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
    console.error("Gagal mengunduh daftar terdata suplemen:", error);
    return new Response("Gagal mengunduh daftar terdata suplemen.", { status: 500 });
  }
}
