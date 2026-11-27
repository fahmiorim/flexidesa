"use server";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { generateApbdesTemplate } from "@/features/keuangan-desa/keuangan/domain/apbdes-import";
import { KEUANGAN_RESOURCE } from "@/features/keuangan-desa/keuangan/domain/keuangan";
import { requirePermission } from "@/lib/dal";

/**
 * Download template APBDes Excel.
 */
export async function downloadApbdesTemplateAction(): Promise<Buffer> {
  const user = await requirePermission(KEUANGAN_RESOURCE, "read");
  await resolveVillageId(user);

  return generateApbdesTemplate();
}

/**
 * Validasi file APBDes tanpa menyimpan (preview).
 */

/**
 * Impor APBDes dari file Excel/CSV.
 * Transaksional: all-or-nothing.
 */
