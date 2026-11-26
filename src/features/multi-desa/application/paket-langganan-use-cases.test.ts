import { beforeEach, describe, expect, it, vi } from "vitest";

import * as repository from "@/features/multi-desa/infrastructure/paket-langganan-repository";

import { simpanFiturDrafPaketPlatform } from "./paket-langganan-use-cases";
import * as guard from "./provisioning-use-cases";

vi.mock("./provisioning-use-cases", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("@/features/pengaturan/audit/application/audit-use-cases", () => ({
  recordAuditEvent: vi.fn(),
}));
vi.mock("@/features/multi-desa/infrastructure/paket-langganan-repository", () => ({
  simpanFiturDrafPaket: vi.fn(),
}));

describe("simpanFiturDrafPaketPlatform", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menolak non-super-admin sebelum menyentuh paket", async () => {
    vi.mocked(guard.requireSuperAdmin).mockRejectedValue(
      Object.assign(new Error("Akses ditolak"), { code: "FORBIDDEN" }),
    );

    await expect(
      simpanFiturDrafPaketPlatform({ planId: 1, versionId: 1, moduleSlugs: ["penduduk"] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repository.simpanFiturDrafPaket).not.toHaveBeenCalled();
  });

  it("menolak slug modul yang tidak ada pada katalog halaman tersedia", async () => {
    vi.mocked(guard.requireSuperAdmin).mockResolvedValue({ id: "platform-1" } as never);

    await expect(
      simpanFiturDrafPaketPlatform({ planId: 1, versionId: 1, moduleSlugs: ["modul-palsu"] }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(repository.simpanFiturDrafPaket).not.toHaveBeenCalled();
  });
});
