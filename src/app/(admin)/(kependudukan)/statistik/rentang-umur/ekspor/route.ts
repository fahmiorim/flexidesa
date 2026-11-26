import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { listRentangUmurUseCase } from "@/features/kependudukan/statistik/application/rentang-umur-use-cases";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { getCurrentUser } from "@/lib/dal";

export async function GET(
  _request: Request,
  _context: RouteContext<"/statistik/rentang-umur/ekspor">,
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sesi Anda telah berakhir.", { status: 401 });
  if (!hasPermission(user.permissions, RESOURCES.penduduk, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  const villageId = await resolveVillageId(user);
  const rows = await listRentangUmurUseCase({ villageId });

  const csv = `\uFEFF${[
    ["No", "Nama", "Bawah", "Atas", "Status"],
    ...rows.map((r, i) => [
      String(i + 1),
      r.nama,
      String(r.dari),
      r.sampai ?? "∞",
      r.status ? "Aktif" : "Nonaktif",
    ]),
  ]
    .map((row) => row.join(";"))
    .join("\r\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rentang-umur.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
