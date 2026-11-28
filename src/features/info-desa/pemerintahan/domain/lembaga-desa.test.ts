import { describe, expect, it } from "vitest";

import {
  validasiAnggotaLembaga,
  validasiMasterLembaga,
  validasiProfilLembaga,
} from "./lembaga-desa";

describe("validasiProfilLembaga", () => {
  it("mewajibkan nama dan kode serta membatasi panjang", () => {
    expect(() => validasiProfilLembaga({ nama: "", kode: "LPM" })).toThrow(/Nama lembaga wajib/);
    expect(() => validasiProfilLembaga({ nama: "LPM", kode: "" })).toThrow(/Kode lembaga wajib/);
    expect(() => validasiProfilLembaga({ nama: "LPM", kode: "X".repeat(17) })).toThrow(
      /Kode lembaga maksimal 16/,
    );
    expect(() =>
      validasiProfilLembaga({ nama: "LPM", kode: "LPM", deskripsi: "x".repeat(301) }),
    ).toThrow(/Deskripsi maksimal 300/);
  });

  it("menerima field SK pendirian dan mengizinkan deskripsi kosong", () => {
    expect(() =>
      validasiProfilLembaga({ nama: "LPM", kode: "LPM", noSkPendirian: "SK/1" }),
    ).not.toThrow();
  });
});

describe("validasiMasterLembaga", () => {
  it("mewajibkan nama kategori dan membatasi panjangnya", () => {
    expect(() => validasiMasterLembaga({ nama: "   " })).toThrow(/Nama kategori wajib/);
    expect(() => validasiMasterLembaga({ nama: "X".repeat(51) })).toThrow(
      /Nama kategori maksimal 50/,
    );
  });

  it("menerima deskripsi kosong dan deskripsi panjang", () => {
    expect(() => validasiMasterLembaga({ nama: "BPD" })).not.toThrow();
    expect(() => validasiMasterLembaga({ nama: "BPD", deskripsi: "x".repeat(400) })).not.toThrow();
  });
});

describe("validasiAnggotaLembaga", () => {
  it("mewajibkan penduduk dan membatasi nomor anggota serta keterangan", () => {
    expect(() => validasiAnggotaLembaga({ residentId: null, nomorAnggota: null })).toThrow(
      /Penduduk anggota wajib dipilih/,
    );
    expect(() => validasiAnggotaLembaga({ residentId: 1, nomorAnggota: "1".repeat(21) })).toThrow(
      /Nomor anggota maksimal 20/,
    );
    expect(() => validasiAnggotaLembaga({ residentId: 1, keterangan: "x".repeat(301) })).toThrow(
      /Keterangan anggota maksimal 300/,
    );
  });

  it("menerima metadata SK dan periode teks", () => {
    expect(() =>
      validasiAnggotaLembaga({
        residentId: 1,
        nomorAnggota: "01",
        nomorSkJabatan: "SK-J",
        nomorSkPengangkatan: "SK-A",
        tanggalSkPengangkatan: "2025-01-01",
        nomorSkPemberhentian: "SK-P",
        tanggalSkPemberhentian: "2026-01-01",
        periode: "2025–2030",
        keterangan: "Ketua terpilih",
      }),
    ).not.toThrow();
  });
});
