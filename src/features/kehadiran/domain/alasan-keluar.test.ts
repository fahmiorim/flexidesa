import { describe, expect, it } from "vitest";

import { alasanKeluarFormSchema, KETERANGAN_ALASAN_MAKS } from "./alasan-keluar";

describe("alasanKeluarFormSchema", () => {
  it("memangkas spasi dan menyimpan keterangan yang diisi", () => {
    const hasil = alasanKeluarFormSchema.parse({
      alasan: "  Keperluan keluarga ",
      keterangan: "  Mengantar orang tua berobat ",
    });

    expect(hasil).toEqual({
      alasan: "Keperluan keluarga",
      keterangan: "Mengantar orang tua berobat",
    });
  });

  it("mengubah keterangan kosong menjadi null karena opsional", () => {
    const hasil = alasanKeluarFormSchema.parse({
      alasan: "Dinas luar",
      keterangan: "   ",
    });

    expect(hasil.keterangan).toBeNull();
  });

  it("menolak alasan kosong seperti validasi wajib OpenSID", () => {
    const hasil = alasanKeluarFormSchema.safeParse({ alasan: "   ", keterangan: "" });

    expect(hasil.success).toBe(false);
    if (!hasil.success) {
      expect(hasil.error.issues[0]?.message).toBe("Alasan wajib diisi.");
    }
  });

  it("membatasi alasan 255 karakter dan keterangan 300 karakter", () => {
    expect(
      alasanKeluarFormSchema.safeParse({ alasan: "x".repeat(255), keterangan: "" }).success,
    ).toBe(true);
    expect(
      alasanKeluarFormSchema.safeParse({ alasan: "x".repeat(256), keterangan: "" }).success,
    ).toBe(false);
    expect(
      alasanKeluarFormSchema.safeParse({
        alasan: "Izin",
        keterangan: "x".repeat(KETERANGAN_ALASAN_MAKS),
      }).success,
    ).toBe(true);
    expect(
      alasanKeluarFormSchema.safeParse({
        alasan: "Izin",
        keterangan: "x".repeat(KETERANGAN_ALASAN_MAKS + 1),
      }).success,
    ).toBe(false);
  });
});
