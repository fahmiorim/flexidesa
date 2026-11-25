import { describe, expect, it } from "vitest";

import {
  barisEksporPenduduk,
  KOLOM_EKSPOR_PENDUDUK,
  type PendudukEksporRow,
} from "./penduduk-export";

const baris: PendudukEksporRow = {
  id: 1,
  nationalId: "3201010101010009",
  familyId: 10,
  name: "Ani",
  gender: "female",
  birthPlace: "Bukittinggi",
  birthDate: "1990-02-01",
  ktpEl: "ktpEl",
  statusRekam: "sudahRekam",
  idCardTag: "1234567890",
  ktpIssuedPlace: null,
  ktpIssuedDate: null,
  previousFamilyNumber: null,
  arrivalPurpose: null,
  birthTime: null,
  birthPlaceType: null,
  birthType: null,
  birthChildNumber: null,
  birthAssistant: null,
  birthWeightGram: null,
  birthLengthCm: null,
  religionId: 1,
  educationId: 3,
  educationSedangId: null,
  occupationId: 4,
  migrantWorker: null,
  maritalStatusId: 2,
  familyRelationId: 3,
  bloodTypeId: 2,
  citizenshipId: 1,
  originCountry: null,
  adat: null,
  marga: null,
  residenceStatus: "permanent",
  lifeStatus: "alive",
  regionId: 7,
  address: "Jl. Lama 1",
  previousAddress: null,
  currentAddress: "Jl. Baru 1",
  latitude: "-6.2",
  longitude: "106.816666",
  phone: null,
  email: null,
  telegram: null,
  contactMethod: null,
  fatherName: "Budi",
  motherName: "Siti",
  fatherNationalId: null,
  motherNationalId: null,
  birthCertificateNumber: "AK-1",
  marriageCertificateNumber: null,
  marriageDate: null,
  divorceCertificateNumber: null,
  divorceDate: null,
  passportNumber: null,
  passportExpiryDate: null,
  kitasNumber: null,
  ethnicity: "Batak",
  disability: "none",
  chronicIllness: null,
  kbMethod: "none",
  pregnancyStatus: "pregnant",
  insurance: "bpjsPbi",
  insuranceNumber: "000123",
  insuranceStatus: null,
  bpjsEmploymentNumber: null,
  literacy: null,
  notes: "Catatan",
  religionName: "Islam",
  educationName: "SLTA/Sederajat",
  educationSedangName: null,
  occupationName: "Petani",
  maritalStatusName: "Kawin",
  familyRelationName: "Istri",
  bloodTypeName: "B",
  citizenshipName: "Warga Negara Indonesia",
  familyNumber: "3201010101010001",
  dusun: "Sukamaju",
  rw: "01",
  rt: "02",
};

describe("ekspor penduduk", () => {
  it("memakai 44 kolom yang sama dengan OpenSID", () => {
    expect(KOLOM_EKSPOR_PENDUDUK).toHaveLength(44);
    expect(KOLOM_EKSPOR_PENDUDUK[0]).toBe("alamat");
    expect(KOLOM_EKSPOR_PENDUDUK).toContain("alamat_sekarang");
    expect(KOLOM_EKSPOR_PENDUDUK.at(-1)).toBe("ket");
  });

  it("menulis nilai katalog, enum, dan wilayah pada posisi yang benar", () => {
    const hasil = barisEksporPenduduk(baris);

    expect(hasil).toHaveLength(KOLOM_EKSPOR_PENDUDUK.length);
    expect(hasil.slice(0, 11)).toEqual([
      "Jl. Lama 1",
      "Sukamaju",
      "01",
      "02",
      "Ani",
      "3201010101010001",
      "3201010101010009",
      "Perempuan",
      "Bukittinggi",
      "1990-02-01",
      "Islam",
    ]);
    expect(hasil[30]).toBe("Tidak Cacat");
    expect(hasil[31]).toBe("Tidak Menggunakan");
    expect(hasil[32]).toBe("Hamil");
    expect(hasil[33]).toBe("KTP-EL");
    expect(hasil[34]).toBe("Sudah Rekam");
    expect(hasil[35]).toBe("Jl. Baru 1");
    expect(hasil[36]).toBe("Hidup");
    expect(hasil[37]).toBe("Batak");
    expect(hasil[38]).toBe("1234567890");
    expect(hasil[39]).toBe("BPJS Penerima Bantuan Iuran");
    expect(hasil[40]).toBe("000123");
    expect(hasil[41]).toBe("-6.2");
    expect(hasil[42]).toBe("106.816666");
    expect(hasil[43]).toBe("Catatan");
  });
});
