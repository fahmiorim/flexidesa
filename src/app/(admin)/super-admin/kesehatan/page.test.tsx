import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forbidden as buatKesalahanForbidden } from "@/lib/errors";

const state = vi.hoisted(() => ({
  pastikanSuperAdmin: vi.fn(),
  ambilKesehatanPlatform: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  forbidden: vi.fn(),
}));

vi.mock("../guard", () => ({ pastikanSuperAdmin: state.pastikanSuperAdmin }));

vi.mock("@/features/multi-desa/application/kesehatan-platform-use-cases", () => ({
  ambilKesehatanPlatform: state.ambilKesehatanPlatform,
}));

const dasar = {
  basisData: { terhubung: true, latensiMs: 4, error: null },
  tenant: { total: 4, aktif: 3, nonaktif: 1, siapPurge: 1, tanpaDomain: 1, tanpaTema: 2 },
  domain: {
    total: 3,
    sslAktif: 1,
    sslSegeraExpired: 1,
    sslBermasalah: 1,
    sslBelumDiperiksa: 0,
    dnsNormal: 2,
    dnsBermasalah: 1,
    dnsBelumDiperiksa: 0,
  },
  integrasi: { baseDomain: "flexidesa.test", emailAktif: true, tteAktif: false },
  perhatian: [
    {
      kunci: "ssl",
      judul: "1 domain bermasalah SSL",
      keterangan: "Sertifikat tidak aktif.",
      href: "/super-admin/domain",
      aksi: "Periksa domain",
    },
  ],
};

describe("SuperAdminKesehatanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.pastikanSuperAdmin.mockResolvedValue({ id: "platform-1", villageId: null });
    state.ambilKesehatanPlatform.mockResolvedValue(dasar);
  });

  it("menolak pengguna yang bukan pengelola platform sebelum membaca status", async () => {
    state.pastikanSuperAdmin.mockRejectedValue(
      buatKesalahanForbidden("Hanya super admin yang boleh mengelola desa."),
    );
    const { default: Page } = await import("./page");

    await expect(Page()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.ambilKesehatanPlatform).not.toHaveBeenCalled();
  });

  it("menampilkan koneksi, sebaran SSL/DNS, dan temuan nyata", async () => {
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Kesehatan Sistem");
    expect(html).toContain("Terhubung");
    expect(html).toContain("1/3");
    expect(html).toContain("Sertifikat SSL");
    expect(html).toContain("Segera kedaluwarsa");
    expect(html).toContain("Status DNS");
    expect(html).toContain("1 domain bermasalah SSL");
    expect(html).toContain("flexidesa.test");
    expect(html).toContain("Belum dikonfigurasi");
  });

  it("menyatakan temuan kosong bila semuanya sehat", async () => {
    state.ambilKesehatanPlatform.mockResolvedValue({ ...dasar, perhatian: [] });
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Tidak ada temuan");
  });

  it("menyatakan basis data gagal beserta pesannya", async () => {
    state.ambilKesehatanPlatform.mockResolvedValue({
      ...dasar,
      basisData: { terhubung: false, latensiMs: null, error: "Koneksi ditolak" },
      perhatian: [],
    });
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Gagal");
    expect(html).toContain("Koneksi ditolak");
  });

  it("menjelaskan batasan laporan tanpa klaim berlebih", async () => {
    const { default: Page } = await import("./page");

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Batasan laporan ini");
    expect(html).toContain("Pemakaian media per tenant belum dapat dilaporkan");
    expect(html).toContain("Tidak ada pemantauan otomatis terjadwal");
  });
});
