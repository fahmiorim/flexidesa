import { getRekapitulasiKehadiranEkspor } from "@/features/kehadiran/kehadiran/application/rekapitulasi-use-cases";
import { buildRekapitulasiKehadiranXlsx } from "@/features/kehadiran/kehadiran/application/rekapitulasi-xlsx";
import { bacaFilterRekapitulasi } from "@/features/kehadiran/kehadiran/domain/rekapitulasi";
import { isAppError } from "@/lib/errors";

/** Unduh rekapitulasi kehadiran sebagai Excel (setara tombol ekspor OpenSID). */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const filter = bacaFilterRekapitulasi({
    dari: url.searchParams.get("dari"),
    sampai: url.searchParams.get("sampai"),
    perangkat: url.searchParams.get("perangkat"),
    status: url.searchParams.get("status"),
  });

  try {
    const rows = await getRekapitulasiKehadiranEkspor(filter);
    const berkas = await buildRekapitulasiKehadiranXlsx(rows);

    const bagian = ["rekapitulasi_kehadiran"];
    if (filter.dari) bagian.push(filter.dari);
    if (filter.sampai) bagian.push(filter.sampai);
    const namaBerkas = `${bagian.join("_")}.xlsx`;

    return new Response(Buffer.from(berkas), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${namaBerkas}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      if (error.code === "UNAUTHENTICATED") {
        return new Response(error.message, { status: 401 });
      }
      if (error.code === "FORBIDDEN") return new Response(error.message, { status: 403 });
    }

    console.error("Gagal membuat ekspor rekapitulasi kehadiran:", error);
    return new Response("Gagal membuat berkas rekapitulasi.", { status: 500 });
  }
}
