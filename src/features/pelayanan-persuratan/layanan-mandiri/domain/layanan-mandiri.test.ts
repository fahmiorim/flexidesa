import { describe, expect, it } from "vitest";

import {
  canTransitionPermohonan,
  labelPermohonanStatus,
  parseBerkasSyarat,
  pesanNotifikasiPermohonan,
  serializeBerkasSyarat,
  statusPermohonan,
} from "./layanan-mandiri";

describe("pesanNotifikasiPermohonan", () => {
  it("menyebut status baru dan instruksi pengambilan saat siap diambil", () => {
    const pesan = pesanNotifikasiPermohonan({
      noAntrian: "AN-2026-0007",
      statusLama: 2,
      statusBaru: 3,
    });

    expect(pesan).toContain("AN-2026-0007");
    expect(pesan).toContain("Menunggu Tandatangan");
    expect(pesan).toContain("Siap Diambil");
    expect(pesan).toContain("siap diambil di kantor desa pada jam kerja");
  });

  it("menyertakan catatan operator dan tidak mengarang nomor antrean", () => {
    const pesan = pesanNotifikasiPermohonan({
      noAntrian: null,
      statusLama: 1,
      statusBaru: 0,
      alasan: "Scan KK kurang jelas",
    });

    expect(pesan).toContain("permohonan Anda");
    expect(pesan).toContain("Catatan operator: Scan KK kurang jelas");
    expect(pesan).not.toContain("siap diambil");
  });
});

describe("transisi status permohonan", () => {
  it("mengizinkan alur normal dan pengembalian/pembatalan", () => {
    expect(canTransitionPermohonan("0", "1")).toBe(true);
    expect(canTransitionPermohonan("1", "2")).toBe(true);
    expect(canTransitionPermohonan("2", "3")).toBe(true);
    expect(canTransitionPermohonan("3", "4")).toBe(true);
    expect(canTransitionPermohonan("1", "0")).toBe(true);
    expect(canTransitionPermohonan("2", "5")).toBe(true);
  });

  it("menolak lompatan tahap dan membuka permohonan final", () => {
    expect(canTransitionPermohonan("1", "4")).toBe(false);
    expect(canTransitionPermohonan("0", "3")).toBe(false);
    expect(canTransitionPermohonan("4", "1")).toBe(false);
    expect(canTransitionPermohonan("5", "3")).toBe(false);
  });
});

describe("statusPermohonan", () => {
  it("memetakan angka valid dan menolak angka lain", () => {
    expect(statusPermohonan(0)).toBe("0");
    expect(statusPermohonan(5)).toBe("5");
    expect(statusPermohonan(6)).toBeNull();
    expect(labelPermohonanStatus(3)).toBe("Siap Diambil");
    expect(labelPermohonanStatus(99)).toBe("Tidak diketahui");
  });
});

describe("berkas syarat permohonan", () => {
  it("membaca JSON berkas yang valid dan mengabaikan data rusak", () => {
    const items = [
      {
        id: 3,
        nama: "Fotokopi KTP",
        berkas: "1/permohonan/ktp.pdf",
        mime: "application/pdf",
        namaAsli: "ktp.pdf",
      },
    ];

    expect(parseBerkasSyarat(serializeBerkasSyarat(items))).toEqual(items);
    expect(
      parseBerkasSyarat(
        JSON.stringify([
          { id: 0, nama: "X" },
          { id: 4, nama: "Kartu Keluarga", berkas: "1/permohonan/kk.jpg", mime: "image/jpeg" },
          "bukan objek",
        ]),
      ),
    ).toEqual([
      {
        id: 4,
        nama: "Kartu Keluarga",
        berkas: "1/permohonan/kk.jpg",
        mime: "image/jpeg",
        namaAsli: "berkas",
      },
    ]);
    expect(parseBerkasSyarat("{rusak")).toEqual([]);
    expect(parseBerkasSyarat("{}")).toEqual([]);
  });
});
