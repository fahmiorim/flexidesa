import { describe, expect, it } from "vitest";

import {
  filterAnggotaRtm,
  filterAnggotaRtmKosong,
  parseFilterAnggotaRtm,
  type RumahTanggaMember,
} from "./rumah-tangga";
import { normalisasiNomorRtm, rencanaImporRtm } from "./rumah-tangga-impor";

const PENDUDUK = [
  { id: 1, nik: "3201010101010001", nama: "Budi" },
  { id: 2, nik: "3201010101010002", nama: "Siti" },
  { id: 3, nik: "3201010101010003", nama: "Agus" },
];

function baris(baris: number, nik: string, nomorRtm: string, level: string) {
  return { baris, nilai: { nik, nomorRtm, level } };
}

describe("normalisasiNomorRtm", () => {
  it("menghapus spasi dan mengkapitalkan", () => {
    expect(normalisasiNomorRtm(" rtm 001 ")).toBe("RTM001");
  });
});

describe("rencanaImporRtm", () => {
  it("menautkan penduduk dan menandai RTM baru", () => {
    const rencana = rencanaImporRtm(
      [baris(1, PENDUDUK[0]!.nik, "RTM-001", "1"), baris(2, PENDUDUK[1]!.nik, "RTM-001", "2")],
      PENDUDUK,
      new Set(),
    );

    expect(rencana.galat).toEqual([]);
    expect(rencana.siap).toEqual([
      { residentId: 1, nik: PENDUDUK[0]!.nik, nomorRtm: "RTM-001", level: 1 },
      { residentId: 2, nik: PENDUDUK[1]!.nik, nomorRtm: "RTM-001", level: 2 },
    ]);
    expect(rencana.rtmBaru).toEqual(["RTM-001"]);
  });

  it("tidak menandai RTM yang sudah ada sebagai baru", () => {
    const rencana = rencanaImporRtm(
      [baris(1, PENDUDUK[0]!.nik, "RTM-001", "1")],
      PENDUDUK,
      new Set(["RTM-001"]),
    );
    expect(rencana.rtmBaru).toEqual([]);
  });

  it("menolak NIK tidak dikenal, level tidak valid, dan NIK ganda", () => {
    const rencana = rencanaImporRtm(
      [
        baris(1, "3201010101010099", "RTM-001", "1"),
        baris(2, PENDUDUK[0]!.nik, "RTM-001", "0"),
        baris(3, PENDUDUK[1]!.nik, "RTM-001", "3"),
        baris(4, PENDUDUK[1]!.nik, "RTM-001", "2"),
        baris(5, "123", "RTM-001", "2"),
      ],
      PENDUDUK,
      new Set(),
    );

    expect(rencana.siap).toHaveLength(1);
    expect(rencana.siap[0]?.level).toBe(2);
    expect(rencana.galat.map((item) => item.baris)).toEqual([1, 2, 4, 5]);
  });
});

function anggota(id: number, gender: "male" | "female", lifeStatus: string): RumahTanggaMember {
  return { id, name: `Anggota ${id}`, nationalId: null, level: 2, gender, lifeStatus };
}

describe("filter anggota RTM", () => {
  const semua = [
    anggota(1, "male", "alive"),
    anggota(2, "female", "alive"),
    anggota(3, "female", "deceased"),
  ];

  it("memetakan query string menjadi filter tervalidasi", () => {
    expect(parseFilterAnggotaRtm({ sexAnggota: "female", statusAnggota: "hidup" })).toEqual({
      sex: "female",
      status: "hidup",
    });
    expect(parseFilterAnggotaRtm({ sexAnggota: "x", statusAnggota: "y" })).toEqual(
      filterAnggotaRtmKosong(),
    );
  });

  it("menyaring menurut jenis kelamin dan status hidup", () => {
    expect(filterAnggotaRtm(semua, { sex: "female", status: null })).toHaveLength(2);
    expect(filterAnggotaRtm(semua, { sex: null, status: "tidak" })).toHaveLength(1);
    expect(filterAnggotaRtm(semua, filterAnggotaRtmKosong())).toHaveLength(3);
  });
});
