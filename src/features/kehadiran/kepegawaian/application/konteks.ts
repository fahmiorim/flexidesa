import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { requirePermission } from "@/lib/dal";

/**
 * Ambil pengguna dan `villageId` sesi setelah memeriksa izin kepegawaian.
 */
export async function village(resource: string, action: "read" | "update" = "read") {
  const user = await requirePermission(resource, action);
  return { user, villageId: await resolveVillageId(user) };
}
