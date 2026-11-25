import { describe, expect, it } from "vitest";

import {
  broadcastSchema,
  cocokAntreanNotifikasi,
  labelStatusPengiriman,
  parseFilterNotifikasi,
  statusPengiriman,
  toneStatusPengiriman,
} from "./notifikasi";

describe("filter notifikasi", () => {
  it("memakai bawaan saat query kosong", () => {
    expect(parseFilterNotifikasi({})).toEqual({ kanal: null, status: "semua" });
  });

  it("menerima kanal dan status yang sah", () => {
    expect(parseFilterNotifikasi({ kanal: "email", status: "sukses" })).toEqual({
      kanal: "email",
      status: "sukses",
    });
  });

  it("mengabaikan nilai asing", () => {
    expect(parseFilterNotifikasi({ kanal: "invalid", status: "hilang" })).toEqual({
      kanal: null,
      status: "semua",
    });
  });
});

describe("status pengiriman", () => {
  it("memetakan flag bukti menjadi status, label, dan tone", () => {
    expect(statusPengiriman({ sukses: true, dilewati: false })).toBe("sukses");
    expect(statusPengiriman({ sukses: false, dilewati: true })).toBe("dilewati");
    expect(statusPengiriman({ sukses: false, dilewati: false })).toBe("gagal");
    expect(labelStatusPengiriman("sukses")).toBe("Terkirim");
    expect(labelStatusPengiriman("dilewati")).toBe("Dilewati");
    expect(labelStatusPengiriman("gagal")).toBe("Gagal");
    expect(toneStatusPengiriman("sukses")).toBe("hijau");
    expect(toneStatusPengiriman("gagal")).toBe("merah");
    expect(toneStatusPengiriman("dilewati")).toBe("netral");
  });

  it("mencocokkan nomor antrean pada subjek atau pesan", () => {
    expect(
      cocokAntreanNotifikasi(
        { subjek: "[Layanan Desa] Status Permohonan AN-1", pesan: null },
        "AN-1",
      ),
    ).toBe(true);
    expect(cocokAntreanNotifikasi({ subjek: null, pesan: "permohonan AN-2 berubah" }, "AN-2")).toBe(
      true,
    );
    expect(cocokAntreanNotifikasi({ subjek: "AN-1", pesan: null }, "AN-2")).toBe(false);
    expect(cocokAntreanNotifikasi({ subjek: null, pesan: null }, null)).toBe(true);
    expect(cocokAntreanNotifikasi({ subjek: null, pesan: null }, "")).toBe(true);
  });
});

describe("broadcastSchema", () => {
  it("menerima pesan yang sah dan memangkas spasi", () => {
    const hasil = broadcastSchema.parse({
      kanal: "whatsapp",
      target: " 08123456789 ",
      pesan: "  Halo warga  ",
    });

    expect(hasil.target).toBe("08123456789");
    expect(hasil.pesan).toBe("Halo warga");
  });

  it("menolak pesan terlalu pendek atau target kosong", () => {
    expect(broadcastSchema.safeParse({ kanal: "email", target: "a@b", pesan: "hai" }).success).toBe(
      false,
    );
    expect(
      broadcastSchema.safeParse({ kanal: "invalid", target: "08123", pesan: "pesan cukup" })
        .success,
    ).toBe(false);
  });
});
