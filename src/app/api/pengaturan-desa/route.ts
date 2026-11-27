import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { simpanSebutanDesa } from "@/features/info-desa/identitas-desa/application/identitas-desa-use-cases";
import {
  getDataPengaturanDesa,
  simpanFaqDesa,
  simpanIntegrasiDesa,
  simpanKontakDesa,
  simpanOpsiTemaDesa,
  terapkanTemplateDesa,
} from "@/features/pengaturan/pengaturan/application/pengaturan-desa-use-cases";
import {
  bacaPengaturan,
  simpanPengaturanTenant,
} from "@/features/pengaturan/pengaturan/application/pengaturan-use-cases";
import { requirePermission } from "@/lib/dal";
import { appErrorStatus, isAppError } from "@/lib/errors";

export const runtime = "nodejs";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
const umumSchema = z.object({
  komentarAktif: z.boolean(),
  beritaBeranda: z.coerce.number().int().min(1).max(12),
  pendaftaranWargaAktif: z.boolean(),
  penomoranSurat: z.coerce.number().int().min(1).max(4),
});
function handleError(error: unknown) {
  if (isAppError(error)) return json({ error: error.message }, appErrorStatus(error.code));
  console.error("Pengaturan desa gagal diproses:", error);
  return json({ error: "Pengaturan desa gagal diproses." }, 500);
}
export async function GET() {
  try {
    const user = await requirePermission("pengaturan-desa", "read"),
      villageId = await resolveVillageId(user);
    return json(await getDataPengaturanDesa(villageId));
  } catch (error) {
    return handleError(error);
  }
}
export async function PUT(request: Request) {
  try {
    const user = await requirePermission("pengaturan-desa", "update"),
      villageId = await resolveVillageId(user);
    const body = (await request.json()) as { section?: string; data?: unknown };
    if (body.section === "sebutan") {
      await simpanSebutanDesa(villageId, body.data);
      return json({ message: "Sebutan wilayah berhasil disimpan." });
    }
    if (body.section === "kontak") {
      await simpanKontakDesa(villageId, body.data);
      return json({ message: "Kontak dan lokasi berhasil disimpan." });
    }
    if (body.section === "faq-kontak" || body.section === "faq-surat") {
      await simpanFaqDesa(villageId, body.section === "faq-kontak" ? "kontak" : "surat", body.data);
      return json({ message: "FAQ berhasil disimpan." });
    }
    if (body.section === "integrasi") {
      await simpanIntegrasiDesa(villageId, body.data);
      return json({ message: "Pengaturan integrasi berhasil disimpan." });
    }
    if (body.section === "umum") {
      const s = umumSchema.safeParse(body.data);
      if (!s.success)
        return json({ error: s.error.issues[0]?.message ?? "Pengaturan umum tidak valid." }, 422);
      // Bagian "umum" hanya mengirim empat kunci; gabungkan dengan nilai
      // tersimpan agar pengaturan surat tidak ikut kembali ke bawaan.
      const tersimpan = await bacaPengaturan(villageId);
      await simpanPengaturanTenant(villageId, { ...tersimpan, ...s.data }, user.id);
      return json({ message: "Preferensi umum berhasil disimpan." });
    }
    if (body.section === "tampilan") {
      const message = await terapkanTemplateDesa(villageId, body.data);
      return json({ message });
    }
    if (body.section === "opsi-tema") {
      const { peringatan } = await simpanOpsiTemaDesa(villageId, body.data);
      return json({
        message: peringatan.length
          ? `Opsi tema disimpan. ${peringatan.join(" ")}`
          : "Opsi tema berhasil disimpan.",
      });
    }
    return json({ error: "Bagian pengaturan tidak dikenal." }, 400);
  } catch (error) {
    return handleError(error);
  }
}
