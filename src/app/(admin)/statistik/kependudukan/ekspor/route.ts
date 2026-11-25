import { resolveVillageId } from "@/features/desa/application/resolve-village";
import { getNamaDesaUseCase } from "@/features/desa/application/use-cases";
import { hasPermission } from "@/features/rbac/application/authorization";
import { RESOURCES } from "@/features/rbac/domain/resources";
import {
  getStatistikKependudukanData,
  labelFilterWilayah,
  nilaiFilter,
} from "@/features/statistik/application/statistik-kependudukan-use-cases";
import {
  buildStatistikKependudukanCsv,
  statistikKependudukanFilename,
} from "@/features/statistik/domain/statistik-kependudukan";
import { getCurrentUser } from "@/lib/dal";

export async function GET(
  request: Request,
  _context: RouteContext<"/statistik/kependudukan/ekspor">,
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sesi Anda telah berakhir.", { status: 401 });
  if (!hasPermission(user.permissions, RESOURCES.penduduk, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  const url = new URL(request.url);
  const dusun = nilaiFilter(url.searchParams.get("dusun") ?? undefined);
  const rw = nilaiFilter(url.searchParams.get("rw") ?? undefined);
  const rt = nilaiFilter(url.searchParams.get("rt") ?? undefined);
  const villageId = await resolveVillageId(user);
  const [namaDesa, { kategori, hasil }] = await Promise.all([
    getNamaDesaUseCase(villageId),
    getStatistikKependudukanData(villageId, {
      kategoriSlug: nilaiFilter(url.searchParams.get("kategori") ?? undefined) ?? "",
      dusun,
      rw,
      rt,
    }),
  ]);

  const csv = buildStatistikKependudukanCsv({
    namaDesa,
    hasil,
    filter: labelFilterWilayah({ dusun, rw, rt }),
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${statistikKependudukanFilename(kategori.slug)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
