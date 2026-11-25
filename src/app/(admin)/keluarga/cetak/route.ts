import { buildKeluargaPdfBatch } from "@/features/keluarga/application/use-cases";
import { KELUARGA_RESOURCE, parseKeluargaIds } from "@/features/keluarga/domain/keluarga";
import { hasPermission } from "@/features/rbac/application/authorization";
import { getCurrentUser } from "@/lib/dal";
import { isAppError } from "@/lib/errors";

/** Cetak beberapa KK sekaligus (inline) untuk aksi massal daftar keluarga. */
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
        "Content-Disposition": `inline; filename="kartu-keluarga-${ids.length}-kk.pdf"`,
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
    console.error("Gagal mencetak Kartu Keluarga massal:", error);
    return new Response("Gagal mencetak Kartu Keluarga.", { status: 500 });
  }
}
