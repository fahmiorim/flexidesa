import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forbidden as buatKesalahanForbidden, notFound as galatNotFound } from "@/lib/errors";

const state = vi.hoisted(() => ({
  pastikanSuperAdmin: vi.fn(),
  ambilDetailTenant: vi.fn(),
  notFound: vi.fn(() => {
    throw Object.assign(new Error("NEXT_HTTP_ERROR_FALLBACK;404"), {
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  }),
  aksiStatus: vi.fn(),
  aksiReset: vi.fn(),
  aksiCabut: vi.fn(),
  aksiMasuk: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: state.notFound,
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/components/shell/page-heading", () => ({
  PAGE_HEADING_SLOT_ID: "admin-topbar-heading",
  PageHeading: ({
    judul,
    isiJudul,
    aksi,
  }: {
    judul?: string;
    isiJudul?: React.ReactNode;
    aksi?: React.ReactNode;
  }) => (
    <>
      {isiJudul ?? judul}
      {aksi}
    </>
  ),
}));

vi.mock("../../guard", () => ({ pastikanSuperAdmin: state.pastikanSuperAdmin }));

vi.mock("../../pengguna-desa/actions", () => ({
  ubahStatusPenggunaDesaAction: state.aksiStatus,
  resetSandiPenggunaDesaAction: state.aksiReset,
  cabutSesiPenggunaDesaAction: state.aksiCabut,
  masukSebagaiAdminAction: state.aksiMasuk,
}));

vi.mock("@/features/multi-desa/application/tenant-detail-use-cases", () => ({
  ambilDetailTenant: state.ambilDetailTenant,
}));

const desa = {
  id: 3,
  name: "Desa Sukamaju",
  slug: "sukamaju",
  code: "1207012001",
  domain: "sukamaju.localhost",
  district: "Cibadak",
  regency: "Sukabumi",
  active: true,
  kuotaMediaMb: 512,
  tema: "tegar",
  temaNama: "Tegar",
  temaVersi: "1.0.0",
  pengguna: 1,
  penduduk: 42,
  jenisSurat: 7,
  createdAt: new Date("2026-01-01"),
  nonaktifSejak: null,
  purgedAt: null,
  adaEksporBerlaku: true,
};

const pengguna = {
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

const data = {
  desa,
  statusRetensi: "aktif" as const,
  hariMenujuPurge: null,
  domain: [
    { id: 7, villageId: 3, domain: "sukamaju.localhost", isPrimary: true, createdAt: new Date() },
  ],
  paket: { slug: "standar", nama: "Standar", versi: 2 },
  pengguna: [pengguna],
  audit: {
    rows: [
      {
        id: 1,
        event: "desa.domain",
        actorName: "Super Admin",
        resource: "village_domains",
        resourceId: "7",
        details: "{}",
        createdAt: new Date("2026-11-18T09:47:00Z"),
      },
    ],
    total: 1,
    page: 1,
    pageSize: 25,
    pageCount: 1,
  },
};

describe("SuperAdminDetailTenantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.pastikanSuperAdmin.mockResolvedValue({ id: "platform-1", villageId: null });
    state.ambilDetailTenant.mockResolvedValue(data);
  });

  it("menolak pengguna yang bukan pengelola platform sebelum memuat data", async () => {
    state.pastikanSuperAdmin.mockRejectedValue(
      buatKesalahanForbidden("Hanya super admin yang boleh mengelola desa."),
    );
    const { default: Page } = await import("./page");

    await expect(
      Page({ params: Promise.resolve({ id: "3" }), searchParams: Promise.resolve({}) }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.ambilDetailTenant).not.toHaveBeenCalled();
  });

  it("menampilkan ringkasan dan identitas tenant pada tab Informasi", async () => {
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(
      await Page({ params: Promise.resolve({ id: "3" }), searchParams: Promise.resolve({}) }),
    );

    expect(state.ambilDetailTenant).toHaveBeenCalledWith(3);
    expect(html).toContain("Detail Tenant — Desa Sukamaju");
    expect(html).toContain("Tegar");
    expect(html).toContain("Standar");
    expect(html).toContain("Kecamatan");
    expect(html).toContain("Cibadak");
    expect(html).toContain('ui-tab-count">1</span>');
  });

  it("memuat tab Domain, Pengguna, Retensi, dan Riwayat dari data nyata", async () => {
    const { default: Page } = await import("./page");

    const domainHtml = renderToStaticMarkup(
      await Page({
        params: Promise.resolve({ id: "3" }),
        searchParams: Promise.resolve({ tab: "domain" }),
      }),
    );
    expect(domainHtml).toContain("sukamaju.localhost");
    expect(domainHtml).toContain("Utama");

    const penggunaHtml = renderToStaticMarkup(
      await Page({
        params: Promise.resolve({ id: "3" }),
        searchParams: Promise.resolve({ tab: "pengguna" }),
      }),
    );
    expect(penggunaHtml).toContain("admin.desa");
    expect(penggunaHtml).toContain("Masuk sebagai");

    const retensiHtml = renderToStaticMarkup(
      await Page({
        params: Promise.resolve({ id: "3" }),
        searchParams: Promise.resolve({ tab: "retensi" }),
      }),
    );
    expect(retensiHtml).toContain("Kuota media");
    expect(retensiHtml).toContain("512 MB");
    expect(retensiHtml).toContain("Tersedia");

    const riwayatHtml = renderToStaticMarkup(
      await Page({
        params: Promise.resolve({ id: "3" }),
        searchParams: Promise.resolve({ tab: "riwayat" }),
      }),
    );
    expect(riwayatHtml).toContain("Super Admin");
  });

  it("memakai tab Informasi untuk nilai tab tak dikenal", async () => {
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(
      await Page({
        params: Promise.resolve({ id: "3" }),
        searchParams: Promise.resolve({ tab: "tidak-ada" }),
      }),
    );

    expect(html).toContain("Identitas desa");
    // Baris audit hanya dirender pada tab Riwayat.
    expect(html).not.toContain("Super Admin");
  });

  it("memakai halaman 404 bila id tidak valid atau tenant tidak ditemukan", async () => {
    const { default: Page } = await import("./page");

    await expect(
      Page({ params: Promise.resolve({ id: "bukan-id" }), searchParams: Promise.resolve({}) }),
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    expect(state.ambilDetailTenant).not.toHaveBeenCalled();

    state.ambilDetailTenant.mockRejectedValue(galatNotFound("Tenant tidak ditemukan."));
    await expect(
      Page({ params: Promise.resolve({ id: "999" }), searchParams: Promise.resolve({}) }),
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
});
