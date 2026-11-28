import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forbidden as buatKesalahanForbidden } from "@/lib/errors";

const state = vi.hoisted(() => ({
  pastikanSuperAdmin: vi.fn(),
  daftarPenggunaDesa: vi.fn(),
  daftarDesaSuperAdmin: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  forbidden: vi.fn(),
  usePathname: () => "/super-admin/pengguna-desa",
  useRouter: () => ({ replace: vi.fn() }),
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

vi.mock("../guard", () => ({ pastikanSuperAdmin: state.pastikanSuperAdmin }));

vi.mock("./actions", () => ({
  ubahStatusPenggunaDesaAction: vi.fn(),
  resetSandiPenggunaDesaAction: vi.fn(),
  cabutSesiPenggunaDesaAction: vi.fn(),
  masukSebagaiAdminAction: vi.fn(),
  keluarImpersonasiAction: vi.fn(),
}));

vi.mock("@/features/multi-desa/application/pengguna-desa-use-cases", () => ({
  daftarPenggunaDesa: state.daftarPenggunaDesa,
}));

vi.mock("@/features/multi-desa/application/provisioning-use-cases", () => ({
  daftarDesaSuperAdmin: state.daftarDesaSuperAdmin,
}));

const adminDesa = {
  id: "admin-1",
  name: "Admin Sukamaju",
  email: "admin@sukamaju.id",
  username: "admin.sukamaju",
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

const operator = {
  ...adminDesa,
  id: "op-1",
  name: "Operator Desa",
  email: "operator@sukamaju.id",
  username: "operator",
  roleName: "Operator",
  roleSlug: "operator",
  active: false,
  sesiAktif: 0,
};

const desa = [
  {
    id: 3,
    name: "Desa Sukamaju",
    slug: "sukamaju",
    code: null,
    domain: null,
    district: null,
    active: true,
    kuotaMediaMb: null,
    tema: null,
    temaNama: null,
    temaVersi: null,
    pengguna: 2,
    penduduk: 10,
    jenisSurat: 0,
    createdAt: new Date("2026-01-01"),
    nonaktifSejak: null,
    purgedAt: null,
    adaEksporBerlaku: false,
  },
];

describe("SuperAdminPenggunaDesaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.pastikanSuperAdmin.mockResolvedValue({ id: "platform-1", villageId: null });
    state.daftarPenggunaDesa.mockResolvedValue([adminDesa, operator]);
    state.daftarDesaSuperAdmin.mockResolvedValue(desa);
  });

  it("menolak pengguna yang bukan pengelola platform sebelum membaca akun", async () => {
    state.pastikanSuperAdmin.mockRejectedValue(
      buatKesalahanForbidden("Hanya super admin yang boleh mengelola desa."),
    );
    const { default: Page } = await import("./page");

    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(state.daftarPenggunaDesa).not.toHaveBeenCalled();
  });

  it("meneruskan pencarian dan filter status ke use case", async () => {
    const { default: Page } = await import("./page");

    await Page({
      searchParams: Promise.resolve({ q: "suka", desa: "3", status: "aktif" }),
    });

    expect(state.daftarPenggunaDesa).toHaveBeenCalledWith({
      q: "suka",
      villageId: 3,
      aktif: "aktif",
    });
  });

  it("mengabaikan desa dan status yang tidak dikenal", async () => {
    const { default: Page } = await import("./page");

    await Page({ searchParams: Promise.resolve({ desa: "bukan-id", status: "arsip" }) });

    expect(state.daftarPenggunaDesa).toHaveBeenCalledWith({
      q: undefined,
      villageId: undefined,
      aktif: "semua",
    });
  });

  it("menampilkan ringkasan, tabel akun, dan aksi per akun", async () => {
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));

    expect(html).toContain("Direktori pengguna desa");
    expect(html).toContain("Akun desa");
    expect(html).toContain("admin.sukamaju");
    expect(html).toContain("Desa Sukamaju");
    expect(html).toContain("Nonaktifkan");
    expect(html).toContain("Reset sandi");
    expect(html).toContain("Cabut sesi");
    // Hanya administrator aktif yang boleh diimpersonasi.
    expect(html.match(/Masuk sebagai/g)).toHaveLength(1);
    expect(html).toContain("ui-toolbar-search");
  });

  it("menampilkan keadaan kosong saat tidak ada akun yang cocok", async () => {
    state.daftarPenggunaDesa.mockResolvedValue([]);
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(
      await Page({ searchParams: Promise.resolve({ q: "tidak-ada" }) }),
    );

    expect(html).toContain("Tidak ada akun desa yang cocok");
  });
});
