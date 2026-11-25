import { describe, expect, it } from "vitest";

import { desaBaruSchema, normalisasiDomain } from "./desa-baru";

const dasar = {
  name: "Desa Sukamaju",
  code: "3201012001",
  adminName: "Admin Desa",
  adminUsername: "admin.sukamaju",
  adminEmail: "admin@sukamaju.id",
  adminPassword: "Rahasia#123",
  planVersionId: 1,
};

describe("normalisasiDomain", () => {
  it("membuang protokol, path, dan huruf besar", () => {
    expect(normalisasiDomain("https://Desa-Sukamaju.id/beranda")).toBe("desa-sukamaju.id");
    expect(normalisasiDomain("  desa.id  ")).toBe("desa.id");
  });

  it("mengembalikan null untuk string kosong", () => {
    expect(normalisasiDomain("   ")).toBeNull();
  });
});

describe("desaBaruSchema", () => {
  it("mewajibkan ID versi paket positif", () => {
    expect(desaBaruSchema.parse({ ...dasar, domain: "" }).planVersionId).toBe(1);
    expect(() =>
      desaBaruSchema.parse({ ...dasar, domain: "", planVersionId: undefined }),
    ).toThrow();
    expect(() => desaBaruSchema.parse({ ...dasar, domain: "", planVersionId: 0 })).toThrow();
    expect(() => desaBaruSchema.parse({ ...dasar, domain: "", planVersionId: -1 })).toThrow();
  });
  it("menerima input lengkap dan menormalkan domain", () => {
    const hasil = desaBaruSchema.parse({ ...dasar, domain: "https://Sukamaju.id/" });

    expect(hasil.domain).toBe("sukamaju.id");
    expect(hasil.adminUsername).toBe("admin.sukamaju");
  });

  it("menerima domain kosong sebagai desa tanpa domain", () => {
    expect(desaBaruSchema.parse({ ...dasar, domain: "" }).domain).toBeNull();
  });

  it("memperlakukan themeSlug kosong sebagai tema bawaan", () => {
    expect(desaBaruSchema.parse({ ...dasar, domain: "", themeSlug: "" }).themeSlug).toBeUndefined();
    expect(desaBaruSchema.parse({ ...dasar, domain: "" }).themeSlug).toBeUndefined();
  });

  it("menormalkan slug subdomain pilihan operator", () => {
    expect(desaBaruSchema.parse({ ...dasar, domain: "", slug: "  Tanjung-Kubah " }).slug).toBe(
      "tanjung-kubah",
    );
    expect(desaBaruSchema.parse({ ...dasar, domain: "", slug: "" }).slug).toBeUndefined();
  });

  it("menolak slug yang bukan label subdomain", () => {
    expect(() => desaBaruSchema.parse({ ...dasar, domain: "", slug: "desa sukamaju" })).toThrow();
    expect(() => desaBaruSchema.parse({ ...dasar, domain: "", slug: "ab" })).toThrow();
  });

  it("menerima email desa opsional dan menolak formatnya yang salah", () => {
    expect(desaBaruSchema.parse({ ...dasar, domain: "", email: " " }).email).toBeUndefined();
    expect(desaBaruSchema.parse({ ...dasar, domain: "", email: "Pemdes@Desa.id" }).email).toBe(
      "pemdes@desa.id",
    );
    expect(() => desaBaruSchema.parse({ ...dasar, domain: "", email: "bukan-email" })).toThrow();
  });

  it("memeriksa konfirmasi sandi bila dikirim", () => {
    expect(() =>
      desaBaruSchema.parse({
        ...dasar,
        domain: "",
        adminPasswordConfirm: "Rahasia#124",
      }),
    ).toThrow();
    expect(
      desaBaruSchema.parse({ ...dasar, domain: "", adminPasswordConfirm: dasar.adminPassword })
        .adminPassword,
    ).toBe(dasar.adminPassword);
  });

  it("menerima themeSlug template terbit", () => {
    expect(desaBaruSchema.parse({ ...dasar, domain: "", themeSlug: "tegar" }).themeSlug).toBe(
      "tegar",
    );
  });

  it("menolak kode desa yang bukan 10 digit", () => {
    expect(() => desaBaruSchema.parse({ ...dasar, code: "123" })).toThrow();
  });

  it("membuang titik pada kode desa dari picker wilayah", () => {
    expect(desaBaruSchema.parse({ ...dasar, domain: "", code: "11.01.01.2001" }).code).toBe(
      "1101012001",
    );
    expect(desaBaruSchema.parse({ ...dasar, domain: "", code: "1101012001" }).code).toBe(
      "1101012001",
    );
  });

  it("menyimpan kode wilayah picker sebagai digit sesuai panjang kolom", () => {
    const hasil = desaBaruSchema.parse({
      ...dasar,
      domain: "",
      provinceCode: "11",
      regencyCode: "11.01",
      districtCode: "11.01.01",
    });

    expect(hasil.provinceCode).toBe("11");
    expect(hasil.regencyCode).toBe("1101");
    expect(hasil.districtCode).toBe("110101");
  });

  it("menerima kode BPS dan kode pos hasil picker wilayah", () => {
    const hasil = desaBaruSchema.parse({
      ...dasar,
      domain: "",
      kodeBps: "1103020002",
      kodePos: "23773",
    });

    expect(hasil.kodeBps).toBe("1103020002");
    expect(hasil.kodePos).toBe("23773");
    expect(desaBaruSchema.parse({ ...dasar, domain: "", kodeBps: "", kodePos: "" })).toMatchObject({
      kodeBps: undefined,
      kodePos: undefined,
    });
  });

  it("menolak kode BPS atau kode pos yang bukan digit sesuai panjang", () => {
    expect(() => desaBaruSchema.parse({ ...dasar, domain: "", kodeBps: "123" })).toThrow();
    expect(() => desaBaruSchema.parse({ ...dasar, domain: "", kodePos: "123" })).toThrow();
  });

  it("menerima kode wilayah kosong dan menolak panjang yang salah", () => {
    expect(
      desaBaruSchema.parse({ ...dasar, domain: "", provinceCode: "" }).provinceCode,
    ).toBeUndefined();
    expect(() => desaBaruSchema.parse({ ...dasar, domain: "", provinceCode: "111" })).toThrow();
  });

  it("menolak domain dengan protokol yang tersisa setelah normalisasi", () => {
    expect(() => desaBaruSchema.parse({ ...dasar, domain: "bukan domain" })).toThrow();
  });

  it("menolak sandi admin yang terlalu pendek", () => {
    expect(() => desaBaruSchema.parse({ ...dasar, adminPassword: "123" })).toThrow();
  });
});
