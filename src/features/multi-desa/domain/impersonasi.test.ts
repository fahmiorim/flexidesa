import { describe, expect, it } from "vitest";

import {
  DURASI_IMPERSONASI_MENIT,
  DURASI_IMPERSONASI_MS,
  impersonasiBerlaku,
  kadaluarsaImpersonasi,
} from "./impersonasi";

describe("kebijakan impersonasi", () => {
  it("membatasi sesi impersonasi satu jam", () => {
    expect(DURASI_IMPERSONASI_MENIT).toBe(60);
    expect(DURASI_IMPERSONASI_MS).toBe(60 * 60_000);
  });

  it("menghitung kadaluarsa dari waktu mulai dan tidak memperpanjang", () => {
    const mulai = new Date("2026-11-27T08:00:00Z");

    expect(kadaluarsaImpersonasi(mulai).toISOString()).toBe("2026-11-27T09:00:00.000Z");
    expect(kadaluarsaImpersonasi(mulai)).not.toBe(kadaluarsaImpersonasi(mulai));
  });

  it("menyatakan konteks berlaku hanya sebelum batas keras", () => {
    const batas = new Date("2026-11-27T09:00:00Z");

    expect(impersonasiBerlaku(batas, new Date("2026-11-27T08:59:59Z"))).toBe(true);
    expect(impersonasiBerlaku(batas, new Date("2026-11-27T09:00:00Z"))).toBe(false);
    expect(impersonasiBerlaku(batas, new Date("2026-11-27T09:00:01Z"))).toBe(false);
    expect(impersonasiBerlaku(null)).toBe(false);
  });
});
