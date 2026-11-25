import "server-only";

import { z } from "zod";

import { TENANT_TEMPLATE } from "@/db/templates/tenant-template";
import { recordAuditEvent } from "@/features/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/audit/domain/audit";
import { requireSuperAdmin } from "@/features/multi-desa/application/provisioning-use-cases";
import {
  buatVersiDrafPaketSchema,
  katalogFiturPaket,
  paketBaruSchema,
  penetapanPaketSchema,
  previewRolloutVersiPaketSchema,
  rolloutVersiPaketSchema,
  terbitkanVersiPaketSchema,
  ubahFiturDrafPaketSchema,
  ubahPaketSchema,
  ubahStatusPaketSchema,
  type StatusPaket,
} from "@/features/multi-desa/domain/paket-langganan";
import {
  buatDrafVersiPaket,
  buatPaket,
  getDetailPaket,
  getPaket,
  listPaket,
  listPenetapanPaket,
  listPilihanPaketTenantBaru as listPilihanPaketTenantBaruRepo,
  previewRolloutPaket,
  rolloutVersiPaket,
  simpanFiturDrafPaket,
  slugPaketDipakai,
  terbitkanVersiPaket,
  tetapkanPaketTenant,
  ubahMetadataPaket,
  ubahStatusPaket,
} from "@/features/multi-desa/infrastructure/paket-langganan-repository";
import { RUTE_ADMIN_TERSEDIA, ruteTersedia } from "@/features/navigation/domain/menu-tampil";
import { conflict, notFound } from "@/lib/errors";

function katalogFitur() {
  return katalogFiturPaket(
    TENANT_TEMPLATE.modules,
    new Set(RUTE_ADMIN_TERSEDIA.filter(ruteTersedia)),
  );
}

export async function daftarPaketPlatform() {
  await requireSuperAdmin();
  return listPaket();
}

export async function detailPaketPlatform(input: unknown) {
  await requireSuperAdmin();
  const parsedId = z.coerce.number().int().positive().safeParse(input);
  if (!parsedId.success) throw notFound("Paket tidak ditemukan.");
  const paket = await getDetailPaket(parsedId.data);
  if (!paket) throw notFound("Paket tidak ditemukan.");
  return paket;
}

export async function daftarFiturPaketPlatform() {
  await requireSuperAdmin();
  return katalogFitur();
}

export async function daftarPilihanPaketTenantBaru() {
  await requireSuperAdmin();
  const pilihan = await listPilihanPaketTenantBaruRepo();
  const namaFitur = new Map(katalogFitur().map((fitur) => [fitur.slug, fitur.name]));
  return pilihan.map(({ moduleSlugs, ...paket }) => ({
    ...paket,
    features: moduleSlugs.map((slug) => ({ slug, name: namaFitur.get(slug) ?? slug })),
  }));
}

export async function daftarPenetapanPaketPlatform() {
  await requireSuperAdmin();
  return listPenetapanPaket();
}

export async function buatPaketPlatform(
  input: unknown,
): Promise<{ id: number; versionId: number }> {
  const user = await requireSuperAdmin();
  const parsed = paketBaruSchema.parse(input);
  if (await slugPaketDipakai(parsed.slug)) throw conflict("Slug paket sudah digunakan.");

  const hasil = await buatPaket({ ...parsed, createdBy: user.id });
  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.subscriptionPlanCreate,
    resource: "subscription_plans",
    resourceId: String(hasil.id),
    details: { slug: parsed.slug, name: parsed.name },
  });
  return hasil;
}

export async function ubahPaketPlatform(input: unknown): Promise<void> {
  const user = await requireSuperAdmin();
  const parsed = ubahPaketSchema.parse(input);
  await ubahMetadataPaket(parsed);
  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.subscriptionPlanUpdate,
    resource: "subscription_plans",
    resourceId: String(parsed.id),
    details: { name: parsed.name },
  });
}

