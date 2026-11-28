import { describe, expect, it } from "vitest";

import {
  bacaFormIsian,
  formatAlamatTerdata,
  labelKolomIsian,
  parseFilterTerdata,
  SASARAN_KELUARGA,
  SASARAN_LABELS,
  SASARAN_PENDUDUK,
  suplemenCreateSchema,
  suplemenTerdataSchema,
  suplemenUpdateSchema,
  type SuplemenCreateInput,
  type SuplemenTerdataInput,
} from "./suplemen";

describe("SASARAN constants", () => {
  it("mengatur konstanta sasaran penduduk dan keluarga", () => {
    expect(SASARAN_PENDUDUK).toBe(1);
    expect(SASARAN_KELUARGA).toBe(2);
  });

  it("memiliki label yang sesuai untuk setiap sasaran", () => {
    expect(SASARAN_LABELS[SASARAN_PENDUDUK]).toBe("Penduduk");
    expect(SASARAN_LABELS[SASARAN_KELUARGA]).toBe("Keluarga (KK)");
  });
});

describe("suplemenCreateSchema", () => {
  it("menerima input wajib nama dengan minimal 1 karakter", () => {
    const input: SuplemenCreateInput = {
      nama: "Bansos QRIS",
      sasaran: SASARAN_PENDUDUK,
      dataFormIsian: [],
    };
    const parsed = suplemenCreateSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("menerima keterangan opsional", () => {
    const parsed = suplemenCreateSchema.safeParse({
      nama: "Data Bansos",
      sasaran: SASARAN_KELUARGA,
      keterangan: "Tahun 2026",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.keterangan).toBe("Tahun 2026");
  });

  it("menerima keterangan null", () => {
    const parsed = suplemenCreateSchema.safeParse({
      nama: "Data Bansos",
      sasaran: SASARAN_PENDUDUK,
      keterangan: null,
    });
    expect(parsed.success).toBe(true);
  });

  it("menolak nama kosong", () => {
    expect(suplemenCreateSchema.safeParse({ nama: "", sasaran: 1 }).success).toBe(false);
  });

  it("menolak nama lebih dari 200 karakter", () => {
    expect(suplemenCreateSchema.safeParse({ nama: "x".repeat(201), sasaran: 1 }).success).toBe(
      false,
    );
  });

  it("menggunakan default sasaran penduduk ketika tidak diberikan", () => {
    const parsed = suplemenCreateSchema.safeParse({ nama: "Suplemen Baru" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.sasaran).toBe(SASARAN_PENDUDUK);
  });
});

describe("suplemenUpdateSchema", () => {
  it("memerlukan id positif pada update", () => {
    expect(suplemenUpdateSchema.safeParse({ id: 0, nama: "Ubah" }).success).toBe(false);
    expect(suplemenUpdateSchema.safeParse({ id: -1, nama: "Ubah" }).success).toBe(false);
  });

  it("menerima update dengan id valid", () => {
    const parsed = suplemenUpdateSchema.safeParse({
      id: 5,
      nama: "Nama Baru",
      sasaran: SASARAN_KELUARGA,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.id).toBe(5);
  });
});

describe("suplemenTerdataSchema", () => {
  it("menerima input dengan pendudukId", () => {
    const input: SuplemenTerdataInput = {
      suplemenId: 1,
      pendudukId: 10,
    };
    const parsed = suplemenTerdataSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("menerima input dengan keluargaId", () => {
    const parsed = suplemenTerdataSchema.safeParse({
      suplemenId: 1,
      keluargaId: 5,
    });
    expect(parsed.success).toBe(true);
  });

  it("menolak input tanpa pendudukId maupun keluargaId", () => {
    const parsed = suplemenTerdataSchema.safeParse({
      suplemenId: 1,
    });
    expect(parsed.success).toBe(false);
  });

  it("menolak input dengan kedua sasaran sekaligus", () => {
    const parsed = suplemenTerdataSchema.safeParse({
      suplemenId: 1,
      pendudukId: 10,
      keluargaId: 5,
    });
    expect(parsed.success).toBe(false);
  });

  it("menerima isian dinamis opsional", () => {
    const parsed = suplemenTerdataSchema.safeParse({
      suplemenId: 1,
      pendudukId: 10,
      isian: { "Jenis Kelamin": "Laki-laki" },
    });
    expect(parsed.success).toBe(true);
  });
});

describe("validasi suplemen - data_form_isian", () => {
  it("menerima isian dinamis kosong atau array", () => {
    const parsed1 = suplemenCreateSchema.parse({
      nama: "Program Lansia",
      sasaran: 1,
      dataFormIsian: [],
    });
    expect(parsed1.dataFormIsian).toEqual([]);

    const parsed2 = suplemenCreateSchema.parse({
      nama: "Program Lansia",
      sasaran: 1,
      dataFormIsian: [{ label: "Usia", tipe: "text", required: true }],
    });
    expect(parsed2.dataFormIsian?.length).toBe(1);
  });

  it("menolak dataFormIsian bukan array", () => {
    const hasil = suplemenCreateSchema.safeParse({
      nama: "Program",
      sasaran: 1,
      dataFormIsian: "invalid",
    });
    expect(hasil.success).toBe(false);
  });
});

describe("form isian dinamis", () => {
  it("membaca bentuk kanonis camelCase", () => {
    const fields = bacaFormIsian([
      {
        label: "Jenis Disabilitas",
        tipe: "select-manual",
        required: true,
        pilihanKode: ["Fisik", "Netra"],
        kolom: 6,
      },
    ]);

    expect(fields).toHaveLength(1);
    expect(fields[0]?.label).toBe("Jenis Disabilitas");
    expect(fields[0]?.tipe).toBe("select-manual");
    expect(fields[0]?.required).toBe(true);
    expect(fields[0]?.pilihanKode).toEqual(["Fisik", "Netra"]);
    expect(fields[0]?.kolom).toBe(6);
  });

  it("menerima bentuk snake_case dan string JSON", () => {
    const fields = bacaFormIsian(
      JSON.stringify([
        {
          nama_kode: "tgl_lahir",
          label_kode: "Tanggal Lahir",
          tipe_kode: "date",
          deskripsi_kode: "Pilih tanggal",
          required_kode: true,
        },
      ]),
    );

    expect(fields[0]).toMatchObject({
      label: "Tanggal Lahir",
      tipe: "date",
      namaKode: "tgl_lahir",
      deskripsiKode: "Pilih tanggal",
      required: true,
    });
  });

  it("mengabaikan kolom tanpa label atau tipe tidak dikenal", () => {
    expect(
      bacaFormIsian([
        { label: "", tipe: "text" },
        { label: "Tanpa Tipe", tipe: "file" },
        { label: "Benar", tipe: "number" },
      ]),
    ).toHaveLength(1);
    expect(bacaFormIsian(null)).toEqual([]);
    expect(bacaFormIsian("bukan json")).toEqual([]);
  });

  it("memvalidasi definisi form isian lewat skema create", () => {
    const parsed = suplemenCreateSchema.parse({
      nama: "Program Lansia",
      sasaran: 1,
      dataFormIsian: [{ label: "Usia", tipe: "number", required: true }],
    });

    expect(parsed.dataFormIsian[0]?.label).toBe("Usia");
    expect(parsed.dataFormIsian[0]?.tipe).toBe("number");
    expect(
      suplemenCreateSchema.safeParse({ nama: "X", dataFormIsian: [{ label: "A", tipe: "file" }] })
        .success,
    ).toBe(false);
  });
});

describe("filter & label terdata", () => {
  it("membaca filter jenis kelamin dan wilayah dari query", () => {
    const filter = parseFilterTerdata(
      new URLSearchParams({ q: " ani ", sex: "female", dusun: "Sukamaju", rw: "002", rt: "003" }),
    );

    expect(filter).toEqual({
      search: "ani",
      gender: "female",
      dusun: "Sukamaju",
      rw: "002",
      rt: "003",
    });
  });

  it("mengabaikan jenis kelamin yang tidak dikenal", () => {
    expect(parseFilterTerdata(new URLSearchParams({ sex: "x" })).gender).toBe("all");
  });

  it("merapikan label kolom dan alamat terdata", () => {
    expect(labelKolomIsian("jumlah_anak")).toBe("Jumlah anak");
    expect(
      formatAlamatTerdata({ alamat: "Jl. Merdeka", rt: "001", rw: "002", dusun: "Sukamaju" }),
    ).toBe("Jl. Merdeka RT 001 / RW 002 / Dusun Sukamaju");
    expect(formatAlamatTerdata({ alamat: null, rt: null, rw: null, dusun: null })).toBeNull();
  });
});

describe("validasi suplemen - cetak dan isian", () => {
  it("menerima suplemen dengan dataFormIsian untuk pencetakan", () => {
    const parsed = suplemenCreateSchema.parse({
      nama: "BLT Desa",
      sasaran: 2,
      dataFormIsian: [
        { label: "Nomor KKS", tipe: "text", required: true },
        { label: "Penerima", tipe: "text", required: false },
      ],
    });
    expect(parsed.dataFormIsian?.length).toBe(2);
    expect(parsed.dataFormIsian?.[0]?.label).toBe("Nomor KKS");
  });
});
