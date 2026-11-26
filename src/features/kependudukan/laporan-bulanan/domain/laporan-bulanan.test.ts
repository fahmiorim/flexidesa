import { describe, expect, it } from "vitest";

import {
  BARIS_LAPORAN_BULANAN,
  buildLaporanBulananCsv,
  labelPeriode,
  laporanBulananFilename,
  normalisasiPeriode,
  rentangPeriode,
  susunBarisLaporan,
  type JumlahBulanan,
  type SumberLaporanBulanan,
} from "./laporan-bulanan";

function jumlah(partial: Partial<JumlahBulanan> = {}): JumlahBulanan {
  return { wniL: 0, wniP: 0, wnaL: 0, wnaP: 0, kkL: 0, kkP: 0, ...partial };
}

function sumber(partial: Partial<SumberLaporanBulanan> = {}): SumberLaporanBulanan {
  return {
    awal: jumlah(),
    kelahiran: jumlah(),
    kematian: jumlah(),
    pendatang: jumlah(),
    pindah: jumlah(),
    hilang: jumlah(),
    akhir: jumlah(),
    ...partial,
  };
}

describe("normalisasiPeriode", () => {
  const sekarang = new Date("2026-11-25T00:00:00Z");

  it("memakai periode berjalan bila parameter kosong", () => {
    expect(normalisasiPeriode(null, null, sekarang)).toEqual({ tahun: 2026, bulan: 11 });
  });

  it("menerima periode yang valid", () => {
    expect(normalisasiPeriode("2024", "2", sekarang)).toEqual({ tahun: 2024, bulan: 2 });
  });

  it("mengganti nilai di luar rentang", () => {
    expect(normalisasiPeriode("1999", "13", sekarang)).toEqual({ tahun: 2026, bulan: 11 });
    expect(normalisasiPeriode("abc", "0", sekarang)).toEqual({ tahun: 2026, bulan: 11 });
  });
});

describe("rentangPeriode & labelPeriode", () => {
  it("memakai batas setengah terbuka sampai awal bulan berikutnya", () => {
    expect(rentangPeriode({ tahun: 2026, bulan: 1 })).toEqual({
      mulai: "2026-01-01",
      selesai: "2026-02-01",
    });
  });

  it("menyeberang tahun pada Desember", () => {
    expect(rentangPeriode({ tahun: 2025, bulan: 12 })).toEqual({
      mulai: "2025-12-01",
      selesai: "2026-01-01",
    });
  });

  it("menulis label periode dalam bahasa Indonesia", () => {
    expect(labelPeriode({ tahun: 2026, bulan: 8 })).toBe("Agustus 2026");
  });
});

describe("susunBarisLaporan", () => {
  it("menyusun tujuh baris sesuai urutan Lampiran A-9", () => {
    const baris = susunBarisLaporan(sumber());

    expect(baris.map((item) => item.kode)).toEqual(BARIS_LAPORAN_BULANAN.map((item) => item.kode));
    expect(baris.map((item) => item.label)).toEqual(
      BARIS_LAPORAN_BULANAN.map((item) => item.label),
    );
  });

  it("menjumlahkan WNI + WNA dan kepala keluarga per gender", () => {
    const [awal] = susunBarisLaporan(
      sumber({
        awal: jumlah({ wniL: 10, wniP: 12, wnaL: 1, wnaP: 2, kkL: 7, kkP: 1 }),
      }),
    );

    expect(awal).toMatchObject({
      jmlL: 11,
      jmlP: 14,
      jml: 25,
      kk: 8,
    });
  });

  it("mempertahankan angka baris peristiwa apa adanya", () => {
    const baris = susunBarisLaporan(
      sumber({
        awal: jumlah({ wniL: 5 }),
        kelahiran: jumlah({ wniP: 1, kkP: 1 }),
        kematian: jumlah({ wniL: 2 }),
        akhir: jumlah({ wniL: 3, wniP: 1, kkP: 1 }),
      }),
    );

    const perKode = new Map(baris.map((item) => [item.kode, item]));
    expect(perKode.get("kelahiran")?.jml).toBe(1);
    expect(perKode.get("kelahiran")?.kk).toBe(1);
    expect(perKode.get("kematian")?.jml).toBe(2);
    expect(perKode.get("akhir")?.jml).toBe(4);
  });
});

describe("buildLaporanBulananCsv", () => {
  it("memuat judul, identitas desa, dan seluruh kolom", () => {
    const csv = buildLaporanBulananCsv({
      namaDesa: "Desa Contoh",
      kecamatan: "Kecamatan Contoh",
      periode: { tahun: 2026, bulan: 1 },
      baris: susunBarisLaporan(sumber({ awal: jumlah({ wniL: 3 }) })),
    });

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Laporan Perkembangan Penduduk (Lampiran A-9)");
    expect(csv).toContain("Desa Contoh");
    expect(csv).toContain("Periode;Januari 2026");
    expect(csv).toContain("No;Perincian;WNI Laki-laki");
    expect(csv).toContain("1;Penduduk/Keluarga awal bulan ini;3;0;0;0;3;0;3;0;0;0");
  });
});

describe("laporanBulananFilename", () => {
  it("membuat nama berkas aman dari nama desa", () => {
    expect(laporanBulananFilename("Desa Contoh", { tahun: 2026, bulan: 3 })).toBe(
      "laporan-bulanan-2026-03-desa-contoh.csv",
    );
  });

  it("memakai 'desa' bila nama desa kosong", () => {
    expect(laporanBulananFilename(null, { tahun: 2026, bulan: 12 })).toBe(
      "laporan-bulanan-2026-12-desa.csv",
    );
  });
});
