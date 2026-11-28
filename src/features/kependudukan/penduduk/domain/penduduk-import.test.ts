import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import type { BarisImpor } from "@/lib/spreadsheet";

import {
  bacaBerkasImporPenduduk,
  buatTemplateImporPenduduk,
  KOLOM_IMPOR_PENDUDUK,
  normalisasiAsuransi,
  normalisasiCaraKb,
  normalisasiDisabilitas,
  normalisasiJenisKelamin,
  normalisasiKtpEl,
  normalisasiStatusHamil,
  normalisasiStatusRekam,
  normalisasiTanggal,
  validasiImporPenduduk,
  type KatalogImpor,
  type KunciImporPenduduk,
} from "./penduduk-import";

const katalog: KatalogImpor = {
  religions: [
    { id: 1, name: "Islam" },
    { id: 2, name: "Kristen" },
  ],
  educations: [
    { id: 3, name: "SLTA/Sederajat" },
    { id: 5, name: "Belum Sekolah" },
  ],
  occupations: [
    { id: 1, name: "Belum/Tidak Bekerja" },
    { id: 4, name: "Petani" },
  ],
  maritalStatuses: [
    { id: 1, name: "Belum Kawin" },
    { id: 2, name: "Kawin" },
  ],
  familyRelations: [
    { id: 1, name: "Kepala Keluarga" },
    { id: 2, name: "Suami" },
    { id: 3, name: "Istri" },
    { id: 4, name: "Anak" },
  ],
  bloodTypes: [
    { id: 1, name: "A" },
    { id: 2, name: "B" },
  ],
  citizenships: [{ id: 1, name: "Warga Negara Indonesia" }],
  families: [
    { id: 10, number: "3201010101010001" },
    { id: 11, number: "3201010101010002" },
  ],
};

function nilai(
  isi: Partial<Record<KunciImporPenduduk, string>>,
): Record<KunciImporPenduduk, string> {
  const dasar = Object.fromEntries(
    [
      "nik",
      "nama",
      "jenisKelamin",
      "tempatLahir",
      "tanggalLahir",
      "agama",
      "pendidikan",
      "pendidikanSedang",
      "pekerjaan",
      "statusKawin",
      "hubunganKeluarga",
      "golonganDarah",
      "kewarganegaraan",
      "statusPenduduk",
      "statusTinggal",
      "alamat",
      "dusun",
      "rw",
      "rt",
      "alamatSekarang",
      "latitude",
      "longitude",
      "telepon",
      "nikAyah",
      "namaAyah",
      "nikIbu",
      "namaIbu",
      "noKk",
      "aktaLahir",
      "aktaKawin",
      "tanggalKawin",
      "aktaCerai",
      "tanggalCerai",
      "paspor",
      "masaBerlakuPaspor",
      "kitas",
      "suku",
      "ktpEl",
      "statusRekam",
      "tagIdCard",
      "cacat",
      "caraKb",
      "hamil",
      "asuransi",
      "noAsuransi",
      "keterangan",
    ].map((kunci) => [kunci, ""]),
  ) as Record<KunciImporPenduduk, string>;
  return { ...dasar, ...isi };
}

function baris(
  nomor: number,
  isi: Partial<Record<KunciImporPenduduk, string>>,
): BarisImpor<KunciImporPenduduk> {
  return { baris: nomor, nilai: nilai(isi), tambahan: {} };
}

describe("normalisasi nilai impor", () => {
  it("menerima variasi jenis kelamin", () => {
    expect(normalisasiJenisKelamin("L")).toBe("male");
    expect(normalisasiJenisKelamin("Laki-laki")).toBe("male");
    expect(normalisasiJenisKelamin("P")).toBe("female");
    expect(normalisasiJenisKelamin("Perempuan")).toBe("female");
    expect(normalisasiJenisKelamin("1")).toBe("male");
    expect(normalisasiJenisKelamin("2")).toBe("female");
    expect(normalisasiJenisKelamin("X")).toBeNull();
  });

  it("menerima kode dan label enum", () => {
    expect(normalisasiKtpEl("2")).toBe("ktpEl");
    expect(normalisasiKtpEl("KIA")).toBe("kia");
    expect(normalisasiStatusRekam("3")).toBe("sudahRekam");
    expect(normalisasiStatusRekam("Card Printed")).toBe("cardPrinted");
    expect(normalisasiDisabilitas("7")).toBe("none");
    expect(normalisasiDisabilitas("Cacat Netra/Buta")).toBe("blind");
    expect(normalisasiCaraKb("99")).toBe("other");
    expect(normalisasiCaraKb("100")).toBe("none");
    expect(normalisasiCaraKb("Suntik")).toBe("injection");
    expect(normalisasiStatusHamil("1")).toBe("pregnant");
    expect(normalisasiAsuransi("2")).toBe("bpjsPbi");
    expect(normalisasiAsuransi("Asuransi Lainnya")).toBe("other");
  });

  it("menerima tanggal lokal maupun ISO", () => {
    expect(normalisasiTanggal("17-08-1990")).toBe("1990-08-17");
    expect(normalisasiTanggal("17/8/1990")).toBe("1990-08-17");
    expect(normalisasiTanggal("1990-08-17")).toBe("1990-08-17");
    expect(normalisasiTanggal("bukan tanggal")).toBe("bukan tanggal");
  });
});

