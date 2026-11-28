import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cabutSesiPenggunaDesaDesa,
  daftarPenggunaDesa,
  daftarPenggunaSatuDesa,
  jumlahPenggunaDesa,
  resetSandiPenggunaDesaDesa,
  ubahStatusPenggunaDesaDesa,
} from "./pengguna-desa-use-cases";

vi.mock("./provisioning-use-cases", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("@/features/pengaturan/audit/application/audit-use-cases", () => ({
  recordAuditEvent: vi.fn(),
}));
vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn(async (sandi: string) => `hash:${sandi}`),
}));
vi.mock("@/features/multi-desa/infrastructure/pengguna-desa-repository", () => ({
  listPenggunaDesa: vi.fn(),
  getPenggunaDesa: vi.fn(),
  hitungPenggunaDesa: vi.fn(),
  setStatusPenggunaDesa: vi.fn(),
  resetSandiPenggunaDesa: vi.fn(),
  cabutSesiPenggunaDesa: vi.fn(),
}));

const platformUser = { id: "platform-1", villageId: null } as never;

const repository = () => import("@/features/multi-desa/infrastructure/pengguna-desa-repository");
const guard = () => import("./provisioning-use-cases");
const audit = () => import("@/features/pengaturan/audit/application/audit-use-cases");

const penggunaDesa = {
  id: "u-1",
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
  sesiAktif: 2,
};

function tolakBukanPlatform() {
  return Object.assign(new Error("Hanya super admin yang boleh mengelola desa."), {
    code: "FORBIDDEN",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("daftarPenggunaDesa", () => {
  it("menolak pembacaan oleh pengguna yang bukan pengelola platform", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockRejectedValue(tolakBukanPlatform());

    await expect(daftarPenggunaDesa()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await repository()).listPenggunaDesa).not.toHaveBeenCalled();
  });

  it("meneruskan filter q, desa, dan status aktif ke repository", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await repository()).listPenggunaDesa).mockResolvedValue([penggunaDesa]);

    await expect(daftarPenggunaDesa({ q: "suka", villageId: 3, aktif: "aktif" })).resolves.toEqual([
      penggunaDesa,
    ]);

    expect((await repository()).listPenggunaDesa).toHaveBeenCalledWith({
      q: "suka",
      villageId: 3,
      aktif: true,
    });
  });

  it("memakai filter nonaktif dan mengabaikan status tak dikenal", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await repository()).listPenggunaDesa).mockResolvedValue([]);

    await daftarPenggunaDesa({ aktif: "nonaktif" });
    expect((await repository()).listPenggunaDesa).toHaveBeenLastCalledWith({
      q: undefined,
      villageId: undefined,
      aktif: false,
    });

    await daftarPenggunaDesa({ aktif: "semua" });
    expect((await repository()).listPenggunaDesa).toHaveBeenLastCalledWith({
      q: undefined,
      villageId: undefined,
    });
  });
});

describe("daftarPenggunaSatuDesa dan jumlahPenggunaDesa", () => {
  it("membaca hanya akun desa satu tenant setelah guard lolos", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await repository()).listPenggunaDesa).mockResolvedValue([penggunaDesa]);
    vi.mocked((await repository()).hitungPenggunaDesa).mockResolvedValue(5);

    await expect(daftarPenggunaSatuDesa(3)).resolves.toEqual([penggunaDesa]);
    expect((await repository()).listPenggunaDesa).toHaveBeenCalledWith({ villageId: 3 });

    await expect(jumlahPenggunaDesa(3)).resolves.toBe(5);
    expect((await repository()).hitungPenggunaDesa).toHaveBeenCalledWith(3);
  });

  it("menolak pembacaan jumlah oleh bukan pengelola platform", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockRejectedValue(tolakBukanPlatform());

    await expect(jumlahPenggunaDesa(3)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await repository()).hitungPenggunaDesa).not.toHaveBeenCalled();
  });
});

describe("ubahStatusPenggunaDesaDesa", () => {
  it("menolak mutasi oleh bukan pengelola platform tanpa menyentuh repository", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockRejectedValue(tolakBukanPlatform());

    await expect(ubahStatusPenggunaDesaDesa({ id: "u-1", active: "false" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect((await repository()).setStatusPenggunaDesa).not.toHaveBeenCalled();
    expect((await audit()).recordAuditEvent).not.toHaveBeenCalled();
  });

  it("menonaktifkan akun desa dan mencatat audit dengan villageId pemilik akun", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await repository()).getPenggunaDesa).mockResolvedValue(penggunaDesa);

    await expect(ubahStatusPenggunaDesaDesa({ id: "u-1", active: "false" })).resolves.toEqual({
      active: false,
    });

    expect((await repository()).setStatusPenggunaDesa).toHaveBeenCalledWith("u-1", false);
    expect((await audit()).recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        villageId: 3,
        actorId: "platform-1",
        event: "platform.user.status",
        resource: "users",
        resourceId: "u-1",
      }),
    );
  });

  it("menolak id akun yang bukan akun desa (akun platform)", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await repository()).getPenggunaDesa).mockResolvedValue(null);

    await expect(
      ubahStatusPenggunaDesaDesa({ id: "platform-1", active: "false" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await repository()).setStatusPenggunaDesa).not.toHaveBeenCalled();
  });
});

describe("resetSandiPenggunaDesaDesa", () => {
  it("mengembalikan sandi sementara dan tidak menyimpannya di audit", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await repository()).getPenggunaDesa).mockResolvedValue(penggunaDesa);

    const hasil = await resetSandiPenggunaDesaDesa("u-1");

    expect(hasil.username).toBe("admin.desa");
    expect(hasil.email).toBe("admin@desa.id");
    expect(hasil.sandiSementara).toHaveLength(12);
    expect((await repository()).resetSandiPenggunaDesa).toHaveBeenCalledWith(
      "u-1",
      `hash:${hasil.sandiSementara}`,
    );
    expect(JSON.stringify(vi.mocked((await audit()).recordAuditEvent).mock.calls)).not.toContain(
      hasil.sandiSementara,
    );
    expect((await audit()).recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ villageId: 3, event: "platform.user.reset" }),
    );
  });

  it("menolak akun yang tidak ditemukan", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await repository()).getPenggunaDesa).mockResolvedValue(null);

    await expect(resetSandiPenggunaDesaDesa("tidak-ada")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect((await repository()).resetSandiPenggunaDesa).not.toHaveBeenCalled();
  });
});

describe("cabutSesiPenggunaDesaDesa", () => {
  it("mencabut sesi akun desa dan mencatat audit jumlahnya", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await repository()).getPenggunaDesa).mockResolvedValue(penggunaDesa);
    vi.mocked((await repository()).cabutSesiPenggunaDesa).mockResolvedValue(2);

    await expect(cabutSesiPenggunaDesaDesa("u-1")).resolves.toEqual({ jumlah: 2 });
    expect((await repository()).cabutSesiPenggunaDesa).toHaveBeenCalledWith("u-1");
    expect((await audit()).recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        villageId: 3,
        event: "platform.user.session.revoke",
        resource: "sessions",
      }),
    );
  });
});
