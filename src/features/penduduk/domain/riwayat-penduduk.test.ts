import { describe, expect, it } from "vitest";

import {
  buildRiwayatPendudukCsv,
  catatDatangSchema,
  catatKelahiranSchema,
  catatKematianSchema,
  catatPerubahanSchema,
  catatPindahKeluarSchema,
  MUTATION_TYPE_LABELS,
  MUTATION_TYPES,
  normalisasiMutationType,
  normalisasiTanggal,
  opsiStatusDasar,
  riwayatPendudukFilename,
  ubahStatusDasarSchema,
  type RiwayatPendudukRow,
} from "@/features/penduduk/domain/riwayat-penduduk";

const kelahiran = {
  eventDate: "2026-10-25",
  name: "  Bayi Baru ",
  nationalId: "3201012001120001",
  gender: "female",
  familyId: "",
  familyRelationId: "",
  regionId: "",
  address: "",
  fatherName: "",
  motherName: "",
  reason: "",
  notes: "",
  referenceNo: "",
};

const kedatangan = {
  eventDate: "2026-10-25",
  name: "Warga Datang",
  nationalId: "",
  gender: "",
  birthDate: "",
  birthPlace: "",
  familyId: "",
  familyRelationId: "",
  regionId: "",
  address: "",
  fromAddress: "",
  reason: "",
  notes: "",
  referenceNo: "",
};

