import { describe, expect, it } from "vitest";

import {
  backupDesaSchema,
  kodeWilayahDariKodeDesa,
  mediaBackupValid,
  profilDesaSchema,
  sebutanDesaSchema,
} from "./pengaturan-desa";

describe("mediaBackupValid", () => {
  it("menerima path media dengan tenant dan ekstensi yang sesuai", () => {
    expect(mediaBackupValid("7/umum/1730000000000-logo-desa.png", 7, ["png"])).toBe(true);
    expect(mediaBackupValid(null, 7, ["png"])).toBe(true);
  });

  it("menolak media tenant lain dan path yang berpotensi keluar dari folder tenant", () => {
    expect(mediaBackupValid("8/umum/1730000000000-logo-desa.png", 7, ["png"])).toBe(false);
    expect(mediaBackupValid("7/umum/../logo.png", 7, ["png"])).toBe(false);
    expect(mediaBackupValid("7/umum/1730000000000-logo-desa.svg", 7, ["png"])).toBe(false);
  });
});

describe("kodeWilayahDariKodeDesa", () => {
  it("menurunkan kode provinsi, kabupaten, dan kecamatan dari kode desa 10 digit", () => {
    expect(kodeWilayahDariKodeDesa("11.01.01.2001")).toEqual({
      provinsi: "11",
      kabupaten: "1101",
      kecamatan: "110101",
    });
  });

  it("menolak kode yang belum lengkap", () => {
    expect(kodeWilayahDariKodeDesa("110101200")).toBeNull();
    expect(kodeWilayahDariKodeDesa("")).toBeNull();
  });
});

describe("profilDesaSchema", () => {
  const dasar = {
    namaDesa: "Desa Sukamaju",
    kodeDesa: "1101012001",
    namaKecamatan: "Sukamaju",
    namaKabupaten: "Kabupaten Contoh",
    namaPropinsi: "Provinsi Contoh",
    namaCamat: "Camat Contoh",
    nipCamat: "",
    kodeBps: "",
    kodePos: "12345",
    namaKepalaDesa: "Kepala Desa",
    nipKepalaDesa: "",
    visi: "",
    misi: "",
    sejarah: "",
    sambutan: "",
  };

  it("menerima kode BPS kosong atau 10 digit", () => {
    expect(profilDesaSchema.safeParse(dasar).success).toBe(true);
    expect(profilDesaSchema.safeParse({ ...dasar, kodeBps: "1101012001" }).success).toBe(true);
  });

  it("menolak kode BPS yang bukan 10 digit", () => {
    expect(profilDesaSchema.safeParse({ ...dasar, kodeBps: "110101" }).success).toBe(false);
  });

  it("menerima profil geografis dan polygon batas desa", () => {
    const parsed = profilDesaSchema.safeParse({
      ...dasar,
      alamat: "Jalan Desa No. 1",
      koordinat: "-6.2, 106.816666",
      luasWilayah: "120.5",
      batasUtara: "Desa A",
      ketinggian: "25 mdpl",
      batasDesa:
        '{"type":"Polygon","coordinates":[[[106.8,-6.2],[106.9,-6.2],[106.9,-6.3],[106.8,-6.2]]]}',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.luasWilayah).toBe("120.5");
      expect(parsed.data.koordinat).toBe("-6.2, 106.816666");
    }
  });

  it("menerima field profil ekologi, internet, dan adat", () => {
    const parsed = profilDesaSchema.safeParse({
      ...dasar,
      jenisTanah: "Sawah",
      topografi: "Dataran rendah",
      sumberDayaAlam: "Air dan hutan",
      floraFauna: "Padi dan burung",
      rawanBencana: "Banjir",
      kearifanLokal: "Gotong royong",
      jenisJaringan: "4G",
      providerInternet: "Telkomsel",
      cakupanWilayah: "Seluruh dusun",
      kecepatanInternet: "10 Mbps",
      aksesPublik: "Tersedia di kantor desa",
      statusDesa: "Adat",
      lembagaAdat: "Majelis Adat",
      wilayahAdat: "Dusun Adat",
      peraturanAdat: "Peraturan bersama",
      regulasiPenetapanKampungAdat: "SK 01/2026",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.statusDesa).toBe("Adat");
      expect(parsed.data.jenisJaringan).toBe("4G");
    }
  });

  it("menolak status desa di luar pilihan", () => {
    expect(profilDesaSchema.safeParse({ ...dasar, statusDesa: "Campuran" }).success).toBe(false);
  });

  it("menolak luas wilayah negatif dan koordinat di luar batas", () => {
    expect(profilDesaSchema.safeParse({ ...dasar, luasWilayah: "-1" }).success).toBe(false);
    expect(profilDesaSchema.safeParse({ ...dasar, koordinat: "-100, 20" }).success).toBe(false);
  });

  it("menolak polygon batas desa yang tidak tertutup", () => {
    const parsed = profilDesaSchema.safeParse({
      ...dasar,
      batasDesa: '{"type":"Polygon","coordinates":[[[106.8,-6.2],[106.9,-6.2],[106.9,-6.3]]]}',
    });

    expect(parsed.success).toBe(false);
  });

  it("memberi nilai bawaan untuk sebutan wilayah", () => {
    const parsed = sebutanDesaSchema.parse({});

    expect(parsed.desa).toBe("Desa");
    expect(parsed.kecamatan).toBe("Kecamatan");
    expect(parsed.camat).toBe("Camat");
    expect(sebutanDesaSchema.parse({ desa: "Nagari" }).desa).toBe("Nagari");
    expect(sebutanDesaSchema.safeParse({ desa: "  " }).success).toBe(false);
  });
});

describe("backupDesaSchema", () => {
  it("tetap menerima backup lama tanpa field identitas baru", () => {
    const backup = {
      format: "flexidesa-village-settings",
      version: 1,
      desa: {
        nama: "Desa Lama",
        kode: null,
        kecamatan: null,
        kabupaten: null,
        provinsi: null,
        kodePos: null,
        alamat: null,
        email: null,
        telepon: null,
        website: null,
        logo: null,
        kepalaDesa: null,
        nip: null,
      },
      profil: null,
      tema: null,
      layanan: [],
      kontak: null,
      integrasi: null,
      favicon: null,
      template: null,
      umum: {
        komentarAktif: true,
        beritaBeranda: 5,
        pendaftaranWargaAktif: true,
        penomoranSurat: 2,
      },
    };
    const parsed = backupDesaSchema.safeParse(backup);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.desa.kodeBps).toBeUndefined();
  });
});
