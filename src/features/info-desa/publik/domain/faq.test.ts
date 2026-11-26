import { describe, expect, it } from "vitest";

import { FAQ_KONTAK_DEFAULT, faqSchema, parseFaq } from "./faq";

describe("parseFaq", () => {
  it("mengembalikan bawaan bila nilai belum pernah diisi", () => {
    expect(parseFaq(null, FAQ_KONTAK_DEFAULT)).toEqual([...FAQ_KONTAK_DEFAULT]);
  });

  it("mengembalikan bawaan bila nilai tidak valid", () => {
    expect(parseFaq([{ q: "x", a: "y" }], FAQ_KONTAK_DEFAULT)).toEqual([...FAQ_KONTAK_DEFAULT]);
    expect(parseFaq("bukan-array", FAQ_KONTAK_DEFAULT)).toEqual([...FAQ_KONTAK_DEFAULT]);
  });

  it("mengembalikan array kosong yang sudah disimpan agar FAQ disembunyikan", () => {
    expect(parseFaq([], FAQ_KONTAK_DEFAULT)).toEqual([]);
  });

  it("mengembalikan FAQ tersimpan yang valid", () => {
    const tersimpan = [{ q: "Pertanyaan desa?", a: "Jawaban desa." }];
    expect(parseFaq(tersimpan, FAQ_KONTAK_DEFAULT)).toEqual(tersimpan);
  });

  it("menolak item dengan teks terlalu pendek", () => {
    expect(faqSchema.safeParse([{ q: "abc", a: "Jawaban cukup panjang." }]).success).toBe(false);
  });
});
