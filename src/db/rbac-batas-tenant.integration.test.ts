import { fileURLToPath } from "node:url";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { modules, rolePermissions, roles, villages } from "@/db/schema";
import { siapkanDatabaseUji } from "@/testing/migrasi-uji";

/**
 * Migrasi `0006_rbac_batas_tenant_dan_slug_global.sql` menjaga dua aturan yang
 * tidak dapat dinyatakan sebagai unique index biasa:
 *
 * 1. `role_permissions` tidak boleh menautkan role dan modul dari dua tenant
 *    berbeda; entity global (`village_id IS NULL`) boleh dipakai tenant mana pun.
 * 2. Slug role/modul global wajib unik walau `village_id` bernilai NULL.
 *
 * Test ini menulis lewat SQL/Drizzle langsung untuk membuktikan constraint ada
 * di database, bukan hanya di repository.
 */
const MIGRATIONS_FOLDER = fileURLToPath(new URL("./migrations", import.meta.url));
const RUN = String(Date.now()).slice(-7);

interface Fixture {
  desaA: number;
  desaB: number;
  roleA: number;
  roleB: number;
  roleGlobal: number;
  modulA: number;
  modulB: number;
  modulGlobal: number;
}

let fixture: Fixture | null = null;

function dataUji(): Fixture {
  if (fixture === null) throw new Error("Fixture integrasi belum siap.");
  return fixture;
}

function idDari(row: { id: number } | undefined, label: string): number {
  if (row?.id === undefined) throw new Error(`Seed gagal: ${label}.`);
  return row.id;
}

/** Kode galat MySQL/MariaDB terdalam, termasuk yang dibungkus Drizzle. */
async function kodeGalat(upaya: () => Promise<unknown>): Promise<unknown> {
  let current: unknown;
  try {
    await upaya();
  } catch (error) {
    current = error;
  }
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth += 1) {
    const item = current as { code?: unknown; errno?: unknown; cause?: unknown };
    const code = item.code ?? item.errno;
    if (code !== undefined) return code;
    current = item.cause;
  }
  return undefined;
}

beforeAll(async () => {
  await siapkanDatabaseUji(db, { migrationsFolder: MIGRATIONS_FOLDER });

  const [desaARow] = await db
    .insert(villages)
    .values({ name: `Desa RBAC A ${RUN}`, code: `RBA${RUN.slice(-4)}` })
    .$returningId();
  const [desaBRow] = await db
    .insert(villages)
    .values({ name: `Desa RBAC B ${RUN}`, code: `RBB${RUN.slice(-4)}` })
    .$returningId();
  const desaA = idDari(desaARow, "desa A");
  const desaB = idDari(desaBRow, "desa B");

  const [roleARow] = await db
    .insert(roles)
    .values({ villageId: desaA, name: `Role A ${RUN}`, slug: `role-a-${RUN}` })
    .$returningId();
  const [roleBRow] = await db
    .insert(roles)
    .values({ villageId: desaB, name: `Role B ${RUN}`, slug: `role-b-${RUN}` })
    .$returningId();
  const [roleGlobalRow] = await db
    .insert(roles)
    .values({ villageId: null, name: `Role Global ${RUN}`, slug: `role-global-${RUN}` })
    .$returningId();

  const [modulARow] = await db
    .insert(modules)
    .values({ villageId: desaA, slug: `modul-a-${RUN}`, name: `Modul A ${RUN}` })
    .$returningId();
  const [modulBRow] = await db
    .insert(modules)
    .values({ villageId: desaB, slug: `modul-b-${RUN}`, name: `Modul B ${RUN}` })
    .$returningId();
  const [modulGlobalRow] = await db
    .insert(modules)
    .values({ villageId: null, slug: `modul-global-${RUN}`, name: `Modul Global ${RUN}` })
    .$returningId();

  fixture = {
    desaA,
    desaB,
    roleA: idDari(roleARow, "role A"),
    roleB: idDari(roleBRow, "role B"),
    roleGlobal: idDari(roleGlobalRow, "role global"),
    modulA: idDari(modulARow, "modul A"),
    modulB: idDari(modulBRow, "modul B"),
    modulGlobal: idDari(modulGlobalRow, "modul global"),
  };
});

