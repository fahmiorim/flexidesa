import { unduhTemplateImporPendudukAction } from "@/features/kependudukan/penduduk/application/penduduk-import-use-cases";
import { isAppError } from "@/lib/errors";

export async function GET(
  _request: Request,
  _context: RouteContext<"/kependudukan/penduduk/impor/template">,
) {
  try {
    const { isi, nama } = await unduhTemplateImporPendudukAction();
    return new Response(new Uint8Array(isi), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nama}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (isAppError(error) && error.code === "FORBIDDEN") {
      return new Response("Anda tidak memiliki hak akses.", { status: 403 });
    }
    if (isAppError(error) && error.code === "UNAUTHENTICATED") {
      return new Response("Sesi Anda telah berakhir.", { status: 401 });
    }
    throw error;
  }
}
