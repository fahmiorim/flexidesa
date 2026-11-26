import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import {
  modules,
  rolePermissions,
  roles,
  subscriptionPlanFeatures,
  subscriptionPlans,
  subscriptionPlanVersions,
  villagePlanSubscriptions,
  villages,
} from "@/db/schema";
import { computeEffectivePermissions } from "@/features/pengaturan/rbac/application/authorization";
import {
  deleteRole,
  getRoleById,
  listLevelsByRole,
  setRolePermissions,
  updateRole,
} from "@/features/pengaturan/rbac/infrastructure/rbac-repository";
import { siapkanDatabaseUji } from "@/testing/migrasi-uji";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../../../db/migrations", import.meta.url));
const RUN = randomUUID().slice(0, 8);

interface Fixture {
  villageA: number;
  villageB: number;
  roleA: number;
  roleB: number;
  moduleA: number;
  moduleB: number;
  moduleC: number;
  globalAdmin: number;
  planId: number;
  planVersionId: number;
}

let fixture: Fixture | null = null;

function pastiId(row: { id: number | undefined } | undefined, label: string): number {
  if (row?.id === undefined) throw new Error(`Seed uji gagal: ${label}`);
  return row.id;
}

async function seedFixture(): Promise<Fixture> {
  const [villageARow] = await db
    .insert(villages)
    .values({ name: `Desa RBAC A ${RUN}`, code: `RBA${RUN}`.slice(0, 10) })
    .$returningId();
  const [villageBRow] = await db
    .insert(villages)
    .values({ name: `Desa RBAC B ${RUN}`, code: `RBB${RUN}`.slice(0, 10) })
    .$returningId();
  const villageA = pastiId(villageARow, "village A");
  const villageB = pastiId(villageBRow, "village B");

  const [roleARow] = await db
    .insert(roles)
    .values({ villageId: villageA, name: `Role A ${RUN}`, slug: `role-a-${RUN}` })
    .$returningId();
  const [roleBRow] = await db
    .insert(roles)
    .values({ villageId: villageB, name: `Role B ${RUN}`, slug: `role-b-${RUN}` })
    .$returningId();
  // Slug role global wajib unik (migrasi 0006), sementara beberapa berkas
  // integrasi memakai database uji yang sama. Pakai role global yang sudah ada
  // bila tersedia; role sistem ini bukan milik satu berkas test.
  const [globalAdminLama] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(isNull(roles.villageId), eq(roles.slug, "administrator"), eq(roles.isSystem, true)))
    .limit(1);
  let globalAdmin = globalAdminLama?.id;
  if (globalAdmin === undefined) {
    const [globalAdminRow] = await db
      .insert(roles)
      .values({
        villageId: null,
        name: "Administrator",
        slug: "administrator",
        isSystem: true,
      })
      .$returningId();
    globalAdmin = pastiId(globalAdminRow, "global administrator");
  }

  const [moduleARow] = await db
    .insert(modules)
    .values({ villageId: villageA, name: `Modul A ${RUN}`, slug: `modul-a-${RUN}` })
    .$returningId();
  const [moduleBRow] = await db
    .insert(modules)
    .values({ villageId: villageB, name: `Modul Rahasia B ${RUN}`, slug: `modul-b-${RUN}` })
    .$returningId();
  const [moduleCRow] = await db
    .insert(modules)
    .values({ villageId: villageA, name: `Modul C ${RUN}`, slug: `modul-c-${RUN}` })
    .$returningId();

  const roleA = pastiId(roleARow, "role A");
  const roleB = pastiId(roleBRow, "role B");
  const moduleA = pastiId(moduleARow, "module A");
  const moduleB = pastiId(moduleBRow, "module B");
  const moduleC = pastiId(moduleCRow, "module C");
  const [planRow] = await db
    .insert(subscriptionPlans)
    .values({ slug: `paket-rbac-${RUN}`, name: `Paket RBAC ${RUN}` })
    .$returningId();
  const planId = pastiId(planRow, "plan");
  const [planVersionRow] = await db
    .insert(subscriptionPlanVersions)
    .values({ planId, version: 1, status: "published" })
    .$returningId();
  const planVersionId = pastiId(planVersionRow, "plan version");
  await db.insert(subscriptionPlanFeatures).values({
    planVersionId,
    moduleSlug: `modul-a-${RUN}`,
  });
  await db.insert(villagePlanSubscriptions).values({ villageId: villageA, planVersionId });

  await db.insert(rolePermissions).values({
    roleId: roleA,
    moduleId: moduleA,
    access: "read",
  });
  await db.insert(rolePermissions).values({
    roleId: roleA,
    moduleId: moduleC,
    access: "manage",
  });
  // Grant lintas tenant tidak lagi dapat disisipkan: migrasi 0006 menolaknya di
  // database, sehingga tidak ada data legacy semacam itu yang perlu difilter
  // oleh repository.

  return {
    villageA,
    villageB,
    roleA,
    roleB,
    moduleA,
    moduleB,
    moduleC,
    globalAdmin,
    planId,
    planVersionId,
  };
}

