import "server-only";

import { z } from "zod";

import { ambilAuditPlatform } from "@/features/multi-desa/application/audit-platform-use-cases";
import { daftarSemuaDomain } from "@/features/multi-desa/application/kelola-desa-use-cases";
import { daftarPenetapanPaketPlatform } from "@/features/multi-desa/application/paket-langganan-use-cases";
import { daftarPenggunaSatuDesa } from "@/features/multi-desa/application/pengguna-desa-use-cases";
import {
  daftarDesaSuperAdmin,
  requireSuperAdmin,
} from "@/features/multi-desa/application/provisioning-use-cases";
import { hariMenujuPurge, statusRetensi } from "@/features/multi-desa/domain/lifecycle-tenant";
import type { PenggunaDesaRow } from "@/features/multi-desa/infrastructure/pengguna-desa-repository";
import type { DesaSuperAdminRow } from "@/features/multi-desa/infrastructure/provisioning-repository";
import { notFound } from "@/lib/errors";

/**
 * Agregat halaman detail tenant.
 *
 * Satu use case menyatukan data yang sebelumnya tersebar di panel kelola,
 * halaman domain, halaman paket, dan audit. Semua sumber tetap use case yang
 * sudah ada (yang masing-masing memeriksa Super Admin); fungsi ini menambah satu
 * pemeriksaan awal agar halaman tidak pernah memuat data sebelum otorisasi.
 */

const idSchema = z.coerce.number().int().positive();

export interface DetailTenant {
  desa: DesaSuperAdminRow;
  statusRetensi: ReturnType<typeof statusRetensi>;
  hariMenujuPurge: number | null;
  domain: Awaited<ReturnType<typeof daftarSemuaDomain>>;
  paket: {
    slug: string | null;
    nama: string | null;
    versi: number | null;
  } | null;
  pengguna: PenggunaDesaRow[];
  audit: Awaited<ReturnType<typeof ambilAuditPlatform>>;
}

export async function ambilDetailTenant(input: unknown): Promise<DetailTenant> {
  await requireSuperAdmin();
  const villageId = idSchema.parse(input);

  const [desaList, domain, paketList, pengguna, audit] = await Promise.all([
    daftarDesaSuperAdmin(),
    daftarSemuaDomain(),
    daftarPenetapanPaketPlatform(),
    daftarPenggunaSatuDesa(villageId),
    ambilAuditPlatform({ desa: String(villageId), page: 1 }),
  ]);

  const desa = desaList.find((item) => item.id === villageId);
  if (!desa) throw notFound("Tenant tidak ditemukan.");

  const paket = paketList.find((item) => item.villageId === villageId);

  return {
    desa,
    statusRetensi: statusRetensi(desa),
    hariMenujuPurge: hariMenujuPurge(desa),
    domain: domain.filter((item) => item.villageId === villageId),
    paket: paket ? { slug: paket.planSlug, nama: paket.planName, versi: paket.planVersion } : null,
    pengguna,
    audit,
  };
}