export async function ubahStatusPaketPlatform(input: unknown): Promise<{ status: StatusPaket }> {
  const user = await requireSuperAdmin();
  const parsed = ubahStatusPaketSchema.parse(input);
  const paket = await getPaket(parsed.id);
  if (!paket) throw notFound("Paket tidak ditemukan.");
  await ubahStatusPaket(parsed.id, parsed.status);
  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.subscriptionPlanStatus,
    resource: "subscription_plans",
    resourceId: String(parsed.id),
    details: { slug: paket.slug, status: parsed.status },
  });
  return { status: parsed.status };
}

export async function buatDrafVersiPaketPlatform(input: unknown) {
  const user = await requireSuperAdmin();
  const parsed = buatVersiDrafPaketSchema.parse(input);
  const hasil = await buatDrafVersiPaket(parsed.planId, user.id);
  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.subscriptionPlanUpdate,
    resource: "subscription_plan_versions",
    resourceId: String(hasil.id),
    details: { planId: parsed.planId, version: hasil.version, status: "draft" },
  });
  return hasil;
}

export async function simpanFiturDrafPaketPlatform(input: unknown) {
  const user = await requireSuperAdmin();
  const parsed = ubahFiturDrafPaketSchema.parse(input);
  const tersedia = new Set(katalogFitur().map((fitur) => fitur.slug));
  const tidakDidukung = parsed.moduleSlugs.filter((slug) => !tersedia.has(slug));
  if (tidakDidukung.length > 0) {
    throw conflict("Paket hanya dapat memuat modul yang memiliki halaman aktif.");
  }

  await simpanFiturDrafPaket(parsed);
  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.subscriptionPlanUpdate,
    resource: "subscription_plan_versions",
    resourceId: String(parsed.versionId),
    details: { planId: parsed.planId, jumlahFitur: parsed.moduleSlugs.length },
  });
}

export async function terbitkanVersiPaketPlatform(input: unknown) {
  const user = await requireSuperAdmin();
  const parsed = terbitkanVersiPaketSchema.parse(input);
  await terbitkanVersiPaket(parsed.planId, parsed.versionId);
  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.subscriptionPlanPublish,
    resource: "subscription_plan_versions",
    resourceId: String(parsed.versionId),
    details: { planId: parsed.planId },
  });
}

export async function previewRolloutVersiPaketPlatform(input: unknown) {
  await requireSuperAdmin();
  const parsed = previewRolloutVersiPaketSchema.parse(input);
  const preview = await previewRolloutPaket(parsed.planId, parsed.versionId);
  const namaFitur = new Map(katalogFitur().map((fitur) => [fitur.slug, fitur.name]));
  return {
    ...preview,
    removedFeatures: preview.removedModuleSlugs.map((slug) => ({
      slug,
      name: namaFitur.get(slug) ?? slug,
    })),
  };
}

export async function rolloutVersiPaketPlatform(input: unknown): Promise<{ jumlahTenant: number }> {
  const user = await requireSuperAdmin();
  const parsed = rolloutVersiPaketSchema.parse(input);
  const preview = await previewRolloutPaket(parsed.planId, parsed.versionId);
  const jumlahTenant = await rolloutVersiPaket(parsed.planId, parsed.versionId, user.id);
  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.subscriptionPlanRollout,
    resource: "subscription_plan_versions",
    resourceId: String(parsed.versionId),
    details: {
      planId: parsed.planId,
      jumlahTenant,
      fiturDicabut: preview.removedModuleSlugs.join(", "),
    },
  });
  return { jumlahTenant };
}

export async function tetapkanPaketTenantPlatform(
  input: unknown,
): Promise<{ jumlahTenant: number }> {
  const user = await requireSuperAdmin();
  const parsed = penetapanPaketSchema.parse(input);
  const jumlahTenant = await tetapkanPaketTenant({ ...parsed, actorId: user.id });
  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.subscriptionPlanAssign,
    resource: "village_plan_subscriptions",
    resourceId: String(parsed.planVersionId),
    details: { jumlahTenant, villageIds: parsed.villageIds.join(",") },
  });
  return { jumlahTenant };
}
