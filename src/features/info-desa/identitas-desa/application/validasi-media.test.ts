import { describe, expect, it } from "vitest";

import { validasiMediaIdentitas } from "./validasi-media";

/**
 * Daftar tipe mengikuti form Identitas Desa OpenSID:
 * - logo & foto kantor: .gif,.jpg,.jpeg,.png,.webp
 * - struktur adat: .jpg,.jpeg,.png,.webp
 * - dokumen adat: .pdf
 * SVG tetap diterima untuk logo sebagai tambahan FlexiDesa.
 * Batas ukuran mengikuti kebijakan FlexiDesa (OpenSID tidak membatasi foto kantor
 * dan memakai 2 MB untuk struktur/dokumen).
 */
describe("validasiMediaIdentitas", () => {
  it("menerima GIF untuk logo seperti OpenSID", () => {
    expect(validasiMediaIdentitas("logo", "image/gif", 1000).ok).toBe(true);
  });

  it("menerima WEBP dan SVG untuk logo", () => {
    expect(validasiMediaIdentitas("logo", "image/webp", 1000).ok).toBe(true);
    expect(validasiMediaIdentitas("logo", "image/svg+xml", 1000).ok).toBe(true);
  });

  it("menerima GIF dan WEBP untuk foto kantor", () => {
    expect(validasiMediaIdentitas("foto-kantor", "image/gif", 1000).ok).toBe(true);
    expect(validasiMediaIdentitas("foto-kantor", "image/webp", 1000).ok).toBe(true);
  });

  it("menolak PDF untuk logo dengan status 422", () => {
    const hasil = validasiMediaIdentitas("logo", "application/pdf", 1000);
    expect(hasil).toMatchObject({ ok: false, status: 422 });
  });

  it("menolak logo di atas 2 MB dengan status 413", () => {
    const hasil = validasiMediaIdentitas("logo", "image/png", 2 * 1024 * 1024 + 1);
    expect(hasil).toMatchObject({ ok: false, status: 413 });
  });

  it("tidak menerima GIF untuk struktur adat", () => {
    expect(validasiMediaIdentitas("struktur-adat", "image/gif", 1000).ok).toBe(false);
  });

  it("hanya menerima PDF untuk dokumen adat", () => {
    expect(validasiMediaIdentitas("dokumen-adat", "image/png", 1000).ok).toBe(false);
    expect(validasiMediaIdentitas("dokumen-adat", "application/pdf", 1000).ok).toBe(true);
  });

  it("menolak berkas kosong", () => {
    expect(validasiMediaIdentitas("logo", "image/png", 0).ok).toBe(false);
  });
});
