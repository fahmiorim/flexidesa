import "server-only";

import { cache } from "react";

import {
  applyParentInheritance,
  levelAllows,
  type AccessLevel,
  type Action,
  type ModuleActions,
} from "@/features/pengaturan/rbac/domain/permission";
import {
  findRoleById,
  listActionsByRole,
  listLevelsByRole,
  listModules,
  listPlanModuleSlugs,
  type ModuleRecord,
} from "@/features/pengaturan/rbac/infrastructure/rbac-repository";

/** Slug role super admin: melewati seluruh pemeriksaan izin. */
export const SUPERADMIN_SLUG = "administrator";

/** Modul bawaan yang selalu dapat dibaca setiap pengguna yang sudah masuk. */
export const DEFAULT_RESOURCE = "beranda";

export interface EffectivePermissions {
  isSuperadmin: boolean;
  /** Fitur paket aktif; `undefined` berarti tenant legacy tanpa pembatasan paket. */
  allowedModuleSlugs?: ReadonlySet<string>;
  levelByResource: Map<string, AccessLevel>;
  actionByResource: Map<string, ModuleActions>;
}

const EMPTY_PERMISSIONS: EffectivePermissions = {
  isSuperadmin: false,
  levelByResource: new Map(),
  actionByResource: new Map(),
};

function perluasFiturPaket(
  modulList: readonly ModuleRecord[],
  fitur: ReadonlySet<string>,
): ReadonlySet<string> {
  const allowed = new Set([DEFAULT_RESOURCE, ...fitur]);
  const byId = new Map(modulList.map((modul) => [modul.id, modul]));

  for (const modul of modulList) {
    if (!allowed.has(modul.slug)) continue;
    let parentId = modul.parentId;
    while (parentId !== null && parentId > 0) {
      const parent = byId.get(parentId);
      if (!parent) break;
      allowed.add(parent.slug);
      parentId = parent.parentId;
    }
  }

  return allowed;
}

/**
 * Hitung izin efektif sebuah role, termasuk warisan induk ← anak.
 *
 * Di-cache per-permintaan memakai `cache()` React sehingga berapa kali pun
 * dipanggil dalam satu render/aksi, query hanya dijalankan sekali.
 */
export const computeEffectivePermissions = cache(
  async (roleId: number, villageId: number | null): Promise<EffectivePermissions> => {
    const role = await findRoleById(roleId, villageId);

    if (!role) return EMPTY_PERMISSIONS;

    if (
      role.slug === SUPERADMIN_SLUG &&
      role.isSystem &&
      role.villageId === null &&
      villageId === null
    ) {
      return { isSuperadmin: true, levelByResource: new Map(), actionByResource: new Map() };
    }

    const [seluruhModul, levelById, actionsById, fiturPaket] = await Promise.all([
      listModules(villageId),
      listLevelsByRole(roleId, villageId),
      listActionsByRole(roleId, villageId),
      listPlanModuleSlugs(villageId),
    ]);
    const allowedModuleSlugs =
      fiturPaket === null ? undefined : perluasFiturPaket(seluruhModul, fiturPaket);
    // Keputusan produk: `is_active = false` berarti modul **tidak memberi akses**,
    // bukan sekadar disembunyikan dari menu. Grant lama tetap tersimpan, tetapi
    // tidak dihitung sampai modul diaktifkan lagi. `is_hidden` tetap murni
    // tampilan menu dan tidak memengaruhi izin.
    const seluruhModulAktif = seluruhModul.filter((modul) => modul.isActive);
    const modulDiizinkan =
      allowedModuleSlugs === undefined
        ? seluruhModulAktif
        : seluruhModulAktif.filter((modul) => allowedModuleSlugs.has(modul.slug));
    const actionByResource = new Map<string, ModuleActions>();
    const childrenByParent = new Map<number, number[]>();
    for (const modul of modulDiizinkan) {
      const parentId = modul.parentId ?? 0;
      if (parentId > 0)
        childrenByParent.set(parentId, [...(childrenByParent.get(parentId) ?? []), modul.id]);
      const actions = actionsById.get(modul.id);
      actionByResource.set(
        modul.slug,
        actions ?? { read: false, create: false, update: false, delete: false },
      );
    }
    // Menu induk hanya mendapat izin lihat jika setidaknya satu anak memang dapat dibaca.
    for (const modul of modulDiizinkan) {
      const childIds = childrenByParent.get(modul.id) ?? [];
      const childReadable = childIds.some((childId) => actionsById.get(childId)?.read === true);
      if (childReadable) {
        const current = actionByResource.get(modul.slug) ?? {
          read: false,
          create: false,
          update: false,
          delete: false,
        };
        actionByResource.set(modul.slug, { ...current, read: true });
      }
    }
    return {
      isSuperadmin: false,
      allowedModuleSlugs,
      levelByResource: applyParentInheritance(modulDiizinkan, levelById),
      actionByResource,
    };
  },
);

/** Apakah `permissions` mengizinkan `action` atas `resource`. */
export function hasPermission(
  permissions: EffectivePermissions,
  resource: string,
  action: Action,
): boolean {
  if (permissions.isSuperadmin) return true;
  if (resource === DEFAULT_RESOURCE) return action === "read";
  if (
    resource !== DEFAULT_RESOURCE &&
    permissions.allowedModuleSlugs !== undefined &&
    !permissions.allowedModuleSlugs.has(resource)
  ) {
    return false;
  }
  const actions = permissions.actionByResource.get(resource);
  if (actions) return actions[action];
  return levelAllows(permissions.levelByResource.get(resource), action);
}

/** Daftar slug resource yang boleh dibaca (untuk menyusun menu). */
export function readableResources(permissions: EffectivePermissions): Set<string> {
  const slugs = new Set<string>();

  for (const [slug, level] of permissions.levelByResource) {
    const actions = permissions.actionByResource.get(slug);
    if (actions ? actions.read : levelAllows(level, "read")) slugs.add(slug);
  }

  return slugs;
}
