import { buildDptXlsx } from "@/features/penduduk/application/dpt-use-cases";
import { listDptParamsSchema } from "@/features/penduduk/domain/dpt";
import { PENDUDUK_RESOURCE } from "@/features/penduduk/domain/penduduk";
import { hasPermission } from "@/features/rbac/application/authorization";
import { getCurrentUser } from "@/lib/dal";
import { appErrorStatus, isAppError } from "@/lib/errors";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sesi Anda telah berakhir.", { status: 401 });
  if (!hasPermission(user.permissions, PENDUDUK_RESOURCE, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  const url = new URL(request.url);
  const sensor = url.searchParams.get("sensor") === "1";
  const rawParams = Object.fromEntries(
    [...url.searchParams.entries()].filter(
      ([kunci, nilai]) => kunci !== "sensor" && nilai.trim() !== "",
    ),
  );
  const parsed = listDptParamsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return new Response("Parameter filter DPT tidak valid.", { status: 400 });
  }

  try {
    const berkas = await buildDptXlsx(parsed.data, sensor);
    return new Response(Buffer.from(berkas), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="daftar-calon-pemilih.xlsx"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return new Response(error.message, { status: appErrorStatus(error.code) });
    }
    console.error("Gagal mengunduh calon pemilih:", error);
    return new Response("Gagal mengunduh calon pemilih.", { status: 500 });
  }
}
