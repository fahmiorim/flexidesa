import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { requirePermission } from "@/lib/dal";

/**
 * Ambil `villageId` sesi setelah memeriksa izin `resource`.
 *
 * Dipakai seluruh use case pemerintahan agar pemeriksaan izin dan penentuan
 * tenant selalu berpasangan.
 */
export async function tenant(resource: string, action: "read" | "update" | "delete" = "read") {
  const user = await requirePermission(resource, action);
  return resolveVillageId(user);
}
