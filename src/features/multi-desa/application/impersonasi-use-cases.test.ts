import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getKonteksImpersonasi,
  keluarDariImpersonasi,
  masukSebagaiAdminDesa,
} from "./impersonasi-use-cases";

const state = vi.hoisted(() => ({
  getImpersonationState: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  getImpersonationState: state.getImpersonationState,
}));
vi.mock("@/features/multi-desa/infrastructure/kelola-desa-repository", () => ({
  findAdminDesa: vi.fn(),
}));
vi.mock("@/features/multi-desa/infrastructure/pengguna-desa-repository", () => ({
  getPenggunaDesa: vi.fn(),
}));
vi.mock("@/features/multi-desa/infrastructure/impersonasi-repository", () => ({
  mulaiImpersonasi: vi.fn(),
  akhiriImpersonasi: vi.fn(),
  ambilInfoTargetImpersonasi: vi.fn(),
}));
vi.mock("@/features/pengaturan/audit/application/audit-use-cases", () => ({
  recordAuditEvent: vi.fn(),
}));
vi.mock("@/features/pengaturan/rbac/application/kontrak", () => ({
  getRoleById: vi.fn(),
}));

const impersonasiRepo = () => import("@/features/multi-desa/infrastructure/impersonasi-repository");
const kelolaRepo = () => import("@/features/multi-desa/infrastructure/kelola-desa-repository");
const penggunaRepo = () => import("@/features/multi-desa/infrastructure/pengguna-desa-repository");
const audit = () => import("@/features/pengaturan/audit/application/audit-use-cases");
const rbac = () => import("@/features/pengaturan/rbac/application/kontrak");

const sesiSuperAdmin = {
  sessionId: "sesi-1",
  ownerId: "platform-1",
  ownerVillageId: null,
  ownerRoleId: 9,
  impersonating: false,
  impersonatedVillageId: null,
  impersonatedUserId: null,
  impersonatedExpiresAt: null,
};

const adminDesa = {
  id: "admin-1",
  name: "Admin Desa",
  email: "admin@desa.id",
  username: "admin.desa",
  villageId: 3,
  villageName: "Desa Sukamaju",
  villageSlug: "sukamaju",
  roleName: "Administrator",
  roleSlug: "administrator",
  active: true,
  mustChangePin: false,
  lastLoginAt: null,
  createdAt: new Date("2026-01-01"),
  sesiAktif: 1,
};

beforeEach(async () => {
  vi.clearAllMocks();
  state.getImpersonationState.mockResolvedValue(sesiSuperAdmin);
  vi.mocked((await rbac()).getRoleById).mockResolvedValue({
    id: 9,
    name: "Super Admin",
    slug: "super-admin",
  } as never);
});

