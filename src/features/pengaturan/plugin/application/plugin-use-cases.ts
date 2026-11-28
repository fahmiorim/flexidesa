// Cadangan fitur: teruji, belum dipakai produksi. Pertahankan bersama test-nya;
// hapus berkas + test-nya bila diputuskan tidak dipakai.
import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { recordAuditEvent } from "@/features/pengaturan/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/pengaturan/audit/domain/audit";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { env } from "@/lib/env";
import { notFound, validationError } from "@/lib/errors";

import { cariPlugin, envBelumSiap, type PluginManifest } from "../domain/plugin";
import { simpanStatusPlugin } from "../infrastructure/plugin-repository";

interface PluginView extends PluginManifest {
  aktif: boolean;
  envKurang: string[];
}

/** Daftar plugin manifest + status aktif + environment yang belum siap. */

/**
 * Aktifkan/nonaktifkan plugin.
 *
 * Aktivasi ditolak bila environment wajib belum terisi agar status "aktif"
 * tidak menyesatkan operator.
 */
export async function ubahStatusPlugin(slug: string, aktif: boolean): Promise<PluginView> {
  const user = await requirePermission(RESOURCES.plugin, "delete");
  const villageId = await resolveVillageId(user);

  const plugin = cariPlugin(slug);
  if (!plugin) throw notFound("Plugin tidak dikenal.");

  const envSaatIni = env as unknown as Record<string, string | undefined>;
  const envKurang = envBelumSiap(plugin, envSaatIni);

  if (aktif && envKurang.length > 0) {
    throw validationError(
      `Plugin "${plugin.nama}" belum dapat diaktifkan: environment ${envKurang.join(", ")} belum diisi.`,
    );
  }

  await simpanStatusPlugin(villageId, plugin.slug, aktif);

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: aktif ? AUDIT_EVENTS.pluginActivate : AUDIT_EVENTS.pluginDeactivate,
    resource: RESOURCES.plugin,
    resourceId: plugin.slug,
    details: { aktif, envKurang: envKurang.join(",") || null },
  });

  return { ...plugin, aktif, envKurang };
}
