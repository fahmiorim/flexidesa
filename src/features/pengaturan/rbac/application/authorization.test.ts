import { beforeEach, describe, expect, it, vi } from "vitest";

import * as repository from "@/features/pengaturan/rbac/infrastructure/rbac-repository";

import { computeEffectivePermissions, hasPermission } from "./authorization";

const mocks = vi.hoisted(() => ({ listPlanModuleSlugs: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: <T>(fn: T): T => fn }));
vi.mock("@/features/pengaturan/rbac/infrastructure/rbac-repository", () => ({
  findRoleById: vi.fn(),
  listActionsByRole: vi.fn(),
  listLevelsByRole: vi.fn(),
  listModules: vi.fn(),
  listPlanModuleSlugs: mocks.listPlanModuleSlugs,
}));

const role = (overrides: Partial<repository.RoleRecord>): repository.RoleRecord => ({
  id: 1,
  villageId: 7,
  slug: "operator",
  name: "Operator",
  isSystem: false,
  ...overrides,
});

const EMPTY = { isSuperadmin: false, levelByResource: new Map(), actionByResource: new Map() };

describe("computeEffectivePermissions kepemilikan tenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repository.listModules).mockResolvedValue([]);
    vi.mocked(repository.listLevelsByRole).mockResolvedValue(new Map());
    vi.mocked(repository.listActionsByRole).mockResolvedValue(new Map());
    mocks.listPlanModuleSlugs.mockResolvedValue(null);
  });

  it("memuat izin role desa dengan villageId sesi", async () => {
    vi.mocked(repository.findRoleById).mockResolvedValue(role({ villageId: 7 }));

    const result = await computeEffectivePermissions(1, 7);

    expect(result.isSuperadmin).toBe(false);
    expect(repository.findRoleById).toHaveBeenCalledWith(1, 7);
    expect(repository.listModules).toHaveBeenCalledWith(7);
    expect(repository.listLevelsByRole).toHaveBeenCalledWith(1, 7);
    expect(repository.listActionsByRole).toHaveBeenCalledWith(1, 7);
  });

  it("tidak memuat izin saat role tidak ditemukan pada desa sesi", async () => {
    vi.mocked(repository.findRoleById).mockResolvedValue(null);

    const result = await computeEffectivePermissions(1, 7);

    expect(result).toEqual(EMPTY);
    expect(repository.listModules).not.toHaveBeenCalled();
    expect(repository.listLevelsByRole).not.toHaveBeenCalled();
    expect(repository.listActionsByRole).not.toHaveBeenCalled();
  });

  it("tidak menjadikan role administrator desa sebagai superadmin", async () => {
    vi.mocked(repository.findRoleById).mockResolvedValue(
      role({ slug: "administrator", isSystem: true, villageId: 7 }),
    );

    const result = await computeEffectivePermissions(1, 7);

    expect(result.isSuperadmin).toBe(false);
    expect(repository.listModules).toHaveBeenCalledWith(7);
  });

  it("hanya mengakui superadmin platform dengan villageId null", async () => {
    vi.mocked(repository.findRoleById).mockResolvedValue(
      role({ slug: "administrator", isSystem: true, villageId: null }),
    );

    const result = await computeEffectivePermissions(1, null);

    expect(result.isSuperadmin).toBe(true);
    expect(repository.listModules).not.toHaveBeenCalled();
  });
  it("menghapus modul di luar paket sebelum izin role dihitung", async () => {
    vi.mocked(repository.findRoleById).mockResolvedValue(role({ villageId: 7 }));
    vi.mocked(repository.listModules).mockResolvedValue([
      {
        id: 1,
        parentId: null,
        slug: "kependudukan",
        name: "Kependudukan",
        url: null,
        icon: null,
        sortOrder: 1,
        isGroup: true,
        isHidden: false,
        isActive: true,
      },
      {
        id: 2,
        parentId: 1,
        slug: "penduduk",
        name: "Penduduk",
        url: "/kependudukan/penduduk",
        icon: null,
        sortOrder: 1,
        isGroup: false,
        isHidden: false,
        isActive: true,
      },
      {
        id: 3,
        parentId: null,
        slug: "keuangan",
        name: "Keuangan",
        url: "/keuangan",
        icon: null,
        sortOrder: 2,
        isGroup: false,
        isHidden: false,
        isActive: true,
      },
    ]);
    vi.mocked(repository.listLevelsByRole).mockResolvedValue(
      new Map([
        [1, "read"],
        [2, "read"],
        [3, "manage"],
      ]),
    );
    vi.mocked(repository.listActionsByRole).mockResolvedValue(
      new Map([
        [2, { read: true, create: false, update: false, delete: false }],
        [3, { read: true, create: true, update: true, delete: true }],
      ]),
    );
    mocks.listPlanModuleSlugs.mockResolvedValue(new Set(["penduduk"]));

    const permissions = await computeEffectivePermissions(1, 7);

    expect(mocks.listPlanModuleSlugs).toHaveBeenCalledWith(7);
    expect(hasPermission(permissions, "penduduk", "read")).toBe(true);
    expect(hasPermission(permissions, "kependudukan", "read")).toBe(true);
    expect(hasPermission(permissions, "keuangan", "read")).toBe(false);
  });

  it("modul nonaktif tidak memberi akses walau grant tersimpan", async () => {
    vi.mocked(repository.findRoleById).mockResolvedValue(role({ villageId: 7 }));
    vi.mocked(repository.listModules).mockResolvedValue([
      {
        id: 1,
        parentId: null,
        slug: "arsip",
        name: "Arsip",
        url: "/arsip",
        icon: null,
        sortOrder: 1,
        isGroup: false,
        isHidden: false,
        isActive: false,
      },
      {
        id: 2,
        parentId: null,
        slug: "bumindes",
        name: "BUMINDES",
        url: "/bumindes",
        icon: null,
        sortOrder: 2,
        isGroup: false,
        isHidden: true,
        isActive: true,
      },
    ]);
    vi.mocked(repository.listLevelsByRole).mockResolvedValue(
      new Map([
        [1, "manage"],
        [2, "manage"],
      ]),
    );
    vi.mocked(repository.listActionsByRole).mockResolvedValue(
      new Map([[2, { read: true, create: false, update: false, delete: false }]]),
    );
    mocks.listPlanModuleSlugs.mockResolvedValue(null);

    const permissions = await computeEffectivePermissions(1, 7);

    expect(hasPermission(permissions, "arsip", "read")).toBe(false);
    // `is_hidden` hanya menyembunyikan menu; izinnya tetap berlaku.
    expect(hasPermission(permissions, "bumindes", "read")).toBe(true);
  });
});

