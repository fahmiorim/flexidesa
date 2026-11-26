/**
 * Unit tests untuk pengaturan-berkas domain (murni, tanpa DB).
 *
 * Menguji:
 * - Fallback ke default domain saat baris DB kosong
 * - Override dari baris DB
 * - Validasi MIME, ukuran, jumlah file, dan input simpan
 */

import { describe, expect, it } from "vitest";

import {
  pengaturanEfektifDariBaris,
  validasiInputPengaturan,
  validasiJumlahFile,
  validasiMediaDenganPengaturan,
  type MediaSettingsEfektif,
} from "../domain/pengaturan-berkas";

const MB = 1024 * 1024;

describe("pengaturanEfektifDariBaris - fallback ke default", () => {
  it("harus mengembalikan default untuk kategori 'surat' saat baris kosong", () => {
    const result = pengaturanEfektifDariBaris("surat", null);
    expect(result.kategori).toBe("surat");
    expect(result.maxSizeBytes).toBe(10 * MB);
    expect(result.overridden).toBe(false);
  });

  it("harus mengembalikan default untuk kategori 'dokumen'", () => {
    const result = pengaturanEfektifDariBaris("dokumen", null);
    expect(result.kategori).toBe("dokumen");
    expect(result.maxSizeBytes).toBe(20 * MB);
  });
});

describe("pengaturanEfektifDariBaris - override dari DB", () => {
  it("harus mengembalikan pengaturan dari baris DB jika ada", () => {
    const result = pengaturanEfektifDariBaris("surat", {
      villageId: 1,
      kategori: "surat",
      maxFiles: 5,
      maxSizeBytes: 20 * MB,
      mimeAllowlist: ["application/pdf"],
    } as never);
    expect(result.maxFiles).toBe(5);
    expect(result.maxSizeBytes).toBe(20 * MB);
    expect(result.overridden).toBe(true);
  });
});

describe("validasiInputPengaturan", () => {
  it("menerima input sah", () => {
    expect(() =>
      validasiInputPengaturan({
        kategori: "surat",
        mimeAllowlist: ["application/pdf"],
        maxFiles: 5,
        maxSizeMb: 10,
      }),
    ).not.toThrow();
  });

  it("menolak kategori tidak dikenal", () => {
    expect(() =>
      validasiInputPengaturan({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        kategori: "tidak-ada" as any,
        mimeAllowlist: null,
        maxFiles: null,
        maxSizeMb: null,
      }),
    ).toThrow("Kategori tidak dikenali.");
  });

  it("menolak MIME tanpa garis miring", () => {
    expect(() =>
      validasiInputPengaturan({
        kategori: "surat",
        mimeAllowlist: ["pdf"],
        maxFiles: null,
        maxSizeMb: null,
      }),
    ).toThrow(/MIME tidak valid/);
  });
});

describe("validasiMediaDenganPengaturan", () => {
  it("menerima file yang valid", () => {
    const settings: MediaSettingsEfektif = {
      kategori: "surat",
      maxFiles: 5,
      maxSizeBytes: 10 * MB,
      mimeAllowlist: ["application/pdf"],
      overridden: false,
    };
    const result = validasiMediaDenganPengaturan(settings, "application/pdf", MB * 5);
    expect(result).toBeUndefined();
  });

  it("menolak file dengan ukuran melebihi batas", () => {
    const settings: MediaSettingsEfektif = {
      kategori: "surat",
      maxFiles: 5,
      maxSizeBytes: 10 * MB,
      mimeAllowlist: ["application/pdf"],
      overridden: false,
    };
    const result = validasiMediaDenganPengaturan(settings, "application/pdf", MB * 15);
    expect(result).toBeDefined();
  });

  it("menolak MIME yang tidak didukung", () => {
    const settings: MediaSettingsEfektif = {
      kategori: "surat",
      maxFiles: 5,
      maxSizeBytes: 10 * MB,
      mimeAllowlist: ["application/pdf"],
      overridden: false,
    };
    const result = validasiMediaDenganPengaturan(settings, "image/jpeg", MB * 5);
    expect(result).toBeDefined();
  });
});

describe("validasiJumlahFile", () => {
  it("menerima jumlah file dalam batas", () => {
    const settings: MediaSettingsEfektif = {
      kategori: "surat",
      maxFiles: 5,
      maxSizeBytes: 10 * MB,
      mimeAllowlist: ["application/pdf"],
      overridden: false,
    };
    const result = validasiJumlahFile(settings, 3);
    expect(result).toBeUndefined();
  });

  it("menolak jumlah file melebihi batas", () => {
    const settings: MediaSettingsEfektif = {
      kategori: "surat",
      maxFiles: 5,
      maxSizeBytes: 10 * MB,
      mimeAllowlist: ["application/pdf"],
      overridden: false,
    };
    const result = validasiJumlahFile(settings, 6);
    expect(result).toBeDefined();
  });
});
