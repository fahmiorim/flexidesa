import { hasPermission } from "@/features/rbac/application/authorization";
import {
  eksporKelompokRentan,
  LAPORAN_KELOMPOK_RENTAN_RESOURCE,
} from "@/features/statistik/application/kelompok-rentan-use-cases";
import { getCurrentUser } from "@/lib/dal";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sesi Anda telah berakhir.", { status: 401 });
  if (!hasPermission(user.permissions, LAPORAN_KELOMPOK_RENTAN_RESOURCE, "read")) {
    return new Response("Anda tidak memiliki hak akses.", { status: 403 });
  }

  const url = new URL(request.url);

  try {
    const berkas = await eksporKelompokRentan(
      url.searchParams.get("format"),
      url.searchParams.get("dusun"),
    );

    return new Response(berkas.isi as BodyInit, {
      headers: {
        "Content-Type": berkas.tipeKonten,
        "Content-Disposition": `attachment; filename="${berkas.namaBerkas}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Gagal membuat ekspor kelompok rentan:", error);
    return new Response("Gagal membuat ekspor laporan.", { status: 500 });
  }
}
