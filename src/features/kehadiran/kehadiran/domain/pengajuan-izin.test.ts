import { describe, expect, it } from "vitest";

import {
  formatRentang,
  JENIS_PENGAJUAN_IZIN,
  labelJenisPengajuan,
  labelStatusPengajuan,
  lampiranWajib,
  pengajuanIzinFormSchema,
  validasiLampiranPengajuan,
} from "./pengajuan-izin";

const form = (override: Partial<Record<string, string>> = {}) => ({
  jenis: "izin",
  mulai: "2026-12-01",
  selesai: "2026-12-02",
  keterangan: "Keperluan keluarga",
  ...override,
});

describe("jenis pengajuan izin", () => {
  it("memuat lima jenis beserta labelnya", () => {
    expect(JENIS_PENGAJUAN_IZIN.map((item) => item.label)).toEqual([
      "Izin",
      "Sakit",
      "Dinas Luar Kota",
      "Cuti",
      "Lainnya",
    ]);
  });

  it("menampilkan label jenis dan status yang dikenal", () => {
    expect(labelJenisPengajuan("cuti_sakit")).toBe("Sakit");
    expect(labelJenisPengajuan("dinas_luar_kota")).toBe("Dinas Luar Kota");
    expect(labelJenisPengajuan("entah")).toBe("entah");
    expect(labelStatusPengajuan("menunggu")).toBe("Menunggu");
    expect(labelStatusPengajuan("disetujui")).toBe("Disetujui");
    expect(labelStatusPengajuan("ditolak")).toBe("Ditolak");
  });

  it("mewajibkan lampiran hanya untuk pengajuan sakit", () => {
    expect(lampiranWajib("cuti_sakit")).toBe(true);
    expect(lampiranWajib("izin")).toBe(false);
    expect(validasiLampiranPengajuan("cuti_sakit", false)).toMatch(/surat dokter/i);
    expect(validasiLampiranPengajuan("cuti_sakit", true)).toBeNull();
    expect(validasiLampiranPengajuan("izin", false)).toBeNull();
  });
});

describe("pengajuanIzinFormSchema", () => {
  it("menerima pengajuan yang lengkap dan memangkas spasi", () => {
    const hasil = pengajuanIzinFormSchema.parse(form({ keterangan: "  Dinas luar kota  " }));

    expect(hasil.keterangan).toBe("Dinas luar kota");
    expect(hasil.jenis).toBe("izin");
  });

  it("menolak jenis di luar daftar", () => {
    expect(pengajuanIzinFormSchema.safeParse(form({ jenis: "bolos" })).success).toBe(false);
  });

  it("menolak tanggal tidak valid dan rentang terbalik", () => {
    expect(pengajuanIzinFormSchema.safeParse(form({ mulai: "2026-02-30" })).success).toBe(false);
    expect(
      pengajuanIzinFormSchema.safeParse(form({ mulai: "2026-12-05", selesai: "2026-12-01" }))
        .success,
    ).toBe(false);
  });

  it("mewajibkan keterangan dan membatasi 500 karakter", () => {
    expect(pengajuanIzinFormSchema.safeParse(form({ keterangan: "   " })).success).toBe(false);
    expect(pengajuanIzinFormSchema.safeParse(form({ keterangan: "x".repeat(500) })).success).toBe(
      true,
    );
    expect(pengajuanIzinFormSchema.safeParse(form({ keterangan: "x".repeat(501) })).success).toBe(
      false,
    );
  });
});

describe("format rentang tanggal", () => {
  it("meringkas rentang satu hari dan beberapa hari", () => {
    expect(formatRentang("2026-12-01", "2026-12-01")).toBe("01 Desember 2026");
    expect(formatRentang("2026-12-01", "2026-12-03")).toBe("01 Desember 2026 – 03 Desember 2026");
  });
});
