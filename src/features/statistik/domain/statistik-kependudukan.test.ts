import { describe, expect, it } from "vitest";

import { KELOMPOK_UMUR } from "./rentang-umur";
import {
  buildStatistikKependudukanCsv,
  hitungStatistikKependudukan,
  kategoriStatistik,
  kelompokkan,
  kelompokkanRentang,
  pendudukKategori,
  persen,
  susunHasil,
  type DataStatistikKependudukan,
  type PendudukStatistik,
} from "./statistik-kependudukan";

function orang(overrides: Partial<PendudukStatistik> = {}): PendudukStatistik {
  return {
    id: 1,
    nama: "Penduduk Contoh",
    nik: null,
    alamat: null,
    wilayah: null,
    gender: "male",
    umur: 30,
    agama: null,
    pendidikan: null,
    pendidikanSedang: null,
    pekerjaan: null,
    statusKawin: null,
    statusKawinId: null,
    hubunganKk: null,
    wargaNegara: null,
    statusPenduduk: null,
    golonganDarah: null,
    disabilitas: null,
    penyakitMenahun: null,
    akseptorKb: null,
    aktaKelahiran: null,
    statusRekam: null,
    ktpEl: null,
    asuransi: null,
    statusAsuransi: null,
    suku: null,
    marga: null,
    adat: null,
    pekerjaMigran: null,
    bpjsKetenagakerjaan: null,
    statusKehamilan: null,
    ...overrides,
  };
}

function data(overrides: Partial<DataStatistikKependudukan> = {}): DataStatistikKependudukan {
  return {
    penduduk: [],
    rentangUmur: KELOMPOK_UMUR,
    katalog: {
      agama: ["Islam", "Kristen", "Hindu"],
      pendidikan: [],
      pekerjaan: [],
      statusKawin: [],
      hubunganKk: [],
      wargaNegara: [],
      golonganDarah: [],
    },
    keluarga: [],
    rtm: [],
    bantuan: [],
    ...overrides,
  };
}

describe("katalog statistik kependudukan", () => {
  it("menolak kategori tidak dikenal dan menyediakan kategori bawaan", () => {
    expect(kategoriStatistik("tidak-ada")).toBeNull();
    expect(kategoriStatistik("pendidikan-dalam-kk")?.label).toBe("Pendidikan Dalam KK");
  });
});

describe("kelompokkan", () => {
  it("mempertahankan urutan katalog dan menampilkan kategori berjumlah nol", () => {
    const hasil = kelompokkan(
      [
        orang({ gender: "male", agama: "Kristen" }),
        orang({ gender: "female", agama: "Islam" }),
        orang({ gender: "female", agama: "Islam" }),
      ],
      (row) => row.agama,
      ["Islam", "Kristen", "Hindu"],
    );

    expect(hasil.map((row) => row.label)).toEqual(["Islam", "Kristen", "Hindu"]);
    expect(hasil[0]).toMatchObject({ lakiLaki: 0, perempuan: 2, jumlah: 2 });
    expect(hasil[2]).toMatchObject({ lakiLaki: 0, perempuan: 0, jumlah: 0 });
  });

  it("mengabaikan nilai kosong dan mengurutkan teks bebas dari jumlah terbesar", () => {
    const hasil = kelompokkan(
      [
        orang({ suku: "Jawa" }),
        orang({ suku: "Sunda" }),
        orang({ suku: "Sunda" }),
        orang({ suku: "   " }),
      ],
      (row) => row.suku,
    );

    expect(hasil.map((row) => row.label)).toEqual(["Sunda", "Jawa"]);
    expect(hasil[0]?.jumlah).toBe(2);
  });
});

describe("kelompokkanRentang", () => {
  it("membagi umur ke kelompok yang tepat dan melewati umur kosong", () => {
    const hasil = kelompokkanRentang(
      [orang({ umur: 0 }), orang({ umur: 7 }), orang({ umur: 61 }), orang({ umur: null })],
      KELOMPOK_UMUR,
    );

    expect(hasil.find((row) => row.label === "Di bawah 1 Tahun")?.jumlah).toBe(1);
    expect(hasil.find((row) => row.label === "6–12 Tahun")?.jumlah).toBe(1);
    expect(hasil.find((row) => row.label === "Di atas 60 Tahun")?.jumlah).toBe(1);
    expect(hasil.reduce((total, row) => total + row.jumlah, 0)).toBe(3);
  });
});

describe("susunHasil", () => {
  it("menghitung jumlah dan sisa yang belum mengisi", () => {
    const kategori = kategoriStatistik("agama")!;
    const hasil = susunHasil(kategori, [{ label: "Islam", lakiLaki: 2, perempuan: 1, jumlah: 3 }], {
      lakiLaki: 3,
      perempuan: 2,
      jumlah: 5,
    });

    expect(hasil.jumlah).toEqual({ lakiLaki: 2, perempuan: 1, jumlah: 3 });
    expect(hasil.belumMengisi).toEqual({ lakiLaki: 1, perempuan: 1, jumlah: 2 });
    expect(hasil.total.jumlah).toBe(5);
  });
});

