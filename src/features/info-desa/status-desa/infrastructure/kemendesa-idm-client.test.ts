import { describe, expect, it, vi } from "vitest";

import { parseIdmKemendesa } from "./kemendesa-idm-client";

vi.mock("server-only", () => ({}));

/**
 * Contoh respons API Kemendesa (dipotong) untuk desa 1101012001 tahun 2024.
 * Baris ringkasan ber-`NO: null` muncul SETELAH tiap kelompok dimensi.
 */
const PAYLOAD = {
  mapData: {
    SUMMARIES: {
      SKOR_SAAT_INI: 0.74444444444444,
      STATUS: "MAJU",
      TARGET_STATUS: "MANDIRI",
      SKOR_MINIMAL: "0.8156",
      PENAMBAHAN: 0.07115555555555997,
      TAHUN: 2024,
    },
    ROW: [
      { NO: 1, INDIKATOR: "Skor Akses Sarkes", SKOR: 5, KETERANGAN: "Baik" },
      { NO: 2, INDIKATOR: "Skor Dokter", SKOR: 4 },
      { NO: null, INDIKATOR: "IKS 2024", SKOR: 0.8 },
      { NO: 1, INDIKATOR: "Skor Kualitas Jalan", SKOR: 3 },
      { NO: null, INDIKATOR: "IKE 2024", SKOR: 0.9 },
      { NO: 1, INDIKATOR: "Skor Tanggap Bencana", SKOR: 0 },
      { NO: null, INDIKATOR: "IKL 2024", SKOR: 0.53333333333333 },
      { NO: null, INDIKATOR: "IDM 2024", SKOR: 0.74444444444444 },
      { NO: null, INDIKATOR: "STATUS IDM 2024", SKOR: "Maju" },
    ],
    IDENTITAS: { NAMA_DESA: "Contoh" },
  },
};

describe("parseIdmKemendesa", () => {
  it("memetakan ringkasan API termasuk skor minimal dan target status", () => {
    const hasil = parseIdmKemendesa(PAYLOAD);

    expect(hasil.ringkasan).toEqual({
      skorMinimal: 0.8156,
      targetStatus: "MANDIRI",
      statusApi: "MAJU",
      skorApi: 0.74444444444444,
      penambahan: 0.07115555555555997,
    });
  });

  it("memberi kode dimensi I, II, III dan mengonversi skor 0–5 menjadi 0–100", () => {
    const hasil = parseIdmKemendesa(PAYLOAD);

    expect(hasil.indikator).toEqual([
      { kode: "I.1", nama: "Skor Akses Sarkes", skor: 100, kategori: "IKS", keterangan: "Baik" },
      { kode: "I.2", nama: "Skor Dokter", skor: 80, kategori: "IKS", keterangan: null },
      { kode: "II.1", nama: "Skor Kualitas Jalan", skor: 60, kategori: "IKE", keterangan: null },
      { kode: "III.1", nama: "Skor Tanggap Bencana", skor: 0, kategori: "IKL", keterangan: null },
    ]);
  });

  it("mengabaikan baris ringkasan dimensi dan baris total IDM", () => {
    const hasil = parseIdmKemendesa(PAYLOAD);

    expect(hasil.indikator).toHaveLength(4);
    expect(hasil.indikator.map((row) => row.nama)).not.toContain("IKS 2024");
  });

  it("menolak payload tanpa struktur mapData yang dikenali", () => {
    expect(() => parseIdmKemendesa(null)).toThrow();
    expect(() => parseIdmKemendesa({})).toThrow();
    expect(() => parseIdmKemendesa({ mapData: { SUMMARIES: {}, ROW: [] } })).toThrow();
  });
});
