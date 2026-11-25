import { describe, expect, it } from "vitest";

import {
  formatTanggalKeluarga,
  genderLabelKk,
  HEAD_OF_FAMILY_RELATION_ID,
  isTemporaryFamilyNumber,
  keluargaFormSchema,
  keluargaLabel,
  kepalaKeluarga,
  parseKeluargaIds,
  parseKeluargaNumbers,
  tanggalKk,
  welfareClassLabel,
  type KeluargaMemberDetail,
} from "@/features/keluarga/domain/keluarga";
import { NO_SELECTION } from "@/lib/forms";

const minimalInput = {
  number: "3201012001120001",
  address: "",
  regionId: "",
};

describe("keluargaFormSchema", () => {
  it("menerima input valid dan memangkas spasi", () => {
    const result = keluargaFormSchema.parse({
      ...minimalInput,
      number: " 3201012001120001 ",
      address: "  Jl. Melati No. 3 ",
      regionId: "2",
    });

    expect(result.number).toBe("3201012001120001");
    expect(result.address).toBe("Jl. Melati No. 3");
    expect(result.regionId).toBe(2);
  });

  it("mengubah pilihan wilayah kosong menjadi null", () => {
    expect(
      keluargaFormSchema.parse({ ...minimalInput, regionId: NO_SELECTION }).regionId,
    ).toBeNull();
    expect(keluargaFormSchema.parse(minimalInput).regionId).toBeNull();
  });

  it("menerima nomor KK tanpa wilayah", () => {
    const result = keluargaFormSchema.parse(minimalInput);

    expect(result.number).toBe("3201012001120001");
    expect(result.address).toBe("");
  });

  it("menolak nomor KK yang kosong atau bukan 16 angka", () => {
    expect(keluargaFormSchema.safeParse({ ...minimalInput, number: "" }).success).toBe(false);
    expect(keluargaFormSchema.safeParse({ ...minimalInput, number: "123" }).success).toBe(false);
    expect(
      keluargaFormSchema.safeParse({ ...minimalInput, number: "32010120011200AB" }).success,
    ).toBe(false);
  });

  it("menolak alamat yang terlalu panjang", () => {
    expect(
      keluargaFormSchema.safeParse({ ...minimalInput, address: "a".repeat(256) }).success,
    ).toBe(false);
  });

  it("menerima kelas sosial 1–5 dan menolak kode di luar itu", () => {
    expect(keluargaFormSchema.parse({ ...minimalInput, welfareClass: "3" }).welfareClass).toBe(3);
    expect(keluargaFormSchema.parse({ ...minimalInput, welfareClass: "" }).welfareClass).toBeNull();
    expect(keluargaFormSchema.safeParse({ ...minimalInput, welfareClass: "6" }).success).toBe(
      false,
    );
  });

  it("menerima tanggal cetak KK dan pilihan kepala keluarga opsional", () => {
    const result = keluargaFormSchema.parse({
      ...minimalInput,
      cardPrintedAt: "2026-11-25",
      headResidentId: "7",
    });

    expect(result.cardPrintedAt).toBe("2026-11-25");
    expect(result.headResidentId).toBe(7);
    expect(keluargaFormSchema.parse(minimalInput).headResidentId).toBeNull();
  });

  it("mengizinkan nomor kosong hanya untuk KK sementara", () => {
    const sementara = keluargaFormSchema.parse({
      ...minimalInput,
      number: "",
      temporary: true,
    });
    expect(sementara.temporary).toBe(true);
    expect(sementara.number).toBe("");
    expect(keluargaFormSchema.safeParse({ ...minimalInput, number: "" }).success).toBe(false);
    expect(
      keluargaFormSchema.safeParse({ ...minimalInput, number: "123", temporary: true }).success,
    ).toBe(false);
  });
});

describe("pembantu domain keluarga", () => {
  it("menyusun label keluarga dari nomor KK", () => {
    expect(keluargaLabel({ number: "3201012001120001" })).toBe("KK 3201012001120001");
  });

  it("memakai id katalog kepala keluarga yang benar", () => {
    expect(HEAD_OF_FAMILY_RELATION_ID).toBe(1);
  });

  it("memberi label kelas sosial dan tanggal berbahasa Indonesia", () => {
    expect(welfareClassLabel(1)).toBe("Keluarga Pra Sejahtera");
    expect(welfareClassLabel(5)).toBe("Keluarga Sejahtera III Plus");
    expect(welfareClassLabel(null)).toBe("Belum ditetapkan");
    expect(formatTanggalKeluarga("2026-11-25T03:00:00.000Z")).toBe("25 November 2026");
    expect(formatTanggalKeluarga(null)).toBeNull();
  });

  it("mengenali nomor KK sementara dan membaca daftar nomor/id aksi massal", () => {
    expect(isTemporaryFamilyNumber("0320101000100001")).toBe(true);
    expect(isTemporaryFamilyNumber("3201010001000001")).toBe(false);
    expect(parseKeluargaNumbers("3201010001000001, 3201010001000001; 0320101000100001")).toEqual([
      "3201010001000001",
      "0320101000100001",
    ]);
    expect(parseKeluargaIds("3,3,abc,7")).toEqual([3, 7]);
  });
});

function anggota(partial: Partial<KeluargaMemberDetail>): KeluargaMemberDetail {
  return {
    id: 1,
    name: "Budi Santoso",
    nationalId: "3201010101850001",
    gender: "male",
    birthDate: "1985-04-12",
    relationName: "KEPALA KELUARGA",
    birthPlace: "Bandung",
    religionName: "ISLAM",
    educationName: "SLTA/SEDERAJAT",
    occupationName: "PETANI",
    maritalStatusName: "KAWIN",
    bloodTypeName: "O",
    citizenshipName: "WNI",
    passportNumber: null,
    kitasNumber: null,
    marriageDate: "2010-06-01",
    divorceDate: null,
    fatherName: "Ayah Budi",
    motherName: "Ibu Budi",
    ...partial,
  };
}

describe("pembantu cetak Kartu Keluarga", () => {
  it("melabeli jenis kelamin dalam huruf kapital", () => {
    expect(genderLabelKk("male")).toBe("LAKI-LAKI");
    expect(genderLabelKk("female")).toBe("PEREMPUAN");
  });

  it("mengubah tanggal ISO ke format DD-MM-YYYY", () => {
    expect(tanggalKk("1985-04-12")).toBe("12-04-1985");
    expect(tanggalKk("2018-01-05")).toBe("05-01-2018");
  });

  it("mengembalikan null untuk tanggal kosong atau tidak lengkap", () => {
    expect(tanggalKk(null)).toBeNull();
    expect(tanggalKk("1985-04")).toBeNull();
    expect(tanggalKk("")).toBeNull();
  });

  it("menemukan kepala keluarga tanpa terpengaruh besar-kecil huruf", () => {
    const daftar = [
      anggota({ id: 2, name: "Siti", relationName: "ISTRI" }),
      anggota({ id: 1, name: "Budi", relationName: "Kepala Keluarga" }),
    ];

    expect(kepalaKeluarga(daftar)?.name).toBe("Budi");
  });

  it("mengembalikan null bila tidak ada kepala keluarga", () => {
    expect(kepalaKeluarga([anggota({ relationName: "ANAK" })])).toBeNull();
    expect(kepalaKeluarga([])).toBeNull();
  });
});
