import { beforeEach, describe, expect, it, vi } from "vitest";

import { ambilDetailTenant } from "./tenant-detail-use-cases";

vi.mock("@/features/multi-desa/application/audit-platform-use-cases", () => ({
  ambilAuditPlatform: vi.fn(),
}));
vi.mock("@/features/multi-desa/application/kelola-desa-use-cases", () => ({
  daftarSemuaDomain: vi.fn(),
}));
vi.mock("@/features/multi-desa/application/paket-langganan-use-cases", () => ({
  daftarPenetapanPaketPlatform: vi.fn(),
}));
vi.mock("@/features/multi-desa/application/pengguna-desa-use-cases", () => ({
  daftarPenggunaSatuDesa: vi.fn(),
}));
vi.mock("@/features/multi-desa/application/provisioning-use-cases", () => ({
  daftarDesaSuperAdmin: vi.fn(),
  requireSuperAdmin: vi.fn(),
}));

const platformUser = { id: "platform-1", villageId: null } as never;

const guard = () => import("@/features/multi-desa/application/provisioning-use-cases");
const desaRepo = () => import("@/features/multi-desa/application/provisioning-use-cases");
const domainUseCase = () => import("@/features/multi-desa/application/kelola-desa-use-cases");
const paketUseCase = () => import("@/features/multi-desa/application/paket-langganan-use-cases");
const penggunaUseCase = () => import("@/features/multi-desa/application/pengguna-desa-use-cases");
const auditUseCase = () => import("@/features/multi-desa/application/audit-platform-use-cases");

const desaDasar = {
  slug: "sukamaju",
  code: "1207012001",
  domain: "sukamaju.localhost",
  district: "Cibadak",
  regency: "Sukabumi",
  active: true,
  kuotaMediaMb: null,
  tema: "tegar",
  temaNama: "Tegar",
  temaVersi: "1.0.0",
  pengguna: 1,
  penduduk: 10,
  jenisSurat: 0,
  createdAt: new Date("2026-01-01"),
  nonaktifSejak: null,
  purgedAt: null,
  adaEksporBerlaku: false,
};

const desa = { ...desaDasar, id: 3, name: "Desa Sukamaju" };
const desaLain = { ...desaDasar, id: 4, name: "Desa Lain" };

const domain = [
  { id: 7, villageId: 3, domain: "sukamaju.localhost", isPrimary: true, createdAt: new Date() },
  { id: 8, villageId: 4, domain: "lain.localhost", isPrimary: true, createdAt: new Date() },
];

const paket = [
  {
    villageId: 3,
    name: "Desa Sukamaju",
    code: null,
    active: true,
    planVersionId: 9,
    planSlug: "standar",
    planName: "Standar",
    planVersion: 2,
  },
];

const pengguna = [
  {
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
    sesiAktif: 1,
  },
];

const audit = { rows: [], total: 0, page: 1, pageSize: 25, pageCount: 0 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ambilDetailTenant", () => {
  it("menolak pembacaan oleh bukan pengelola platform sebelum membaca sumber data", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockRejectedValue(
      Object.assign(new Error("Hanya super admin yang boleh mengelola desa."), {
        code: "FORBIDDEN",
      }),
    );

    await expect(ambilDetailTenant(3)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(vi.mocked((await desaRepo()).daftarDesaSuperAdmin)).not.toHaveBeenCalled();
    expect(vi.mocked((await domainUseCase()).daftarSemuaDomain)).not.toHaveBeenCalled();
  });

  it("mengagregat desa, domain, paket, pengguna, dan audit untuk tenant yang diminta", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await desaRepo()).daftarDesaSuperAdmin).mockResolvedValue([desa, desaLain]);
    vi.mocked((await domainUseCase()).daftarSemuaDomain).mockResolvedValue(domain);
    vi.mocked((await paketUseCase()).daftarPenetapanPaketPlatform).mockResolvedValue(paket);
    vi.mocked((await penggunaUseCase()).daftarPenggunaSatuDesa).mockResolvedValue(pengguna);
    vi.mocked((await auditUseCase()).ambilAuditPlatform).mockResolvedValue(audit);

    const hasil = await ambilDetailTenant(3);

    expect(hasil.desa.id).toBe(3);
    expect(hasil.statusRetensi).toBe("aktif");
    expect(hasil.hariMenujuPurge).toBeNull();
    expect(hasil.domain.map((item) => item.id)).toEqual([7]);
    expect(hasil.paket).toEqual({ slug: "standar", nama: "Standar", versi: 2 });
    expect(hasil.pengguna).toHaveLength(1);
    expect(hasil.audit).toBe(audit);

    expect((await penggunaUseCase()).daftarPenggunaSatuDesa).toHaveBeenCalledWith(3);
    expect((await auditUseCase()).ambilAuditPlatform).toHaveBeenCalledWith({
      desa: "3",
      page: 1,
    });
  });

  it("mengembalikan paket null bila desa belum ditetapkan paket", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await desaRepo()).daftarDesaSuperAdmin).mockResolvedValue([desa, desaLain]);
    vi.mocked((await domainUseCase()).daftarSemuaDomain).mockResolvedValue(domain);
    vi.mocked((await paketUseCase()).daftarPenetapanPaketPlatform).mockResolvedValue([]);
    vi.mocked((await penggunaUseCase()).daftarPenggunaSatuDesa).mockResolvedValue([]);
    vi.mocked((await auditUseCase()).ambilAuditPlatform).mockResolvedValue(audit);

    const hasil = await ambilDetailTenant(3);

    expect(hasil.paket).toBeNull();
  });

  it("melempar NOT_FOUND bila tenant tidak ada", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);
    vi.mocked((await desaRepo()).daftarDesaSuperAdmin).mockResolvedValue([desa]);
    vi.mocked((await domainUseCase()).daftarSemuaDomain).mockResolvedValue(domain);
    vi.mocked((await paketUseCase()).daftarPenetapanPaketPlatform).mockResolvedValue(paket);
    vi.mocked((await penggunaUseCase()).daftarPenggunaSatuDesa).mockResolvedValue([]);
    vi.mocked((await auditUseCase()).ambilAuditPlatform).mockResolvedValue(audit);

    await expect(ambilDetailTenant(999)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("menolak id yang bukan bilangan positif", async () => {
    vi.mocked((await guard()).requireSuperAdmin).mockResolvedValue(platformUser);

    await expect(ambilDetailTenant("bukan-id")).rejects.toThrow();
    await expect(ambilDetailTenant(0)).rejects.toThrow();
    await expect(ambilDetailTenant(-1)).rejects.toThrow();
  });
});
