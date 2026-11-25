import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error(`NEXT_REDIRECT;307;${url}`), {
      digest: "NEXT_REDIRECT",
    });
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: state.redirect,
}));

describe("SuperAdminTambahDomainPage", () => {
  it("mengalihkan rute lama ke halaman Tambah Tenant", async () => {
    const { default: Page } = await import("./page");

    expect(() => Page()).toThrow("NEXT_REDIRECT;307;/super-admin/tenant/tambah");
    expect(state.redirect).toHaveBeenCalledWith("/super-admin/tenant/tambah");
  });
});