describe("masukSebagaiAdminDesa", () => {
  it("menolak sesi tanpa login", async () => {
    state.getImpersonationState.mockResolvedValue(null);

    await expect(masukSebagaiAdminDesa(3)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect((await impersonasiRepo()).mulaiImpersonasi).not.toHaveBeenCalled();
  });

  it("menolak akun desa: hanya pemilik sesi platform yang boleh impersonasi", async () => {
    state.getImpersonationState.mockResolvedValue({
      ...sesiSuperAdmin,
      ownerVillageId: 3,
      ownerRoleId: 5,
    });

    await expect(masukSebagaiAdminDesa(3)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await kelolaRepo()).findAdminDesa).not.toHaveBeenCalled();
  });

  it("menolak role yang bukan super-admin walau tidak terikat desa", async () => {
    vi.mocked((await rbac()).getRoleById).mockResolvedValue({
      id: 9,
      name: "Administrator",
      slug: "administrator",
    } as never);

    await expect(masukSebagaiAdminDesa(3)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await impersonasiRepo()).mulaiImpersonasi).not.toHaveBeenCalled();
  });

  it("menolak bila sesi sudah mengimpersonasi", async () => {
    state.getImpersonationState.mockResolvedValue({ ...sesiSuperAdmin, impersonating: true });

    await expect(masukSebagaiAdminDesa(3)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("menolak desa tanpa akun administrator", async () => {
    vi.mocked((await kelolaRepo()).findAdminDesa).mockResolvedValue(null);

    await expect(masukSebagaiAdminDesa(3)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("menolak administrator desa yang tidak aktif", async () => {
    vi.mocked((await kelolaRepo()).findAdminDesa).mockResolvedValue({
      id: "admin-1",
      username: "admin.desa",
      email: "admin@desa.id",
    });
    vi.mocked((await penggunaRepo()).getPenggunaDesa).mockResolvedValue({
      ...adminDesa,
      active: false,
    });

    await expect(masukSebagaiAdminDesa(3)).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await impersonasiRepo()).mulaiImpersonasi).not.toHaveBeenCalled();
  });

  it("menulis konteks sesi dan mencatat audit atas nama super admin asli", async () => {
    vi.mocked((await kelolaRepo()).findAdminDesa).mockResolvedValue({
      id: "admin-1",
      username: "admin.desa",
      email: "admin@desa.id",
    });
    vi.mocked((await penggunaRepo()).getPenggunaDesa).mockResolvedValue(adminDesa);

    const hasil = await masukSebagaiAdminDesa(3);

    expect(hasil.villageId).toBe(3);
    expect(hasil.targetUserId).toBe("admin-1");
    expect(hasil.username).toBe("admin.desa");

    expect((await impersonasiRepo()).mulaiImpersonasi).toHaveBeenCalledWith(
      "sesi-1",
      expect.objectContaining({ villageId: 3, userId: "admin-1", expiresAt: hasil.kadaluarsa }),
    );

    const auditCall = vi.mocked((await audit()).recordAuditEvent).mock.calls[0]?.[0];
    expect(auditCall).toMatchObject({
      villageId: 3,
      actorId: "platform-1",
      event: "impersonation.start",
      resource: "sessions",
      resourceId: "sesi-1",
    });
  });

  it("membatasi masa berlaku maksimal satu jam", async () => {
    vi.mocked((await kelolaRepo()).findAdminDesa).mockResolvedValue({
      id: "admin-1",
      username: "admin.desa",
      email: "admin@desa.id",
    });
    vi.mocked((await penggunaRepo()).getPenggunaDesa).mockResolvedValue(adminDesa);

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z").getTime());
    try {
      const hasil = await masukSebagaiAdminDesa(3);
      expect(hasil.kadaluarsa.getTime()).toBe(
        new Date("2026-01-01T00:00:00Z").getTime() + 60 * 60_000,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("menolak id desa yang tidak valid", async () => {
    await expect(masukSebagaiAdminDesa("abc")).rejects.toThrow();
    await expect(masukSebagaiAdminDesa(0)).rejects.toThrow();
    expect((await impersonasiRepo()).mulaiImpersonasi).not.toHaveBeenCalled();
  });
});

describe("keluarDariImpersonasi", () => {
  it("membersihkan konteks sesi dan mencatat audit", async () => {
    state.getImpersonationState.mockResolvedValue({
      ...sesiSuperAdmin,
      impersonating: true,
      impersonatedVillageId: 3,
      impersonatedUserId: "admin-1",
      impersonatedExpiresAt: new Date(Date.now() + 60_000),
    });

    await expect(keluarDariImpersonasi()).resolves.toEqual({ berakhir: true });

    expect((await impersonasiRepo()).akhiriImpersonasi).toHaveBeenCalledWith("sesi-1");
    expect((await audit()).recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        villageId: 3,
        actorId: "platform-1",
        event: "impersonation.end",
      }),
    );
  });

  it("tidak melakukan apa pun bila tidak sedang impersonasi", async () => {
    await expect(keluarDariImpersonasi()).resolves.toEqual({ berakhir: false });

    expect((await impersonasiRepo()).akhiriImpersonasi).not.toHaveBeenCalled();
    expect((await audit()).recordAuditEvent).not.toHaveBeenCalled();
  });
});

describe("getKonteksImpersonasi", () => {
  it("mengembalikan nama target dan desa untuk banner", async () => {
    state.getImpersonationState.mockResolvedValue({
      ...sesiSuperAdmin,
      impersonating: true,
      impersonatedVillageId: 3,
      impersonatedUserId: "admin-1",
      impersonatedExpiresAt: new Date("2026-11-27T09:00:00Z"),
    });
    vi.mocked((await impersonasiRepo()).ambilInfoTargetImpersonasi).mockResolvedValue({
      targetName: "Admin Desa",
      targetUsername: "admin.desa",
      villageName: "Desa Sukamaju",
    });

    await expect(getKonteksImpersonasi()).resolves.toEqual({
      villageId: 3,
      villageName: "Desa Sukamaju",
      targetName: "Admin Desa",
      targetUsername: "admin.desa",
      kadaluarsa: new Date("2026-11-27T09:00:00Z"),
    });
  });

  it("mengembalikan null bila sesi tidak mengimpersonasi", async () => {
    await expect(getKonteksImpersonasi()).resolves.toBeNull();
    expect((await impersonasiRepo()).ambilInfoTargetImpersonasi).not.toHaveBeenCalled();
  });
});
