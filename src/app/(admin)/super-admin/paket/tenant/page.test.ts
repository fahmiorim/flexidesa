import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forbidden as buatKesalahanForbidden } from "@/lib/errors";

const state = vi.hoisted(() => ({
  pastikanSuperAdmin: vi.fn(),
  daftarPenetapanPaketPlatform: vi.fn(),
  daftarPilihanPaketTenantBaru: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/super-admin/paket/tenant",
  useRouter: () => ({ refresh: vi.fn() }),
}));

// PageHeading mem-portal judul ke slot top bar (null saat SSR).
vi.mock("@/components/shell/page-heading", () => ({
  PAGE_HEADING_SLOT_ID: "admin-topbar-heading",
  PageHeading: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../guard", () => ({
  pastikanSuperAdmin: state.pastikanSuperAdmin,
}));

vi.mock("@/features/multi-desa/application/paket-langganan-use-cases", () => ({
  daftarPenetapanPaketPlatform: state.daftarPenetapanPaketPlatform,
  daftarPilihanPaketTenantBaru: state.daftarPilihanPaketTenantBaru,
}));

vi.mock("../actions", () => ({
  tetapkanPaketTenantAction: vi.fn(),
}));

const tenant = {
  villageId: 7,
  name: "Desa Sukamaju",
  code: "1101012001",
  active: true,
  planVersionId: null,
  planSlug: null,
  planName: null,
  planVersion: null,
};

const paketTerbit = {
  planId: 2,
  planSlug: "standar",
  planName: "Standar",
  description: "Paket untuk desa dengan layanan lengkap.",
  versionId: 12,
  version: 3,
  features: [{ slug: "penduduk", name: "Penduduk" }],
};

describe("SuperAdminPaketTenantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menolak pengguna yang bukan pengelola platform sebelum membaca data paket", async () => {
    state.pastikanSuperAdmin.mockRejectedValue(
      buatKesalahanForbidden("Hanya super admin yang boleh mengelola paket."),
    );
    const { default: Page } = await import("./page");

    await expect(Page()).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(state.daftarPenetapanPaketPlatform).not.toHaveBeenCalled();
    expect(state.daftarPilihanPaketTenantBaru).not.toHaveBeenCalled();
  });

  it("menampilkan tenant beserta versi paket yang dapat ditetapkan", async () => {
    state.pastikanSuperAdmin.mockResolvedValue({ id: "platform-1", villageId: null });
    state.daftarPenetapanPaketPlatform.mockResolvedValue([tenant]);
    state.daftarPilihanPaketTenantBaru.mockResolvedValue([paketTerbit]);
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Desa Sukamaju");
    expect(html).toContain("Belum ditetapkan");
    expect(html).toContain("Standar (standar) · v3");
    expect(html).toContain("Konfirmasi penetapan");
    expect(html).not.toContain("Katalog paket");
    expect(html).not.toContain("Daftar paket");
  });

  it("menjelaskan langkah lanjutan saat belum ada versi paket terbit", async () => {
    state.pastikanSuperAdmin.mockResolvedValue({ id: "platform-1", villageId: null });
    state.daftarPenetapanPaketPlatform.mockResolvedValue([tenant]);
    state.daftarPilihanPaketTenantBaru.mockResolvedValue([]);
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Belum ada versi paket yang dapat dipilih");
  });
});
