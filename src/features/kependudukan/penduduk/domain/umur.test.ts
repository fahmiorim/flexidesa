import { describe, expect, it } from "vitest";

import { hitungUmur } from "./umur";

describe("hitungUmur", () => {
  it("does not advance age before the birthday", () => {
    expect(hitungUmur("1999-11-26", new Date(2026, 10, 25, 12))).toBe(26);
  });

  it("advances age on the birthday", () => {
    expect(hitungUmur("1999-11-26", new Date(2026, 10, 26, 12))).toBe(27);
  });

  it("treats March 1 as the birthday in a non-leap year for a February 29 birth date", () => {
    expect(hitungUmur("2000-02-29", new Date(2025, 1, 28, 12))).toBe(24);
    expect(hitungUmur("2000-02-29", new Date(2025, 2, 1, 12))).toBe(25);
  });

  it("returns null for invalid or future birth dates", () => {
    expect(hitungUmur("1999-02-30", new Date(2026, 10, 25))).toBeNull();
    expect(hitungUmur("2027-01-01", new Date(2026, 10, 25))).toBeNull();
  });
});
