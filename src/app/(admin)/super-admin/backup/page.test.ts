import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forbidden } from "@/lib/errors";

const state = vi.hoisted(() => ({ pastikanSuperAdmin: vi.fn() }));

vi.mock("../guard", () => ({ pastikanSuperAdmin: state.pastikanSuperAdmin }));

async function render(restored?: string) {
  const { default: Page } = await import("./page");
  return renderToStaticMarkup(
    await Page({ searchParams: Promise.resolve(restored ? { restored } : {}) }),
  );
}

describe("SuperAdminBackupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menolak pengguna yang bukan pengelola platform", async () => {
    state.pastikanSuperAdmin.mockRejectedValue(forbidden("Hanya super admin."));
    const { default: Page } = await import("./page");

    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("menyediakan unduhan lewat API backup yang sudah ada", async () => {
    state.pastikanSuperAdmin.mockResolvedValue({ id: "user-1" });

    const html = await render();

    expect(html).toContain('href="/api/database/backup"');
    expect(html).toContain('href="/api/database/backup?format=sql"');
  });

  it("mengirim restore ke API dengan konfirmasi dan batas ukuran", async () => {
    state.pastikanSuperAdmin.mockResolvedValue({ id: "user-1" });

    const html = await render();

    expect(html).toContain('action="/api/database/restore"');
    expect(html).toContain('name="konfirmasi"');
    expect(html).toContain('accept=".sql,.sql.gz"');
    expect(html).toContain("semua desa");
    expect(html).toContain("200 MB");
  });

  it("hanya menampilkan pesan sukses setelah redirect restore", async () => {
    state.pastikanSuperAdmin.mockResolvedValue({ id: "user-1" });

    expect(await render()).not.toContain("Restore selesai");
    expect(await render("1")).toContain("Restore selesai");
  });
});
