import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { terapkanUkuranLogo } from "./transformasi-logo";

async function pngPersegiPanjang(): Promise<Uint8Array> {
  const buffer = await sharp({
    create: { width: 300, height: 120, channels: 3, background: { r: 20, g: 90, b: 200 } },
  })
    .png()
    .toBuffer();
  return new Uint8Array(buffer);
}

describe("terapkanUkuranLogo", () => {
  it("tanpa ukuran mempertahankan berkas asli (dimensi bawaan)", async () => {
    const asli = await pngPersegiPanjang();
    const hasil = await terapkanUkuranLogo(asli, "image/png", "");

    expect(hasil.isi).toBe(asli);
    const meta = await sharp(Buffer.from(hasil.isi)).metadata();
    expect([meta.width, meta.height]).toEqual([300, 120]);
  });

  it("menghasilkan logo persegi sesuai dimensi pilihan", async () => {
    const asli = await pngPersegiPanjang();
    const hasil = await terapkanUkuranLogo(asli, "image/png", "250");

    const meta = await sharp(Buffer.from(hasil.isi)).metadata();
    expect([meta.width, meta.height]).toEqual([250, 250]);
    expect(hasil.mime).toBe("image/png");
  });

  it("menerima batas rentang 100 dan 400", async () => {
    const asli = await pngPersegiPanjang();
    for (const ukuran of [100, 400]) {
      const hasil = await terapkanUkuranLogo(asli, "image/png", String(ukuran));
      const meta = await sharp(Buffer.from(hasil.isi)).metadata();
      expect([meta.width, meta.height]).toEqual([ukuran, ukuran]);
    }
  });

  it("menolak nilai di luar rentang sebelum berkas ditulis", async () => {
    const asli = await pngPersegiPanjang();
    await expect(terapkanUkuranLogo(asli, "image/png", "99")).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(terapkanUkuranLogo(asli, "image/png", "401")).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(terapkanUkuranLogo(asli, "image/png", "abc")).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("SVG tidak dirasterisasi agar logo vektor tidak rusak", async () => {
    const svg = new Uint8Array(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" />'),
    );
    const hasil = await terapkanUkuranLogo(svg, "image/svg+xml", "200");
    expect(hasil.isi).toBe(svg);
    expect(hasil.mime).toBe("image/svg+xml");
  });
});
