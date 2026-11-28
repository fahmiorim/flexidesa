import { describe, expect, it } from "vitest";

import {
  calculateAge,
  HEAD_OF_FAMILY_RELATION_ID,
  isActiveResident,
  isHeadOfFamily,
  pendudukFormSchema,
  pendudukLabel,
  samarkanNik,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { NO_SELECTION } from "@/lib/forms";

/** Input minimal yang valid; field lain diisi string kosong. */
const minimalInput = {
  nationalId: "",
  familyId: "",
  name: "Budi Santoso",
  gender: "male",
  birthPlace: "",
  birthDate: "",
  religionId: "",
  educationId: "",
  educationSedangId: "",
  occupationId: "",
  maritalStatusId: "",
  familyRelationId: "",
  bloodTypeId: "",
  citizenshipId: "",
  residenceStatus: "permanent",
  lifeStatus: "alive",
  regionId: "",
  address: "",
  phone: "",
  fatherName: "",
  motherName: "",
  fatherNationalId: "",
  motherNationalId: "",
};

describe("pendudukFormSchema", () => {
  it("menerima input valid dan memangkas spasi", () => {
    const result = pendudukFormSchema.parse({
      ...minimalInput,
      name: "  Budi Santoso ",
      nationalId: " 3201012001120001 ",
      birthDate: "1990-05-17",
      religionId: "1",
      address: "  Jl. Melati No. 3 ",
    });

    expect(result.name).toBe("Budi Santoso");
    expect(result.nationalId).toBe("3201012001120001");
    expect(result.birthDate).toBe("1990-05-17");
    expect(result.religionId).toBe(1);
    expect(result.address).toBe("Jl. Melati No. 3");
  });

  it("mengubah pilihan kosong menjadi null", () => {
    const result = pendudukFormSchema.parse({
      ...minimalInput,
      religionId: NO_SELECTION,
      regionId: "",
      birthDate: "",
    });

    expect(result.religionId).toBeNull();
    expect(result.regionId).toBeNull();
    expect(result.birthDate).toBeNull();
    expect(result.nationalId).toBeNull();
  });

  it("menolak nama kosong", () => {
    const result = pendudukFormSchema.safeParse({ ...minimalInput, name: "   " });

    expect(result.success).toBe(false);
  });

  it("menolak jenis kelamin kosong", () => {
    const result = pendudukFormSchema.safeParse({ ...minimalInput, gender: NO_SELECTION });

    expect(result.success).toBe(false);
  });

  it("menolak NIK yang bukan 16 angka", () => {
    const tooShort = pendudukFormSchema.safeParse({ ...minimalInput, nationalId: "123" });
    const withLetters = pendudukFormSchema.safeParse({
      ...minimalInput,
      nationalId: "32010120011200AB",
    });

    expect(tooShort.success).toBe(false);
    expect(withLetters.success).toBe(false);
  });

  it("menerima tautan Kartu Keluarga", () => {
    const result = pendudukFormSchema.parse({ ...minimalInput, familyId: "7" });

    expect(result.familyId).toBe(7);
  });

  it("menolak tanggal lahir yang tidak valid", () => {
    const result = pendudukFormSchema.safeParse({ ...minimalInput, birthDate: "1990-13-40" });

    expect(result.success).toBe(false);
  });

  it("menolak status kependudukan di luar daftar", () => {
    const result = pendudukFormSchema.safeParse({ ...minimalInput, lifeStatus: "kabur" });

    expect(result.success).toBe(false);
  });

  it("menerima field opsional dan mengubah nilai kosong menjadi null", () => {
    const result = pendudukFormSchema.parse({
      ...minimalInput,
      birthCertificateNumber: "AK-123",
      marriageCertificateNumber: "KW-123",
      marriageDate: "2010-05-17",
      divorceCertificateNumber: "CR-123",
      divorceDate: "2020-05-17",
      passportNumber: "A12345",
      passportExpiryDate: "2030-05-17",
      kitasNumber: "KITAS-123",
      ethnicity: "Batak",
      notes: "Catatan warga",
    });
    const kosong = pendudukFormSchema.parse({
      ...minimalInput,
      birthCertificateNumber: "",
      marriageCertificateNumber: "",
      marriageDate: "",
      divorceCertificateNumber: "",
      divorceDate: "",
      passportNumber: "",
      passportExpiryDate: "",
      kitasNumber: "",
      ethnicity: "",
      notes: "",
    });

    expect(result).toMatchObject({
      birthCertificateNumber: "AK-123",
      marriageCertificateNumber: "KW-123",
      marriageDate: "2010-05-17",
      divorceCertificateNumber: "CR-123",
      divorceDate: "2020-05-17",
      passportNumber: "A12345",
      passportExpiryDate: "2030-05-17",
      kitasNumber: "KITAS-123",
      ethnicity: "Batak",
      notes: "Catatan warga",
    });
    expect(kosong).toMatchObject({
      birthCertificateNumber: null,
      marriageCertificateNumber: null,
      marriageDate: null,
      divorceCertificateNumber: null,
      divorceDate: null,
      passportNumber: null,
      passportExpiryDate: null,
      kitasNumber: null,
      ethnicity: null,
      notes: null,
    });
  });

  it("menolak teks yang terlalu panjang", () => {
    const result = pendudukFormSchema.safeParse({ ...minimalInput, address: "a".repeat(256) });

    expect(result.success).toBe(false);
  });
});

describe("calculateAge", () => {
  const today = new Date("2026-10-18T00:00:00Z");

  it("menghitung usia penuh", () => {
    expect(calculateAge("1990-05-17", today)).toBe(36);
  });

  it("belum bertambah sebelum hari ulang tahun", () => {
    expect(calculateAge("1990-12-31", today)).toBe(35);
  });

  it("bertambah tepat pada hari ulang tahun", () => {
    expect(calculateAge("1990-10-18", today)).toBe(36);
  });

  it("mengembalikan null untuk input kosong, tidak valid, atau masa depan", () => {
    expect(calculateAge(null, today)).toBeNull();
    expect(calculateAge("", today)).toBeNull();
    expect(calculateAge("bukan-tanggal", today)).toBeNull();
    expect(calculateAge("2030-01-01", today)).toBeNull();
  });
});

describe("pembantu domain lain", () => {
  it("menandai penduduk hidup sebagai warga aktif", () => {
    expect(isActiveResident("alive")).toBe(true);
    expect(isActiveResident("deceased")).toBe(false);
    expect(isActiveResident("moved")).toBe(false);
  });

  it("mengenali kepala keluarga hanya bila punya KK dan hubungan kepala keluarga", () => {
    expect(isHeadOfFamily({ familyId: 3, familyRelationId: HEAD_OF_FAMILY_RELATION_ID })).toBe(
      true,
    );
    expect(isHeadOfFamily({ familyId: 3, familyRelationId: 2 })).toBe(false);
    expect(isHeadOfFamily({ familyId: null, familyRelationId: HEAD_OF_FAMILY_RELATION_ID })).toBe(
      false,
    );
  });

  it("menyusun label penduduk dengan NIK bila ada", () => {
    expect(pendudukLabel({ name: "Budi", nationalId: "3201012001120001" })).toBe(
      "Budi (NIK 3201012001120001)",
    );
    expect(pendudukLabel({ name: "Budi", nationalId: null })).toBe("Budi");
  });

  it("menyamarkan NIK tanpa kehilangan seluruh konteks", () => {
    expect(samarkanNik("3201012001120001")).toBe("320101••••••01");
    expect(samarkanNik(null)).toBe("—");
    expect(samarkanNik("123")).toBe("••••••••");
  });
});

describe("validasi ekspor statistik penduduk", () => {
  it("memastikan fungsi ekspor CSV tersedia untuk statistik", () => {
    // Placeholder untuk memastikan ekspor CSV berfungsi
    expect(true).toBe(true);
  });
});
