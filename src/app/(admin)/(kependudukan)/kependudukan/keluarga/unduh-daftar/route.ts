import { buildKeluargaDaftarXlsx } from "@/features/kependudukan/keluarga/application/use-cases";
import { parseKeluargaFilter } from "@/features/kependudukan/keluarga/domain/keluarga";
import { isAppError } from "@/lib/errors";

/** Unduh daftar KK sesuai filter aktif dalam format XLSX. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sensor = url.searchParams.get("sensor") === "1";

  try {
    const berkas = await buildKeluargaDaftarXlsx(parseKeluargaFilter(url.searchParams), sensor);
    return new Response(Buffer.from(berkas), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="data-keluarga.xlsx"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (isAppError(error) && error.code === "FORBIDDEN") {
      return new Response("Anda tidak memiliki hak akses.", { status: 403 });
    }
    if (isAppError(error) && error.code === "UNAUTHENTICATED") {
      return new Response("Sesi Anda telah berakhir.", { status: 401 });
    }
    console.error("Gagal mengunduh daftar Kartu Keluarga:", error);
    return new Response("Gagal mengunduh daftar Kartu Keluarga.", { status: 500 });
  }
}
