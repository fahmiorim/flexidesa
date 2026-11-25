import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forbidden as buatKesalahanForbidden } from "@/lib/errors";

const state = vi.hoisted(() => ({
  pastikanSuperAdmin: vi.fn(),
  daftarTemplateWebsite: vi.fn(),
  daftarPilihanPaketTenantBaru: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/super-admin/tenant/tambah",
  useRouter: () => ({ replace: vi.fn() }),
}));

// PageHeading mem-portal judul ke slot top bar (null saat SSR).
vi.mock("@/components/shell/page-heading", () => ({
  PAGE_HEADING_SLOT_ID: "admin-topbar-heading",
  PageHeading: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../guard", () => ({
  pastikanSuperAdmin: state.pastikanSuperAdmin,
}));

vi.mock("@/features/multi-desa/application/template-website-use-cases", () => ({
  daftarTemplateWebsite: state.daftarTemplateWebsite,
}));

vi.mock("@/features/multi-desa/application/paket-langganan-use-cases", () => ({
  daftarPilihanPaketTenantBaru: state.daftarPilihanPaketTenantBaru,
}));

vi.mock("../../actions", () => ({
  buatDesaAction: vi.fn(),
}));

vi.mock("@/features/wilayah/presentation/picker-wilayah", () => ({
  PickerWilayah: () => null,
}));

const token = {
  primary: "#2563eb",
  secondary: "#1e40af",
  accent: "#f59e0b",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#0f172a",
  fontHeading: "sans",
  radius: "sedang",
  style: "terang",
};

const templateTerbit = {
  id: 1,
  slug: "tegar",
  name: "Tegar",
  category: "umum",
  description: "Tema bersih untuk desa",
  version: "1.0.0",
  status: "published",
  tokens: token,
  tags: [],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  jumlahTenant: 0,
  jumlahTertinggal: 0,
};

const paketTerbit = {
  planId: 2,
  planSlug: "standar",
  planName: "Standar",
  description: "Paket untuk desa dengan layanan lengkap.",
  versionId: 12,
  version: 3,
  features: [
    { slug: "penduduk", name: "Penduduk" },
    { slug: "surat", name: "Surat" },
  ],
};

describe("SuperAdminTambahTenantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menolak pengguna yang bukan pengelola platform sebelum membaca template", async () => {
    state.pastikanSuperAdmin.mockRejectedValue(
      buatKesalahanForbidden("Hanya super admin yang boleh mendaftarkan tenant."),
    );
    const { default: Page } = await import("./page");

    await expect(Page()).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(state.daftarTemplateWebsite).not.toHaveBeenCalled();
  });
  it("menampilkan paket terbit beserta ringkasan modul", async () => {
    state.pastikanSuperAdmin.mockResolvedValue({ id: "platform-1", villageId: null });
    state.daftarTemplateWebsite.mockResolvedValue([]);
    state.daftarPilihanPaketTenantBaru.mockResolvedValue([paketTerbit]);
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Standar");
    expect(html).toContain("v3");
    expect(html).toContain("Paket untuk desa dengan layanan lengkap.");
    expect(html).toContain("Penduduk");
    expect(html).toContain("Surat");
  });

  it("memberi tautan pengaturan paket saat belum ada versi terbit", async () => {
    state.pastikanSuperAdmin.mockResolvedValue({ id: "platform-1", villageId: null });
    state.daftarTemplateWebsite.mockResolvedValue([]);
    state.daftarPilihanPaketTenantBaru.mockResolvedValue([]);
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Belum ada paket dengan versi terbit.");
    expect(html).toContain('href="/super-admin/paket"');
  });

  it("menampilkan wizard pendaftaran desa baru dengan template terbit saja", async () => {
    state.pastikanSuperAdmin.mockResolvedValue({ id: "platform-1", villageId: null });
    state.daftarTemplateWebsite.mockResolvedValue([
      templateTerbit,
      { ...templateTerbit, id: 2, slug: "draf", name: "Draf Tema", status: "draft" },
    ]);
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page());

    expect(state.pastikanSuperAdmin).toHaveBeenCalledOnce();
    expect(html).toContain("Desa apa yang didaftarkan?");
    expect(html).toContain("Tambah Tenant");
    expect(html).toContain("Identitas Desa");
    expect(html).toContain("Tema bawaan platform");
    expect(html).toContain("Tegar");
    expect(html).not.toContain("Draf Tema");
    expect(html).toContain("Alamat kantor desa");
    expect(html).toContain("Telepon desa");
    expect(html).toContain("Email resmi desa");
    expect(html).toContain("Ulangi sandi awal");
    expect(html).toContain("Label subdomain");
    expect(html).toContain("Pratinjau Domain");
    expect(html).toContain("Selanjutnya");
    expect(html).toContain("Batal");
  });
});
