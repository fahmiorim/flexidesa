import { describe, expect, it } from "vitest";

import { BULAN_LAPORAN, bulanLabel, laporanPendudukFormSchema } from "./laporan-penduduk";

describe("BULAN_LAPORAN", () => {
  it("memuat dua belas bulan berurutan seperti bulan() OpenSID", () => {
    expect(BULAN_LAPORAN).toHaveLength(12);
    expect(BULAN_LAPORAN.map((item) => item.value)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(BULAN_LAPORAN[0]?.label).toBe("Januari");
    expect(BULAN_LAPORAN[11]?.label).toBe("Desember");
  });

  it("memberi label cadangan untuk bulan di luar 1–12", () => {
    expect(bulanLabel(0)).toBe("Bulan 0");
    expect(bulanLabel(13)).toBe("Bulan 13");
  });
});

describe("laporanPendudukFormSchema", () => {
  const valid = { judul: "  Laporan Penduduk Januari  ", tahun: "2026", bulan: "1" };

  it("menerima isian sah dan memangkas judul", () => {
    const hasil = laporanPendudukFormSchema.parse(valid);
    expect(hasil).toEqual({ judul: "Laporan Penduduk Januari", tahun: 2026, bulan: 1 });
  });

  it("menolak judul kosong", () => {
    const hasil = laporanPendudukFormSchema.safeParse({ ...valid, judul: "   " });
    expect(hasil.success).toBe(false);
  });

  it("menolak tahun di luar rentang OpenSID", () => {
    expect(laporanPendudukFormSchema.safeParse({ ...valid, tahun: "1944" }).success).toBe(false);
    expect(laporanPendudukFormSchema.safeParse({ ...valid, tahun: "2031" }).success).toBe(false);
    expect(laporanPendudukFormSchema.safeParse({ ...valid, tahun: "1945" }).success).toBe(true);
    expect(laporanPendudukFormSchema.safeParse({ ...valid, tahun: "2030" }).success).toBe(true);
  });

  it("menolak bulan di luar 1–12", () => {
    expect(laporanPendudukFormSchema.safeParse({ ...valid, bulan: "0" }).success).toBe(false);
    expect(laporanPendudukFormSchema.safeParse({ ...valid, bulan: "13" }).success).toBe(false);
    expect(laporanPendudukFormSchema.safeParse({ ...valid, bulan: "12" }).success).toBe(true);
  });
});