describe("validasiImporPenduduk", () => {
  const konteks = { katalog, nikTerdaftar: new Set<string>(), kkSudahAdaKepala: new Set<number>() };

  it("memetakan label katalog dan tanggal ke input formulir", () => {
    const hasil = validasiImporPenduduk(
      [
        baris(1, {
          nik: "3201010101010009",
          nama: "Ani",
          jenisKelamin: "P",
          tanggalLahir: "01-02-1990",
          agama: "islam",
          pendidikan: "SLTA/Sederajat",
          pekerjaan: "Petani",
          statusKawin: "Kawin",
          hubunganKeluarga: "Istri",
          golonganDarah: "B",
          kewarganegaraan: "warga negara indonesia",
          noKk: "3201010101010001",
          aktaLahir: "AK-123",
          aktaKawin: "KW-123",
          tanggalKawin: "17-05-2010",
          aktaCerai: "CR-123",
          tanggalCerai: "17-05-2020",
          paspor: "A12345",
          masaBerlakuPaspor: "17-05-2030",
          kitas: "KITAS-123",
          suku: "Batak",
          keterangan: "Catatan warga",
        }),
      ],
      konteks,
    );

    expect(hasil.galat).toEqual([]);
    expect(hasil.siap).toHaveLength(1);
    expect(hasil.siap[0]?.wilayah).toBeNull();
    expect(hasil.siap[0]?.input).toMatchObject({
      nationalId: "3201010101010009",
      name: "Ani",
      gender: "female",
      birthDate: "1990-02-01",
      religionId: 1,
      educationId: 3,
      occupationId: 4,
      maritalStatusId: 2,
      familyRelationId: 3,
      bloodTypeId: 2,
      citizenshipId: 1,
      familyId: 10,
      lifeStatus: "alive",
      residenceStatus: "permanent",
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
  });

  it("memetakan kolom tambahan: wilayah, koordinat, dan enum", () => {
    const hasil = validasiImporPenduduk(
      [
        baris(1, {
          nik: "3201010101010009",
          nama: "Ani",
          jenisKelamin: "2",
          dusun: "Sukamaju",
          rw: "01",
          rt: "02",
          alamatSekarang: "Jl. Baru 1",
          latitude: "-6.2",
          longitude: "106.816666",
          ktpEl: "2",
          statusRekam: "3",
          tagIdCard: "1234567890",
          cacat: "7",
          caraKb: "100",
          hamil: "1",
          asuransi: "2",
          noAsuransi: "000123",
          statusPenduduk: "1",
        }),
      ],
      konteks,
    );

    expect(hasil.galat).toEqual([]);
    expect(hasil.siap[0]?.wilayah).toEqual({ dusun: "Sukamaju", rw: "01", rt: "02" });
    expect(hasil.siap[0]?.input).toMatchObject({
      gender: "female",
      currentAddress: "Jl. Baru 1",
      latitude: "-6.2",
      longitude: "106.816666",
      ktpEl: "ktpEl",
      statusRekam: "sudahRekam",
      idCardTag: "1234567890",
      disability: "none",
      kbMethod: "none",
      pregnancyStatus: "pregnant",
      insurance: "bpjsPbi",
      insuranceNumber: "000123",
      lifeStatus: "alive",
    });
  });

  it("menolak RW/RT tanpa dusun dan koordinat yang tidak berpasangan", () => {
    const hasil = validasiImporPenduduk(
      [
        baris(1, {
          nik: "3201010101010009",
          nama: "Ani",
          jenisKelamin: "P",
          rw: "01",
          latitude: "-6.2",
        }),
      ],
      konteks,
    );

    expect(hasil.siap).toHaveLength(0);
    expect(hasil.galat[0]?.pesan).toContain("Dusun wajib");
    expect(hasil.galat[0]?.pesan).toContain("berpasangan");
  });

  it("melaporkan NIK ganda di dalam berkas", () => {
    const hasil = validasiImporPenduduk(
      [
        baris(1, { nik: "3201010101010009", nama: "Ani", jenisKelamin: "P" }),
        baris(2, { nik: "3201010101010009", nama: "Ani Lain", jenisKelamin: "P" }),
      ],
      konteks,
    );

    expect(hasil.siap).toHaveLength(1);
    expect(hasil.galat).toHaveLength(1);
    expect(hasil.galat[0]?.pesan).toContain("duplikat");
  });

  it("melaporkan NIK yang sudah terdaftar di desa", () => {
    const hasil = validasiImporPenduduk(
      [baris(1, { nik: "3201010101010009", nama: "Ani", jenisKelamin: "P" })],
      { ...konteks, nikTerdaftar: new Set(["3201010101010009"]) },
    );

    expect(hasil.siap).toHaveLength(0);
    expect(hasil.galat[0]?.pesan).toContain("sudah terdaftar");
  });

  it("menolak katalog dan nomor KK yang tidak dikenal", () => {
    const hasil = validasiImporPenduduk(
      [
        baris(1, {
          nik: "3201010101010009",
          nama: "Ani",
          jenisKelamin: "P",
          agama: "Agama Bumi",
          noKk: "9999999999999999",
        }),
      ],
      konteks,
    );

    expect(hasil.siap).toHaveLength(0);
    expect(hasil.galat[0]?.pesan).toContain("Agama");
    expect(hasil.galat[0]?.pesan).toContain("Nomor KK");
  });

  it("menolak dua kepala keluarga pada KK yang sama", () => {
    const hasil = validasiImporPenduduk(
      [
        baris(1, {
          nik: "3201010101010009",
          nama: "Kepala Satu",
          jenisKelamin: "L",
          hubunganKeluarga: "Kepala Keluarga",
          noKk: "3201010101010001",
        }),
        baris(2, {
          nik: "3201010101010010",
          nama: "Kepala Dua",
          jenisKelamin: "L",
          hubunganKeluarga: "Kepala Keluarga",
          noKk: "3201010101010001",
        }),
      ],
      konteks,
    );

    expect(hasil.galat).toHaveLength(1);
    expect(hasil.galat[0]?.baris).toBe(2);
    expect(hasil.galat[0]?.pesan).toContain("lebih dari satu kepala keluarga");
  });
});

describe("template impor", () => {
  it("memuat seluruh kolom impor dan sheet contoh yang bisa disalin", async () => {
    const isi = await buatTemplateImporPenduduk(katalog);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(isi as unknown as ArrayBuffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Penduduk",
      "Petunjuk",
      "Contoh",
    ]);
    expect(workbook.getWorksheet("Penduduk")?.getRow(1).cellCount).toBe(
      KOLOM_IMPOR_PENDUDUK.length,
    );

    const contoh = workbook.getWorksheet("Contoh");
    expect(contoh?.getRow(2).getCell(2).value).toBe("Contoh Penduduk");
    expect(contoh?.getRow(2).getCell(17).value).toBe("Dusun Contoh");
    expect(contoh?.getRow(2).getCell(40).value).toBe("1234567890");
  });
});

describe("bacaBerkasImporPenduduk", () => {
  it("membaca seluruh 44 header ekspor", async () => {
    const header = [
      "alamat",
      "dusun",
      "rw",
      "rt",
      "nama",
      "no_kk",
      "nik",
      "sex",
      "tempatlahir",
      "tanggallahir",
      "agama_id",
      "pendidikan_kk_id",
      "pendidikan_sedang_id",
      "pekerjaan_id",
      "status_kawin",
      "kk_level",
      "warganegara_id",
      "ayah_nik",
      "nama_ayah",
      "ibu_nik",
      "nama_ibu",
      "golongan_darah_id",
      "akta_lahir",
      "dokumen_pasport",
      "tanggal_akhir_paspor",
      "dokumen_kitas",
      "akta_perkawinan",
      "tanggalperkawinan",
      "akta_perceraian",
      "tanggalperceraian",
      "cacat_id",
      "cara_kb_id",
      "hamil",
      "ktp_el",
      "status_rekam",
      "alamat_sekarang",
      "status_dasar",
      "suku",
      "tag_id_card",
      "id_asuransi",
      "no_asuransi",
      "lat",
      "lng",
      "ket",
    ];
    const isi = Array<string>(44).fill("");
    Object.assign(isi, {
      1: "Sukamaju",
      2: "01",
      3: "02",
      4: "Ani",
      6: "3201010101010009",
      7: "P",
      8: "Bukittinggi",
      9: "1990-02-01",
      30: "7",
      31: "100",
      32: "1",
      33: "2",
      34: "3",
      35: "Jl. Baru 1",
      36: "1",
      38: "1234567890",
      39: "2",
      40: "000123",
      41: "-6.2",
      42: "106.816666",
      43: "Catatan",
    });

    const hasil = await bacaBerkasImporPenduduk(
      Buffer.from([header.join(","), isi.join(",")].join("\n")),
      "penduduk.csv",
    );

    expect(hasil.headerTakDikenal).toEqual([]);
    expect(hasil.baris[0]?.nilai).toMatchObject({
      dusun: "Sukamaju",
      rw: "01",
      rt: "02",
      alamatSekarang: "Jl. Baru 1",
      cacat: "7",
      caraKb: "100",
      hamil: "1",
      ktpEl: "2",
      statusRekam: "3",
      tagIdCard: "1234567890",
      asuransi: "2",
      noAsuransi: "000123",
      latitude: "-6.2",
      longitude: "106.816666",
      keterangan: "Catatan",
    });

    const validasi = validasiImporPenduduk(hasil.baris, {
      katalog,
      nikTerdaftar: new Set(),
      kkSudahAdaKepala: new Set(),
    });
    expect(validasi.galat).toEqual([]);
    expect(validasi.siap[0]?.input).toMatchObject({
      disability: "none",
      kbMethod: "none",
      pregnancyStatus: "pregnant",
      ktpEl: "ktpEl",
      statusRekam: "sudahRekam",
      insurance: "bpjsPbi",
    });
  });

  it("membaca CSV ekspor data desa dan memetakan header", async () => {
    const csv = [
      "NIK,Nama,Jenis Kelamin,Tempat Lahir,Tanggal Lahir,Agama,No. KK,Akta Lahir,Akta Perkawinan,Tanggal Perkawinan,Akta Perceraian,Tanggal Perceraian,No. Paspor,Tanggal Akhir Paspor,No. KITAS,Suku/Etnis,Keterangan",
      "3201010101010009,ANI,P,BUKITTINGGI,17-08-1990,ISLAM,3201010101010001,AK-1,KW-1,17-05-2010,CR-1,17-05-2020,A123,17-05-2030,KITAS-1,Batak,Catatan",
    ].join("\n");

    const hasil = await bacaBerkasImporPenduduk(Buffer.from(csv), "penduduk.csv");

    expect(hasil.galat).toEqual([]);
    expect(hasil.baris).toHaveLength(1);
    expect(hasil.baris[0]?.nilai.nama).toBe("ANI");
    expect(hasil.baris[0]?.nilai.jenisKelamin).toBe("P");
    expect(hasil.baris[0]?.nilai.noKk).toBe("3201010101010001");
    expect(hasil.baris[0]?.nilai.aktaLahir).toBe("AK-1");
    expect(hasil.baris[0]?.nilai.aktaKawin).toBe("KW-1");
    expect(hasil.baris[0]?.nilai.tanggalKawin).toBe("17-05-2010");
    expect(hasil.baris[0]?.nilai.aktaCerai).toBe("CR-1");
    expect(hasil.baris[0]?.nilai.tanggalCerai).toBe("17-05-2020");
    expect(hasil.baris[0]?.nilai.paspor).toBe("A123");
    expect(hasil.baris[0]?.nilai.masaBerlakuPaspor).toBe("17-05-2030");
    expect(hasil.baris[0]?.nilai.kitas).toBe("KITAS-1");
    expect(hasil.baris[0]?.nilai.suku).toBe("Batak");
    expect(hasil.baris[0]?.nilai.keterangan).toBe("Catatan");
  });
});
