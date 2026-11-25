import { describe, expect, it, vi } from "vitest";

import { parseSdgsKemendesa } from "./kemendesa-sdgs-client";

vi.mock("server-only", () => ({}));

/** Contoh bentuk respons resmi API SDGs Kemendesa. */
const PAYLOAD = {
  average: "29.91",
  data: [
    { goals: 18, title: "Kelembagaan Desa", image: "/img/skor-sdgs-18.jpg", score: 21.35 },
    { goals: 1, title: "Desa Tanpa Kemiskinan", image: "/img/skor-sdgs-1.jpg", score: "44.46" },
    { goals: 2, title: "Desa Tanpa Kelaparan", image: "/img/skor-sdgs-2.jpg", score: 101 },
    { goals: 3, title: "Desa Sehat", image: "/img/skor-sdgs-3.jpg", score: -5 },
    { goals: 99, title: "Tujuan tidak valid", image: "/img/x.jpg", score: 50 },
    { goals: 4, title: "Tanpa skor", image: "/img/x.jpg" },
  ],
  total_desa: 1,
};

describe("parseSdgsKemendesa", () => {
  it("memetakan tujuan, membulatkan skor, dan membatasi rentang 0–100", () => {
    const hasil = parseSdgsKemendesa(PAYLOAD);

    expect(hasil.rataRata).toBe(29.91);
    expect(hasil.rows).toEqual([
      { goal: 1, skor: 44 },
      { goal: 2, skor: 100 },
      { goal: 3, skor: 0 },
      { goal: 18, skor: 21 },
    ]);
  });

  it("mengurutkan tujuan dan mengabaikan tujuan di luar 1–18 serta skor kosong", () => {
    const hasil = parseSdgsKemendesa(PAYLOAD);

    expect(hasil.rows.map((row) => row.goal)).toEqual([1, 2, 3, 18]);
  });

  it("menolak payload tanpa daftar capaian atau tanpa tujuan valid", () => {
    expect(() => parseSdgsKemendesa(null)).toThrow();
    expect(() => parseSdgsKemendesa({})).toThrow();
    expect(() => parseSdgsKemendesa({ average: "10", data: [] })).toThrow();
    expect(() => parseSdgsKemendesa({ data: [{ goals: 99, score: 10 }] })).toThrow();
  });
});
