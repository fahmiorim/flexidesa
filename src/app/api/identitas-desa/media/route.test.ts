import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  resolveVillageId: vi.fn(),
  simpanBerkasMedia: vi.fn(),
  simpanMediaIdentitas: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/dal", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/features/desa/application/resolve-village", () => ({
  resolveVillageId: mocks.resolveVillageId,
}));
vi.mock("@/features/publik/application/simpan-berkas-media", () => ({
  simpanBerkasMedia: mocks.simpanBerkasMedia,
}));
vi.mock("@/features/identitas-desa/application/identitas-desa-use-cases", () => ({
  simpanMediaIdentitas: mocks.simpanMediaIdentitas,
  hapusMediaIdentitas: vi.fn(),
}));

async function berkasPng(): Promise<File> {
  const buffer = await sharp({
    create: { width: 240, height: 120, channels: 3, background: { r: 10, g: 120, b: 60 } },
  })
    .png()
    .toBuffer();
  return new File([new Uint8Array(buffer)], "logo.png", { type: "image/png" });
}

function permintaan(berkas: File, ukuran?: string): Request {
  const form = new FormData();
  form.set("field", "logo");
  form.set("file", berkas);
  if (ukuran !== undefined) form.set("ukuran", ukuran);
  return new Request("http://localhost/api/identitas-desa/media", { method: "POST", body: form });
}

describe("POST /api/identitas-desa/media dengan dimensi logo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "u1" });
    mocks.resolveVillageId.mockResolvedValue(7);
    mocks.simpanBerkasMedia.mockResolvedValue("7/umum/logo.png");
    mocks.simpanMediaIdentitas.mockResolvedValue(undefined);
  });

  it("menolak dimensi di luar 100–400 tanpa menulis berkas", async () => {
    for (const ukuran of ["99", "401", "besar"]) {
      const res = await POST(permintaan(await berkasPng(), ukuran));
      expect(res.status).toBe(422);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBeTruthy();
    }
    expect(mocks.simpanBerkasMedia).not.toHaveBeenCalled();
    expect(mocks.simpanMediaIdentitas).not.toHaveBeenCalled();
  });

  it("meneruskan berkas yang sudah berukuran persegi dan menyimpannya", async () => {
    const res = await POST(permintaan(await berkasPng(), "200"));

    expect(res.status).toBe(200);
    expect(mocks.simpanBerkasMedia).toHaveBeenCalledTimes(1);
    const diteruskan = mocks.simpanBerkasMedia.mock.calls[0]![1] as {
      isi: Uint8Array;
      mime: string;
    };
    const meta = await sharp(Buffer.from(diteruskan.isi)).metadata();
    expect([meta.width, meta.height]).toEqual([200, 200]);
    expect(diteruskan.mime).toBe("image/png");
    expect(mocks.simpanMediaIdentitas).toHaveBeenCalledWith(7, "logo", "7/umum/logo.png");
  });

  it("tanpa dimensi mempertahankan perilaku bawaan", async () => {
    const res = await POST(permintaan(await berkasPng()));

    expect(res.status).toBe(200);
    const diteruskan = mocks.simpanBerkasMedia.mock.calls[0]![1] as { isi: Uint8Array };
    const meta = await sharp(Buffer.from(diteruskan.isi)).metadata();
    expect([meta.width, meta.height]).toEqual([240, 120]);
  });

  it("tetap menolak tipe berkas yang tidak diizinkan", async () => {
    const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "x.pdf", {
      type: "application/pdf",
    });
    const res = await POST(permintaan(pdf));
    expect(res.status).toBe(422);
    expect(mocks.simpanBerkasMedia).not.toHaveBeenCalled();
  });
});