describe("hasPermission granular CRUD", () => {
  it("membatasi tambah, ubah, hapus, dan lihat secara independen", () => {
    const permissions = {
      isSuperadmin: false,
      levelByResource: new Map([["penduduk", "write" as const]]),
      actionByResource: new Map([
        ["penduduk", { read: false, create: true, update: false, delete: false }],
      ]),
    };
    expect(hasPermission(permissions, "penduduk", "create")).toBe(true);
    expect(hasPermission(permissions, "penduduk", "read")).toBe(false);
    expect(hasPermission(permissions, "penduduk", "update")).toBe(false);
    expect(hasPermission(permissions, "penduduk", "delete")).toBe(false);
  });
  it("membatasi izin role pada fitur yang termasuk dalam paket desa", () => {
    const permissions = {
      isSuperadmin: false,
      levelByResource: new Map([
        ["penduduk", "read" as const],
        ["keuangan", "manage" as const],
      ]),
      actionByResource: new Map([
        ["penduduk", { read: true, create: false, update: false, delete: false }],
        ["keuangan", { read: true, create: true, update: true, delete: true }],
      ]),
      allowedModuleSlugs: new Set(["penduduk"]),
    };

    expect(hasPermission(permissions, "penduduk", "read")).toBe(true);
    expect(hasPermission(permissions, "keuangan", "read")).toBe(false);
    expect(hasPermission(permissions, "beranda", "read")).toBe(true);
  });
});