beforeAll(async () => {
  await siapkanDatabaseUji(db, { migrationsFolder: MIGRATIONS_FOLDER });
  fixture = await seedFixture();
});

afterAll(async () => {
  if (!fixture) return;
  // Role global administrator dipakai bersama berkas test lain; jangan dihapus.
  const roleIds = [fixture.roleA, fixture.roleB];
  const moduleIds = [fixture.moduleA, fixture.moduleB, fixture.moduleC];
  await db.delete(rolePermissions).where(inArray(rolePermissions.roleId, roleIds));
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, fixture.globalAdmin));
  await db.delete(modules).where(inArray(modules.id, moduleIds));
  await db
    .delete(villagePlanSubscriptions)
    .where(eq(villagePlanSubscriptions.villageId, fixture.villageA));
  await db
    .delete(subscriptionPlanFeatures)
    .where(eq(subscriptionPlanFeatures.planVersionId, fixture.planVersionId));
  await db
    .delete(subscriptionPlanVersions)
    .where(eq(subscriptionPlanVersions.id, fixture.planVersionId));
  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, fixture.planId));
  await db.delete(roles).where(inArray(roles.id, roleIds));
  await db.delete(modules).where(inArray(modules.id, moduleIds));
  await db.delete(villages).where(inArray(villages.id, [fixture.villageA, fixture.villageB]));
});

describe("isolasi tenant repository dan authorization RBAC", () => {
  it("membatasi role, modul, dan permission efektif pada tenant yang aktif", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    expect(await getRoleById(current.roleA, current.villageB)).toBeNull();
    expect(await getRoleById(current.roleA, current.villageA)).not.toBeNull();

    const levels = await listLevelsByRole(current.roleA, current.villageA);
    expect(levels.get(current.moduleA)).toBe("read");
    expect(levels.has(current.moduleB)).toBe(false);

    const permissionsA = await computeEffectivePermissions(current.roleA, current.villageA);
    expect(permissionsA.levelByResource.has(`modul-a-${RUN}`)).toBe(true);
    expect(permissionsA.levelByResource.has(`modul-b-${RUN}`)).toBe(false);
    expect(levels.get(current.moduleC)).toBe("manage");
    expect(permissionsA.levelByResource.has(`modul-c-${RUN}`)).toBe(false);

    const permissionsWrongTenant = await computeEffectivePermissions(
      current.roleB,
      current.villageA,
    );
    expect(permissionsWrongTenant.levelByResource.size).toBe(0);

    const adminForTenant = await computeEffectivePermissions(current.globalAdmin, current.villageA);
    expect(adminForTenant.isSuperadmin).toBe(false);
    const globalAdmin = await computeEffectivePermissions(current.globalAdmin, null);
    expect(globalAdmin.isSuperadmin).toBe(true);
  });

  it("menolak menyimpan permission modul desa lain dan membatasi update/delete role", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    await expect(
      setRolePermissions(current.villageA, current.roleA, [
        {
          moduleId: current.moduleB,
          access: "manage",
          read: true,
          create: true,
          update: true,
          delete: true,
        },
      ]),
    ).rejects.toThrow(/modul tidak ditemukan pada desa aktif/);

    const afterRejectedWrite = await listLevelsByRole(current.roleA, current.villageA);
    expect(afterRejectedWrite.get(current.moduleA)).toBe("read");
    expect(afterRejectedWrite.has(current.moduleB)).toBe(false);

    await updateRole(current.villageB, current.roleA, { name: `Tidak Boleh Diubah ${RUN}` });
    await deleteRole(current.villageB, current.roleA);

    const role = await getRoleById(current.roleA, current.villageA);
    expect(role?.name).toBe(`Role A ${RUN}`);
  });
});
