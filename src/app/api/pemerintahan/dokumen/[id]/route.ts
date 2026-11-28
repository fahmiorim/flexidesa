import { NextResponse } from "next/server";

import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { unduhDokumenPemerintahanData } from "@/features/info-desa/pemerintahan/application/dokumen";
import { batasiPermintaan } from "@/features/rate-limit/application/rate-limit";
import { alamatIp } from "@/lib/client-ip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(request: Request, { params }: Context) {
  // Audit keamanan F4: route publik ini disamakan pola rate limit-nya dengan
  // route publik lain (60/menit per host+IP) agar tidak menjadi jalur unduh
  // tanpa batas. Tenant tetap dari host, bukan dari sesi.
  const hostMentah = request.headers.get("host") ?? "";
  const host = /^[a-z0-9.:\-[\]]+$/i.test(hostMentah) ? hostMentah.toLowerCase() : "tanpa-host";
  const batas = await batasiPermintaan(`dokumen-pemerintahan:${host}:${alamatIp(request)}`, {
    batas: 60,
  });
  if (batas.dibatasi) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi beberapa saat." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await params;
  const documentId = Number(id);
  if (!Number.isSafeInteger(documentId) || documentId < 1) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
  }

  const desa = await getIdentitasFromRequest();
  const dokumen = await unduhDokumenPemerintahanData(desa.id, documentId);
  if (!dokumen) return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });

  const mime = MIME_BY_EXT[dokumen.ekstensi] ?? "image/jpeg";
  return new NextResponse(new Uint8Array(dokumen.isi), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="dokumen-pemerintahan-${dokumen.id}.${dokumen.ekstensi}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
