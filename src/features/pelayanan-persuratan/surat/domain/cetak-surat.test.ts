import { describe, expect, it } from "vitest";

import { cariCetakSurat, susunKatalogCetakSurat, type CetakSuratRow } from "./cetak-surat";
import type { JenisSuratDTO } from "./surat";

const jenis = (
  opsi: Partial<JenisSuratDTO> & Pick<JenisSuratDTO, "id" | "name" | "code">,
): JenisSuratDTO => ({
  classificationId: null,
  classificationName: null,
  templateBody: "",
  templateBodyAlt: null,
  formIsian: null,
  syaratSurat: null,
  requiresResident: false,
  isActive: true,
  mandiri: null,
  numberFormat: "",
  validityMonths: 12,
  sortOrder: 1,
  templateVariant: null,
  layoutConfig: null,
  satuanMasaBerlaku: null,
  formatNomorGlobal: null,
  orientasi: null,
  ukuran: null,
  header: null,
  footer: null,
  margin: null,
  qrCode: null,
  qrCodeTte: null,
  logoGaruda: null,
  kecamatan: null,
  sumberPendudukBerulang: null,
  ...opsi,
  // Override parsial boleh `undefined`; DTO mensyaratkan null eksplisit.
  lampiran: opsi.lampiran ?? null,
});

describe("susunKatalogCetakSurat", () => {
  it("hanya memuat jenis surat aktif beserta jumlah syarat dan surat tercetak", () => {
    const hasil = susunKatalogCetakSurat(
      [
        jenis({
          id: 1,
          code: "474.1",
          name: "Surat Keterangan Usaha",
          syaratSurat: "[3,4]",
          lampiran: '["Fotokopi KTP","Fotokopi KK"]',
        }),
        jenis({ id: 2, code: "470", name: "Surat Nonaktif", isActive: false }),
        jenis({ id: 3, code: "472", name: "Surat Domisili", classificationName: "Kependudukan" }),
      ],
      new Map([[1, 5]]),
    );

    expect(hasil).toEqual([
      {
        id: 1,
        code: "474.1",
        name: "Surat Keterangan Usaha",
        classificationName: null,
        jumlahSyarat: 2,
        lampiran: ["Fotokopi KTP", "Fotokopi KK"],
        tercetak: 5,
      },
      {
        id: 3,
        code: "472",
        name: "Surat Domisili",
        classificationName: "Kependudukan",
        jumlahSyarat: 0,
        lampiran: [],
        tercetak: 0,
      },
    ]);
  });
});

describe("cariCetakSurat", () => {
  const katalog: CetakSuratRow[] = [
    {
      id: 1,
      code: "474.1",
      name: "Surat Keterangan Usaha",
      classificationName: "Perekonomian",
      jumlahSyarat: 2,
      lampiran: ["Fotokopi KTP"],
      tercetak: 5,
    },
    {
      id: 2,
      code: "472",
      name: "Surat Domisili",
      classificationName: null,
      jumlahSyarat: 0,
      lampiran: [],
      tercetak: 0,
    },
  ];

  it("menganggap lampiran rusak sebagai kosong", () => {
    const hasil = susunKatalogCetakSurat(
      [jenis({ id: 9, code: "470", name: "Surat Rusak", lampiran: "bukan-json" })],
      new Map(),
    );
    expect(hasil[0]?.lampiran).toEqual([]);
  });

  it("mengembalikan seluruh katalog untuk kata kunci kosong", () => {
    expect(cariCetakSurat(katalog, "   ")).toHaveLength(2);
  });

  it("mencocokkan nama, kode, dan klasifikasi tanpa membedakan huruf besar", () => {
    expect(cariCetakSurat(katalog, "usaha").map((row) => row.id)).toEqual([1]);
    expect(cariCetakSurat(katalog, "472").map((row) => row.id)).toEqual([2]);
    expect(cariCetakSurat(katalog, "PEREKONOMIAN").map((row) => row.id)).toEqual([1]);
    expect(cariCetakSurat(katalog, "fotokopi").map((row) => row.id)).toEqual([1]);
    expect(cariCetakSurat(katalog, "tidak ada")).toEqual([]);
  });
});