describe("skema riwayat penduduk", () => {
  it("memetakan setiap jenis mutasi ke label", () => {
    for (const type of MUTATION_TYPES) {
      expect(MUTATION_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it("menerima kelahiran valid dan mengosongkan pilihan kosong", () => {
    const parsed = catatKelahiranSchema.parse(kelahiran);

    expect(parsed.name).toBe("Bayi Baru");
    expect(parsed.familyId).toBeNull();
    expect(parsed.familyRelationId).toBeNull();
    expect(parsed.regionId).toBeNull();
    expect(parsed.nationalId).toBe("3201012001120001");
  });

  it("menolak NIK dan tanggal yang tidak valid", () => {
    expect(catatKelahiranSchema.safeParse({ ...kelahiran, nationalId: "123" }).success).toBe(false);
    expect(catatKelahiranSchema.safeParse({ ...kelahiran, eventDate: "25-10-2026" }).success).toBe(
      false,
    );
  });

  it("menerima kedatangan tanpa tanggal lahir", () => {
    const parsed = catatDatangSchema.parse(kedatangan);

    expect(parsed.birthDate).toBeNull();
    expect(parsed.nationalId).toBeNull();
  });

  it("menerima perubahan status yang valid", () => {
    const parsed = catatPerubahanSchema.parse({
      residentId: "12",
      eventDate: "2026-10-25",
      lifeStatus: "missing",
      referenceNo: "",
      reason: "",
      notes: "",
    });

    expect(parsed.residentId).toBe(12);
    expect(parsed.lifeStatus).toBe("missing");
    expect(parsed.reason).toBe("");
  });

  it("menolak status kependudukan yang tidak dikenal", () => {
    expect(
      catatPerubahanSchema.safeParse({
        residentId: "12",
        eventDate: "2026-10-25",
        lifeStatus: "pindah",
      }).success,
    ).toBe(false);
  });

  it("mewajibkan penduduk pada kematian dan pindah keluar", () => {
    expect(
      catatKematianSchema.safeParse({ residentId: "0", eventDate: "2026-10-25" }).success,
    ).toBe(false);
    expect(
      catatPindahKeluarSchema.safeParse({ residentId: "", eventDate: "2026-10-25" }).success,
    ).toBe(false);
  });
});

describe("normalisasi filter riwayat", () => {
  it("memakai 'all' untuk jenis yang tidak dikenal", () => {
    expect(normalisasiMutationType("change")).toBe("change");
    expect(normalisasiMutationType("hapus")).toBe("all");
    expect(normalisasiMutationType(null)).toBe("all");
  });

  it("hanya menerima tanggal ISO", () => {
    expect(normalisasiTanggal("2026-10-25")).toBe("2026-10-25");
    expect(normalisasiTanggal("25-10-2026")).toBe("");
    expect(normalisasiTanggal(null)).toBe("");
  });
});

const barisRiwayat: RiwayatPendudukRow = {
  id: 1,
  villageId: 1,
  residentId: 2,
  type: "change",
  eventDate: "2026-10-25",
  reportedAt: new Date("2026-10-25T08:00:00Z"),
  actorId: "user-1",
  reason: "Alasan; khusus",
  notes: 'Catatan "penting"',
  referenceNo: "474/2026",
  fromRegionId: null,
  toRegionId: null,
  fromAddress: null,
  toAddress: null,
  meta: null,
  residentName: "Warga Contoh",
  residentNationalId: "3201012001120001",
  actorName: "Operator",
  gender: "male",
  birthDate: "1990-01-01",
  lifeStatus: "alive",
  religionId: null,
  religionName: null,
  familyNumber: "3201010101900001",
  familyHeadName: "Kepala Contoh",
  dusun: "Sumber",
  rw: "001",
  rt: "002",
};

describe("ubah status dasar (paritas OpenSID)", () => {
  it("menawarkan opsi sesuai status tinggal dan peran KK", () => {
    expect(
      opsiStatusDasar({ residenceStatus: "permanent", kepalaKeluarga: false, jumlahAnggotaKk: 3 }),
    ).toEqual(["deceased", "moved", "missing"]);
    expect(
      opsiStatusDasar({ residenceStatus: "temporary", kepalaKeluarga: false, jumlahAnggotaKk: 3 }),
    ).toEqual(["deceased", "moved", "missing", "departed"]);
    // Kepala KK dengan anggota lebih dari satu tidak dapat langsung Mati.
    expect(
      opsiStatusDasar({ residenceStatus: "permanent", kepalaKeluarga: true, jumlahAnggotaKk: 4 }),
    ).toEqual(["moved", "missing"]);
  });

  it("mewajibkan detail kematian bila status Mati", () => {
    const dasar = {
      residentId: "5",
      lifeStatus: "deceased",
      eventDate: "2026-10-25",
      reportDate: "2026-10-26",
      notes: "",
    };
    expect(ubahStatusDasarSchema.safeParse(dasar).success).toBe(false);
    expect(
      ubahStatusDasarSchema.safeParse({
        ...dasar,
        tempatMeninggal: "Rumah",
        sebab: "1",
        penolong: "1",
        anakKe: "2",
      }).success,
    ).toBe(true);
  });

  it("mewajibkan tujuan/alamat pindah bila status Pindah", () => {
    const dasar = {
      residentId: "5",
      lifeStatus: "moved",
      eventDate: "2026-10-25",
      reportDate: "2026-10-25",
    };
    expect(ubahStatusDasarSchema.safeParse(dasar).success).toBe(false);
    expect(
      ubahStatusDasarSchema.safeParse({ ...dasar, refPindah: "3", alamatTujuan: "Kota X" }).success,
    ).toBe(true);
  });

  it("menolak tanggal lapor sebelum tanggal peristiwa", () => {
    expect(
      ubahStatusDasarSchema.safeParse({
        residentId: "5",
        lifeStatus: "missing",
        eventDate: "2026-10-26",
        reportDate: "2026-10-25",
      }).success,
    ).toBe(false);
  });
});

describe("csv riwayat penduduk", () => {
  it("memuat BOM, judul, desa, dan label jenis", () => {
    const csv = buildRiwayatPendudukCsv({ namaDesa: "Desa Contoh", rows: [barisRiwayat] });

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Riwayat Penduduk");
    expect(csv).toContain("Desa;Desa Contoh");
    expect(csv).toContain("Perubahan Data");
    expect(csv).toContain("Warga Contoh");
  });

  it("mengutip sel yang memuat pemisah dan kutip", () => {
    const csv = buildRiwayatPendudukCsv({ namaDesa: null, rows: [barisRiwayat] });

    expect(csv).toContain('"Alasan; khusus"');
    expect(csv).toContain('"Catatan ""penting"""');
  });

  it("membuat nama berkas aman", () => {
    expect(riwayatPendudukFilename("Desa Contoh")).toBe("riwayat-penduduk-desa-contoh.csv");
    expect(riwayatPendudukFilename(null)).toBe("riwayat-penduduk-desa.csv");
  });
});
