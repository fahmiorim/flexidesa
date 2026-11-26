import { buildKeluargaPdfBatch } from "@/features/kependudukan/keluarga/application/use-cases";
import {
  KELUARGA_RESOURCE,
  parseKeluargaIds,
} from "@/features/kependudukan/keluarga/domain/keluarga";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { getCurrentUser } from "@/lib/dal";
import { isAppError } from "@/lib/errors";

/** Unduh beberapa KK sekaligus sebagai satu PDF. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sesi Anda telah berakhir.", { status: 401 });
  if (!hasPermission(user.permissions, KELUARGA_RESOURCE, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  const ids = parseKeluargaIds(new URL(request.url).searchParams.get("ids"));
  if (ids.length === 0) {
    return new Response("Pilih minimal satu Kartu Keluarga.", { status: 400 });
  }

  try {
    const pdf = await buildKeluargaPdfBatch(ids);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="kartu-keluarga-${ids.length}-kk.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      return new Response(error.message, { status: 404 });
    }
    if (isAppError(error) && error.code === "VALIDATION") {
      return new Response(error.message, { status: 400 });
    }
    console.error("Gagal mengunduh Kartu Keluarga massal:", error);
    return new Response("Gagal mengunduh Kartu Keluarga.", { status: 500 });
  }
}
