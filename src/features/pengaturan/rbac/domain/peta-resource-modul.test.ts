import { describe, expect, it } from "vitest";

import { TENANT_TEMPLATE } from "@/features/multi-desa/domain/tenant-template-data";

import { PETA_RESOURCE_MODUL } from "./peta-resource-modul";
import { RESOURCES } from "./resources";

type Modul = { slug: string; url?: string; children?: Modul[] };

function slugTemplate(): string[] {
  const hasil: string[] = [];
  const jelajah = (modul: Modul[]) => {
    for (const item of modul) {
      hasil.push(item.slug);
      if (item.children?.length) jelajah(item.children);
    }
  };
  jelajah(TENANT_TEMPLATE.modules as Modul[]);
  return hasil;
}

describe("PETA_RESOURCE_MODUL", () => {
  it("mencakup setiap slug modul template dan tidak punya slug asing", () => {
    const slug = slugTemplate();
    expect(slug.length).toBeGreaterThan(0);
    expect([...Object.keys(PETA_RESOURCE_MODUL)].sort()).toEqual([...slug].sort());
  });

  it("hanya memakai nilai yang benar-benar ada di RESOURCES", () => {
    const nilai = new Set<string>(Object.values(RESOURCES));
    for (const [slug, pemetaan] of Object.entries(PETA_RESOURCE_MODUL)) {
      if (pemetaan.resource === null) continue;
      expect(nilai.has(pemetaan.resource), `${slug} → ${pemetaan.resource}`).toBe(true);
    }
  });

  it("menjelaskan setiap modul yang belum punya resource khusus", () => {
    for (const [slug, pemetaan] of Object.entries(PETA_RESOURCE_MODUL)) {
      if (pemetaan.resource !== null) continue;
      const catatan = "catatan" in pemetaan ? pemetaan.catatan : undefined;
      expect(catatan?.trim().length ?? 0, slug).toBeGreaterThan(10);
    }
  });

  it("memetakan submenu berisiko ke resource yang sama dengan pemeriksaan backend", () => {
    expect(PETA_RESOURCE_MODUL.potensi.resource).toBe(RESOURCES.potensi);
    expect(PETA_RESOURCE_MODUL["sarana-prasarana"].resource).toBe(RESOURCES.saranaPrasarana);
    expect(PETA_RESOURCE_MODUL.peta.resource).toBe(RESOURCES.peta);
    expect(PETA_RESOURCE_MODUL["website-pengaturan"].resource).toBe(RESOURCES.websitePengaturan);
    expect(PETA_RESOURCE_MODUL["idm-sdgs"].resource).toBe(RESOURCES.idmSdgs);
  });

  it("memetakan resource kehadiran, kependudukan, dan laporan ke nilai RESOURCES", () => {
    expect(PETA_RESOURCE_MODUL.stunting.resource).toBe(RESOURCES.stunting);
    expect(PETA_RESOURCE_MODUL["rekapitulasi-kehadiran"].resource).toBe(
      RESOURCES.rekapitulasiKehadiran,
    );
    expect(PETA_RESOURCE_MODUL["hari-libur"].resource).toBe(RESOURCES.hariLibur);
    expect(PETA_RESOURCE_MODUL["jam-kerja"].resource).toBe(RESOURCES.jamKerja);
    expect(PETA_RESOURCE_MODUL["pengajuan-izin"].resource).toBe(RESOURCES.pengajuanIzin);
    expect(PETA_RESOURCE_MODUL["persetujuan-izin"].resource).toBe(RESOURCES.persetujuanIzin);
    expect(PETA_RESOURCE_MODUL["alasan-keluar"].resource).toBe(RESOURCES.alasanKeluar);
    expect(PETA_RESOURCE_MODUL["laporan-kelompok-rentan"].resource).toBe(
      RESOURCES.laporanKelompokRentan,
    );
    expect(PETA_RESOURCE_MODUL["laporan-penduduk"].resource).toBe(RESOURCES.laporanPenduduk);
  });

  it("tidak menyisakan catatan resource backend yang belum terdaftar", () => {
    for (const [slug, pemetaan] of Object.entries(PETA_RESOURCE_MODUL)) {
      const catatan = "catatan" in pemetaan ? pemetaan.catatan : "";
      expect(catatan, slug).not.toContain("belum ada di RESOURCES");
    }
  });

  it("menandai placeholder /segera dengan catatan, bukan resource karangan", () => {
    const placeholder = Object.entries(PETA_RESOURCE_MODUL).filter(
      ([, pemetaan]) => pemetaan.resource === null,
    );
    for (const [slug, pemetaan] of placeholder) {
      expect("catatan" in pemetaan && pemetaan.catatan, slug).toBeTruthy();
    }
  });
});
