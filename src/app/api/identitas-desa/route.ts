import { NextResponse } from "next/server";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  getDataIdentitasDesa,
  simpanProfilDesa,
  simpanSebutanDesa,
} from "@/features/info-desa/identitas-desa/application/identitas-desa-use-cases";
import { requirePermission } from "@/lib/dal";
import { appErrorStatus, isAppError } from "@/lib/errors";

export const runtime = "nodejs";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
function handleError(error: unknown) {
  if (isAppError(error)) return json({ error: error.message }, appErrorStatus(error.code));
  console.error("Identitas desa gagal diproses:", error);
  return json({ error: "Identitas desa gagal diproses." }, 500);
}
export async function GET() {
  try {
    // Modul identitas masih memakai izin pengaturan-desa pada tenant lama.
    const user = await requirePermission("pengaturan-desa", "read"),
      villageId = await resolveVillageId(user);
    return json(await getDataIdentitasDesa(villageId));
  } catch (error) {
    return handleError(error);
  }
}
export async function PUT(request: Request) {
  try {
    const user = await requirePermission("pengaturan-desa", "update"),
      villageId = await resolveVillageId(user);
    const body = (await request.json()) as { section?: string; data?: unknown };
    if (body.section === "profil") {
      await simpanProfilDesa(villageId, body.data);
      return json({ message: "Profil dan identitas desa berhasil disimpan." });
    }
    if (body.section === "sebutan") {
      await simpanSebutanDesa(villageId, body.data);
      return json({ message: "Sebutan wilayah berhasil disimpan." });
    }
    return json({ error: "Bagian identitas tidak dikenal." }, 400);
  } catch (error) {
    return handleError(error);
  }
}
