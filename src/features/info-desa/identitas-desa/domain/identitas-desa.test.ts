import { describe, expect, it } from "vitest";

import { gabungKontakProfil, profilDesaSchema } from "./identitas-desa";

/** Field wajib skema; test hanya menguji tambahan field kontak. */
const dasar = {
  namaDesa: "Sukamaju",
  kodeDesa: "3201010001",
  kodeBps: "",
  namaKecamatan: "Ciawi",
  namaCamat: "",
  nipCamat: "",
  namaKabupaten: "Bogor",
  namaPropinsi: "Jawa Barat",
  kodePos: "",
  namaKepalaDesa: "Budi",
  nipKepalaDesa: "",
  visi: "",
  misi: "",
  sejarah: "",
  sambutan: "",
};

describe("profilDesaSchema — field kontak", () => {
  it("menerima payload lama tanpa field kontak", () => {
    const hasil = profilDesaSchema.parse(dasar);
    expect(hasil.email).toBeUndefined();
    expect(hasil.kontakPemberitahuanNama).toBeUndefined();
  });

  it("memangkas spasi dan menyimpan nilai kontak", () => {
    const hasil = profilDesaSchema.parse({
      ...dasar,
      email: "  desa@sukamaju.id ",
      telepon: " 021-123 ",
      nomorOperator: "0812",
      website: "https://sukamaju.id",
      kontakPemberitahuanNama: "Budi",
      kontakPemberitahuanTelepon: "0813",
      kontakPemberitahuanJabatan: "Kaur Umum",
    });
    expect(hasil.email).toBe("desa@sukamaju.id");
    expect(hasil.telepon).toBe("021-123");
    expect(hasil.kontakPemberitahuanJabatan).toBe("Kaur Umum");
  });

  it("menolak format email tidak valid", () => {
    expect(() => profilDesaSchema.parse({ ...dasar, email: "bukan-email" })).toThrow(
      "Alamat email tidak valid.",
    );
    expect(profilDesaSchema.parse({ ...dasar, email: "" }).email).toBe("");
  });

  it("menolak nilai melebihi batas kolom", () => {
    expect(() => profilDesaSchema.parse({ ...dasar, email: "a".repeat(101) })).toThrow();
    expect(() => profilDesaSchema.parse({ ...dasar, telepon: "1".repeat(31) })).toThrow();
    expect(() =>
      profilDesaSchema.parse({ ...dasar, kontakPemberitahuanNama: "a".repeat(101) }),
    ).toThrow();
  });
});

describe("gabungKontakProfil", () => {
  it("mempertahankan kanal yang tidak dikirim", () => {
    const hasil = gabungKontakProfil(
      { whatsapp: "0811", instagram: "@desa", jamLayanan: "08.00-15.00", alamat: "Lama" },
      { email: "baru@desa.id", alamat: "Baru" },
    );
    expect(hasil).toEqual({
      whatsapp: "0811",
      instagram: "@desa",
      jamLayanan: "08.00-15.00",
      alamat: "Baru",
      email: "baru@desa.id",
    });
  });

  it("mengizinkan string kosong untuk menghapus satu nilai", () => {
    const hasil = gabungKontakProfil({ email: "lama@desa.id", telepon: "021" }, { email: "" });
    expect(hasil).toEqual({ email: "", telepon: "021" });
  });

  it("mengabaikan field yang tidak disertakan pemanggil", () => {
    const hasil = gabungKontakProfil({ telepon: "021" }, { telepon: undefined });
    expect(hasil).toEqual({ telepon: "021" });
  });
});
