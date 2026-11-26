import { describe, expect, it } from "vitest";

import { TENANT_TEMPLATE } from "@/features/multi-desa/domain/tenant-template-data";
import { RUTE_ADMIN_TERSEDIA } from "@/features/navigation/domain/menu-tampil";

import {
  katalogFiturPaket,
  penetapanPaketSchema,
  rolloutVersiPaketSchema,
} from "./paket-langganan";

const modul = (
  slug: string,
  name: string,
  url: string | null,
  opsi: Partial<{
    isGroup: boolean;
    isHidden: boolean;
    isActive: boolean;
    parentSlug: string | null;
    sortOrder: number;
  }> = {},
) => ({
  slug,
  name,
  url,
  isGroup: opsi.isGroup ?? false,
  isHidden: opsi.isHidden ?? false,
  isActive: opsi.isActive ?? true,
  parentSlug: opsi.parentSlug ?? null,
  sortOrder: opsi.sortOrder ?? 1,
});

describe("katalogFiturPaket", () => {
  it("hanya menawarkan modul yang punya halaman dan bukan grup, tersembunyi, atau Beranda", () => {
    const hasil = katalogFiturPaket(
      [
        modul("beranda", "Dashboard", "/beranda"),
        modul("kependudukan", "Kependudukan", null, { isGroup: true }),
        modul("penduduk", "Data Penduduk", "/kependudukan/penduduk", {
          parentSlug: "kependudukan",
        }),
        modul("segera", "Hari Libur", "/segera/hari-libur"),
        modul("internal", "Internal", "/internal", { isHidden: true }),
      ],
      new Set(["/beranda", "/kependudukan/penduduk"]),
    );

    expect(hasil).toEqual([
      {
        slug: "penduduk",
        name: "Data Penduduk",
        parentSlug: "kependudukan",
        parentName: "Kependudukan",
        sortOrder: 1,
      },
    ]);
  });
  it("menawarkan menu Kehadiran yang sudah punya halaman sebagai fitur paket", () => {
    const hasil = katalogFiturPaket(TENANT_TEMPLATE.modules, new Set(RUTE_ADMIN_TERSEDIA));
    const slugs = new Set(hasil.map((fitur) => fitur.slug));

    for (const slug of [
      "hari-libur",
      "jam-kerja",
      "pengajuan-izin",
      "persetujuan-izin",
      "alasan-keluar",
      "cetak-surat",
    ]) {
      expect(slugs.has(slug), `Fitur "${slug}" belum dapat dipilih pada paket`).toBe(true);
    }
  });

  it("membutuhkan konfirmasi eksplisit untuk perubahan paket tenant", () => {
    expect(
      rolloutVersiPaketSchema.safeParse({ planId: 1, versionId: 2, confirmed: false }).success,
    ).toBe(false);
    expect(
      rolloutVersiPaketSchema.safeParse({ planId: 1, versionId: 2, confirmed: true }).success,
    ).toBe(true);
    expect(
      penetapanPaketSchema.safeParse({
        villageIds: [1],
        planVersionId: 2,
        confirmed: false,
      }).success,
    ).toBe(false);
  });
});