afterAll(async () => {
  if (fixture === null) return;
  const current = fixture;
  await db
    .delete(rolePermissions)
    .where(inArray(rolePermissions.roleId, [current.roleA, current.roleB, current.roleGlobal]));
  await db
    .delete(modules)
    .where(inArray(modules.id, [current.modulA, current.modulB, current.modulGlobal]));
  await db
    .delete(roles)
    .where(inArray(roles.id, [current.roleA, current.roleB, current.roleGlobal]));
  await db.delete(villages).where(inArray(villages.id, [current.desaA, current.desaB]));
});

describe("role_permissions: batas tenant", () => {
  it("menerima role dan modul dari desa yang sama", async () => {
    const current = dataUji();
    await expect(
      db
        .insert(rolePermissions)
        .values({ roleId: current.roleA, moduleId: current.modulA, access: "read", canRead: true }),
    ).resolves.toBeDefined();
  });

  it("menerima role desa dengan modul global", async () => {
    const current = dataUji();
    const [grant] = await db
      .insert(rolePermissions)
      .values({
        roleId: current.roleA,
        moduleId: current.modulGlobal,
        access: "read",
        canRead: true,
      })
      .$returningId();
    expect(idDari(grant, "grant uji")).toBeGreaterThan(0);

    // Grant dibersihkan agar test berikutnya dapat memakai kombinasi role/modul
    // yang sama tanpa bentrok dengan unique key role_module_uq.
    await db.delete(rolePermissions).where(eq(rolePermissions.id, idDari(grant, "grant uji")));
  });

  it("menolak role desa dengan modul desa lain", async () => {
    const current = dataUji();
    const code = await kodeGalat(() =>
      db
        .insert(rolePermissions)
        .values({ roleId: current.roleA, moduleId: current.modulB, access: "read", canRead: true }),
    );
    expect(code).toBe("ER_SIGNAL_EXCEPTION");
  });

  it("menolak update grant menjadi kombinasi dua tenant berbeda", async () => {
    const current = dataUji();
    const [grant] = await db
      .insert(rolePermissions)
      .values({
        roleId: current.roleA,
        moduleId: current.modulGlobal,
        access: "read",
        canRead: true,
      })
      .$returningId();
    const grantId = idDari(grant, "grant uji");

    const code = await kodeGalat(() =>
      db
        .update(rolePermissions)
        .set({ moduleId: current.modulB })
        .where(eq(rolePermissions.id, grantId)),
    );
    expect(code).toBe("ER_SIGNAL_EXCEPTION");

    await db.delete(rolePermissions).where(eq(rolePermissions.id, grantId));
  });
});

describe("slug global: wajib unik", () => {
  it("menolak role global dengan slug yang sudah dipakai", async () => {
    const current = dataUji();
    const [baris] = await db
      .select({ slug: roles.slug })
      .from(roles)
      .where(eq(roles.id, current.roleGlobal));
    const slug = baris?.slug;
    if (!slug) throw new Error("Role global uji tidak ditemukan.");

    const code = await kodeGalat(() =>
      db.insert(roles).values({ villageId: null, name: `Duplikat ${RUN}`, slug }),
    );
    expect(code).toBe("ER_SIGNAL_EXCEPTION");
  });

  it("menolak modul global dengan slug yang sudah dipakai", async () => {
    const current = dataUji();
    const [baris] = await db
      .select({ slug: modules.slug })
      .from(modules)
      .where(eq(modules.id, current.modulGlobal));
    const slug = baris?.slug;
    if (!slug) throw new Error("Modul global uji tidak ditemukan.");

    const code = await kodeGalat(() =>
      db.insert(modules).values({ villageId: null, slug, name: `Duplikat ${RUN}` }),
    );
    expect(code).toBe("ER_SIGNAL_EXCEPTION");
  });

  it("tetap mengizinkan slug yang sama pada desa berbeda", async () => {
    const slug = `slug-bersama-${RUN}`;
    const [a] = await db
      .insert(modules)
      .values({ villageId: dataUji().desaA, slug, name: `Bersama A ${RUN}` })
      .$returningId();
    const [b] = await db
      .insert(modules)
      .values({ villageId: dataUji().desaB, slug, name: `Bersama B ${RUN}` })
      .$returningId();
    expect(idDari(a, "modul bersama A")).not.toBe(idDari(b, "modul bersama B"));

    await db
      .delete(modules)
      .where(inArray(modules.id, [idDari(a, "modul bersama A"), idDari(b, "modul bersama B")]));
  });
});
