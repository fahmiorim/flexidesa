import { describe, expect, it } from "vitest";

import {
  agendaJamLabel,
  agendaLabelTanggal,
  bulanAgendaDalamRentang,
  geserBulanAgenda,
  rentangBulanAgenda,
} from "./agenda";

describe("agendaJamLabel", () => {
  it("merangkai rentang jam dan membuang detik", () => {
    expect(agendaJamLabel("09:00:00", "12:00:00")).toBe("09.00–12.00");
  });

  it("menampilkan satu jam bila selesai kosong atau sama", () => {
    expect(agendaJamLabel("09:00", null)).toBe("09.00");
    expect(agendaJamLabel("09:00", "09:00")).toBe("09.00");
  });

  it("mengembalikan null bila jam mulai belum diisi", () => {
    expect(agendaJamLabel(null, null)).toBeNull();
  });
});

describe("kalender agenda", () => {
  it("menggeser bulan melewati batas tahun", () => {
    expect(geserBulanAgenda({ tahun: 2026, bulan: 1 }, -1)).toEqual({ tahun: 2025, bulan: 12 });
    expect(geserBulanAgenda({ tahun: 2026, bulan: 12 }, 1)).toEqual({ tahun: 2027, bulan: 1 });
  });

  it("menghitung rentang setengah-terbuka satu bulan", () => {
    expect(rentangBulanAgenda(2026, 11)).toEqual({
      mulai: "2026-11-01",
      selesai: "2026-12-01",
    });
    expect(rentangBulanAgenda(2026, 12)).toEqual({
      mulai: "2026-12-01",
      selesai: "2027-01-01",
    });
    expect(rentangBulanAgenda(2028, 2)).toEqual({
      mulai: "2028-02-01",
      selesai: "2028-03-01",
    });
  });

  it("menolak navigasi di luar rentang tahun yang dilayani", () => {
    expect(bulanAgendaDalamRentang({ tahun: 2025, bulan: 12 }, 2025, 2028)).toBe(true);
    expect(bulanAgendaDalamRentang({ tahun: 2024, bulan: 12 }, 2025, 2028)).toBe(false);
    expect(bulanAgendaDalamRentang({ tahun: 2029, bulan: 1 }, 2025, 2028)).toBe(false);
    expect(bulanAgendaDalamRentang({ tahun: 2026, bulan: 13 }, 2025, 2028)).toBe(false);
  });
});

describe("agendaLabelTanggal", () => {
  it("merangkai rentang tanggal dalam satu bulan", () => {
    expect(agendaLabelTanggal("2026-11-20", "2026-11-22")).toBe("20–22 November 2026");
  });

  it("menampilkan satu tanggal bila selesai kosong atau sama", () => {
    expect(agendaLabelTanggal("2026-11-20", null)).toBe("20 November 2026");
    expect(agendaLabelTanggal("2026-11-20", "2026-11-20")).toBe("20 November 2026");
  });

  it("menyebut bulan pada kedua ujung bila berbeda bulan", () => {
    expect(agendaLabelTanggal("2026-11-30", "2026-12-02")).toBe(
      "30 November 2026 – 2 Desember 2026",
    );
  });
});
