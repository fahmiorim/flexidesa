import { unduhTemplateImporRtm } from "@/features/kependudukan/rumah-tangga/application/rumah-tangga-import-use-cases";
import { isAppError } from "@/lib/errors";

export async function GET(
  _request: Request,
  _context: RouteContext<"/kependudukan/rumah-tangga/impor/template">,
) {
  try {
    const { isi, nama } = await unduhTemplateImporRtm();
    return new Response(isi, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
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
