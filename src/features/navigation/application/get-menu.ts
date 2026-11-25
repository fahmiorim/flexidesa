import "server-only";

import { DEFAULT_RESOURCE, readableResources } from "@/features/rbac/application/authorization";
import { listModules } from "@/features/rbac/infrastructure/rbac-repository";
import type { CurrentUser } from "@/lib/dal";

import { MODUL_DIHENTIKAN } from "../domain/menu-tampil";
import { buildMenu, type MenuNode } from "./build-menu";

/**
 * Susun menu navigasi untuk pengguna berdasarkan izin efektifnya.
 *
 * Super admin melihat semua modul aktif; pengguna lain hanya modul yang boleh
 * dibaca (plus `beranda` yang selalu tersedia).
 */
export async function getMenuForUser(user: CurrentUser): Promise<MenuNode[]> {
  // Modul yang dihentikan tetap ada di database tenant lama; sembunyikan dari
  // sidebar tanpa menghapus riwayat izinnya.
  const modules = (await listModules(user.villageId)).filter(
    (modul) => !MODUL_DIHENTIKAN.includes(modul.slug),
  );

  const allowed = user.permissions.isSuperadmin
    ? new Set(modules.map((modul) => modul.slug))
    : readableResources(user.permissions);

  allowed.add(DEFAULT_RESOURCE);

  return buildMenu(modules, allowed);
}
