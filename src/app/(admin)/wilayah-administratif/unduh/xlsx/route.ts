import { getUnduhanWilayah } from "@/features/wilayah/application/unduhan-wilayah";
import {
  buildWilayahXlsx,
  namaBerkasWilayah,
} from "@/features/wilayah/infrastructure/wilayah-unduhan";

/** Unduh daftar wilayah administratif sebagai XLSX. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parent = Number(url.searchParams.get("parent") ?? "");

  try {
    const data = await getUnduhanWilayah(
      Number.isSafeInteger(parent) && parent > 0 ? parent : null,
    );
    if (!data.ok) return new Response(data.pesan, { status: data.status });

    const berkas = await buildWilayahXlsx({
      rows: data.rows,
      namaDesa: data.namaDesa,
      judul: data.judul,
      indukLabel: data.indukLabel,
      turunan: data.turunan,
    });

    return new Response(new Uint8Array(berkas), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${namaBerkasWilayah(
          data.judul,
          data.indukLabel,
          "xlsx",
        )}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Gagal mengunduh wilayah (XLSX):", error);
    return new Response("Gagal mengunduh data wilayah.", { status: 500 });
  }
}
