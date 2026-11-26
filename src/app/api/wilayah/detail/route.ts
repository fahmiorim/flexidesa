import { NextResponse } from "next/server";

import { detailWilayahAdministratif } from "@/features/info-desa/wilayah/application/data-wilayah";

/**
 * Detail wilayah desa untuk melengkapi formulir identitas.
 *
 * Kode Kemendagri 10 digit dipetakan ke kode BPS dan kode pos. Data publik,
 * jadi tidak memerlukan sesi; hasil di-cache karena dataset hanya berubah saat
 * aplikasi diperbarui.
 */
export async function GET(request: Request) {
  const kode = new URL(request.url).searchParams.get("kode");
  const detail = detailWilayahAdministratif(kode);

  if (!detail) {
    return NextResponse.json(
      { error: "Kode desa tidak valid atau detail wilayah tidak ditemukan." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { data: detail },
    { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
  );
}