describe("hitungStatistikKependudukan", () => {
  it("jenis kelamin memakai total penduduk", () => {
    const hasil = hitungStatistikKependudukan(
      kategoriStatistik("jenis-kelamin")!,
      data({ penduduk: [orang({ gender: "male" }), orang({ gender: "female" })] }),
    );

    expect(hasil.baris).toHaveLength(2);
    expect(hasil.total).toMatchObject({ lakiLaki: 1, perempuan: 1, jumlah: 2 });
    expect(hasil.belumMengisi.jumlah).toBe(0);
  });

  it("status kehamilan hanya menghitung penduduk perempuan", () => {
    const hasil = hitungStatistikKependudukan(
      kategoriStatistik("status-kehamilan")!,
      data({
        penduduk: [
          orang({ gender: "female", statusKehamilan: "Hamil" }),
          orang({ gender: "female", statusKehamilan: "Tidak Hamil" }),
          orang({ gender: "male" }),
        ],
      }),
    );

    expect(hasil.total.jumlah).toBe(2);
    expect(hasil.baris.map((row) => row.label)).toEqual(["Hamil", "Tidak Hamil"]);
  });

  it("kepemilikan KTP hanya menghitung penduduk yang wajib KTP atau sudah menikah", () => {
    const hasil = hitungStatistikKependudukan(
      kategoriStatistik("kepemilikan-ktp")!,
      data({
        penduduk: [
          orang({ umur: 20, statusRekam: "Sudah Rekam" }),
          orang({ umur: 15, statusKawinId: 2, statusRekam: "Belum Rekam" }),
          orang({ umur: 15, statusKawinId: 1, statusRekam: "Belum Rekam" }),
        ],
      }),
    );

    expect(hasil.total.jumlah).toBe(3);
    expect(hasil.jumlah.jumlah).toBe(2);
    expect(hasil.belumMengisi.jumlah).toBe(1);
  });

  it("bantuan penduduk memakai program dengan sasaran penduduk", () => {
    const hasil = hitungStatistikKependudukan(
      kategoriStatistik("bantuan-penduduk")!,
      data({
        penduduk: [orang(), orang({ gender: "female" })],
        bantuan: [
          { slug: "pkh", nama: "PKH", sasaran: 1, lakiLaki: 1, perempuan: 1 },
          { slug: "bkk", nama: "Bantuan Keluarga", sasaran: 2, lakiLaki: 1, perempuan: 0 },
        ],
      }),
    );

    expect(hasil.baris.map((row) => row.label)).toEqual(["PKH"]);
    expect(hasil.jumlah).toMatchObject({ lakiLaki: 1, perempuan: 1, jumlah: 2 });
  });

  it("kategori yang belum tersedia mengembalikan hasil kosong beserta total", () => {
    const hasil = hitungStatistikKependudukan(
      kategoriStatistik("kepemilikan-akta-kematian")!,
      data({ penduduk: [orang()] }),
    );

    expect(hasil.baris).toEqual([]);
    expect(hasil.total.jumlah).toBe(1);
  });
});

describe("pendudukKategori", () => {
  it("mengambil penduduk yang cocok dengan baris kategori", () => {
    const rows = pendudukKategori(
      kategoriStatistik("agama")!,
      data({
        penduduk: [
          orang({ id: 1, nama: "A", agama: "Islam" }),
          orang({ id: 2, nama: "B", agama: "Kristen" }),
        ],
      }),
      "Islam",
    );

    expect(rows.map((row) => row.id)).toEqual([1]);
  });

  it("memakai aturan yang sama dengan tabel statistik", () => {
    const source = data({
      penduduk: [
        orang({ id: 1, umur: 20, statusRekam: "Sudah Rekam" }),
        orang({ id: 2, umur: 15, statusKawinId: 1, statusRekam: "Belum Rekam" }),
      ],
    });

    expect(
      pendudukKategori(kategoriStatistik("kepemilikan-ktp")!, source, "Sudah Rekam").map(
        (row) => row.id,
      ),
    ).toEqual([1]);
    expect(
      pendudukKategori(kategoriStatistik("kepemilikan-ktp")!, source, "Belum Rekam").map(
        (row) => row.id,
      ),
    ).toEqual([]);
  });
});

describe("ekspor", () => {
  it("menulis baris ringkasan JUMLAH, BELUM MENGISI, dan TOTAL", () => {
    const kategori = kategoriStatistik("agama")!;
    const hasil = susunHasil(kategori, [{ label: "Islam", lakiLaki: 1, perempuan: 0, jumlah: 1 }], {
      lakiLaki: 1,
      perempuan: 1,
      jumlah: 2,
    });

    const csv = buildStatistikKependudukanCsv({
      namaDesa: "Sukamaju",
      hasil,
      filter: "Semua wilayah",
    });

    expect(csv).toContain("JUMLAH");
    expect(csv).toContain("BELUM MENGISI");
    expect(csv).toContain("TOTAL");
    expect(csv).toContain("Sukamaju");
  });

  it("menghitung persen tanpa pembagian nol", () => {
    expect(persen(0, 0)).toBe("0");
    expect(persen(1, 3)).toBe("33,33");
  });
});
