import "server-only";

import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";

import { db } from "@/db";
import {
  subscriptionPlanFeatures,
  subscriptionPlans,
  subscriptionPlanVersions,
  villagePlanSubscriptions,
  villages,
} from "@/db/schema";
import { conflict, isDuplicateKeyError, notFound } from "@/lib/errors";

import type { StatusPaket, StatusVersiPaket } from "../domain/paket-langganan";

interface PaketRingkas {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: StatusPaket;
  publishedVersion: { id: number; version: number } | null;
  draftVersion: { id: number; version: number } | null;
}

export interface PaketVersiDetail {
  id: number;
  planId: number;
  version: number;
  status: StatusVersiPaket;
  changelog: string | null;
  createdAt: Date;
  publishedAt: Date | null;
  moduleSlugs: string[];
  tenantCount: number;
}

export interface PaketTenantRow {
  villageId: number;
  name: string | null;
  code: string | null;
  active: boolean;
  planVersionId: number | null;
  planSlug: string | null;
  planName: string | null;
  planVersion: number | null;
}

interface DetailPaket {
  paket: PaketRingkas;
  versions: PaketVersiDetail[];
  tenants: Array<
    Pick<PaketTenantRow, "villageId" | "name" | "code" | "active" | "planVersionId" | "planVersion">
  >;
}

export interface PilihanPaketTenantBaru {
  planId: number;
  planSlug: string;
  planName: string;
  description: string | null;
  versionId: number;
  version: number;
  moduleSlugs: string[];
}

function ringkasPlan(
  plan: typeof subscriptionPlans.$inferSelect,
  versions: Array<Pick<typeof subscriptionPlanVersions.$inferSelect, "id" | "version" | "status">>,
): PaketRingkas {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    status: plan.status,
    publishedVersion: versions.find((version) => version.status === "published") ?? null,
    draftVersion: versions.find((version) => version.status === "draft") ?? null,
  };
}

export async function listPaket(): Promise<PaketRingkas[]> {
  const [plans, versions] = await Promise.all([
    db.select().from(subscriptionPlans).orderBy(asc(subscriptionPlans.name)),
    db
      .select({
        id: subscriptionPlanVersions.id,
        planId: subscriptionPlanVersions.planId,
        version: subscriptionPlanVersions.version,
        status: subscriptionPlanVersions.status,
      })
      .from(subscriptionPlanVersions)
      .orderBy(desc(subscriptionPlanVersions.version)),
  ]);

  return plans.map((plan) =>
    ringkasPlan(
      plan,
      versions.filter((version) => version.planId === plan.id),
    ),
  );
}

export async function slugPaketDipakai(slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: subscriptionPlans.id })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, slug))
    .limit(1);
  return Boolean(row);
}

export async function getPaket(id: number): Promise<typeof subscriptionPlans.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, id))
    .limit(1);
  return row ?? null;
}

export async function getDetailPaket(id: number): Promise<DetailPaket | null> {
  const plan = await getPaket(id);
  if (!plan) return null;

  const [versions, tenantRows] = await Promise.all([
    db
      .select()
      .from(subscriptionPlanVersions)
      .where(eq(subscriptionPlanVersions.planId, id))
      .orderBy(desc(subscriptionPlanVersions.version)),
    db
      .select({
        villageId: villagePlanSubscriptions.villageId,
        name: villages.name,
        code: villages.code,
        active: villages.active,
        planVersionId: subscriptionPlanVersions.id,
        planVersion: subscriptionPlanVersions.version,
      })
      .from(villagePlanSubscriptions)
      .innerJoin(villages, eq(villages.id, villagePlanSubscriptions.villageId))
      .innerJoin(
        subscriptionPlanVersions,
        eq(subscriptionPlanVersions.id, villagePlanSubscriptions.planVersionId),
      )
      .where(eq(subscriptionPlanVersions.planId, id))
      .orderBy(asc(villages.name)),
  ]);
  const versionIds = versions.map((version) => version.id);
  const featureRows =
    versionIds.length === 0
      ? []
      : await db
          .select({
            versionId: subscriptionPlanFeatures.planVersionId,
            moduleSlug: subscriptionPlanFeatures.moduleSlug,
          })
          .from(subscriptionPlanFeatures)
          .where(inArray(subscriptionPlanFeatures.planVersionId, versionIds));
  const featureByVersion = new Map<number, string[]>();
  for (const feature of featureRows) {
    const slugs = featureByVersion.get(feature.versionId) ?? [];
    slugs.push(feature.moduleSlug);
    featureByVersion.set(feature.versionId, slugs);
  }
  const tenantCountByVersion = new Map<number, number>();
  for (const tenant of tenantRows) {
    if (tenant.planVersionId === null) continue;
    tenantCountByVersion.set(
      tenant.planVersionId,
      (tenantCountByVersion.get(tenant.planVersionId) ?? 0) + 1,
    );
  }
  const versionsDetail: PaketVersiDetail[] = versions.map((version) => ({
    id: version.id,
    planId: version.planId,
    version: version.version,
    status: version.status,
    changelog: version.changelog,
    createdAt: version.createdAt,
    publishedAt: version.publishedAt,
    moduleSlugs: featureByVersion.get(version.id) ?? [],
    tenantCount: tenantCountByVersion.get(version.id) ?? 0,
  }));

  return {
    paket: ringkasPlan(plan, versions),
    versions: versionsDetail,
    tenants: tenantRows,
  };
}

export async function listPilihanPaketTenantBaru(): Promise<PilihanPaketTenantBaru[]> {
  const rows = await db
    .select({
      planId: subscriptionPlans.id,
      planSlug: subscriptionPlans.slug,
      planName: subscriptionPlans.name,
      description: subscriptionPlans.description,
      versionId: subscriptionPlanVersions.id,
      version: subscriptionPlanVersions.version,
    })
    .from(subscriptionPlans)
    .innerJoin(subscriptionPlanVersions, eq(subscriptionPlanVersions.planId, subscriptionPlans.id))
    .where(
      and(eq(subscriptionPlans.status, "active"), eq(subscriptionPlanVersions.status, "published")),
    )
    .orderBy(asc(subscriptionPlans.name), desc(subscriptionPlanVersions.version));
  const terbaru = new Map<number, Omit<PilihanPaketTenantBaru, "moduleSlugs">>();
  for (const row of rows) {
    if (!terbaru.has(row.planId)) terbaru.set(row.planId, row);
  }

  const choices = [...terbaru.values()];
  if (choices.length === 0) return [];
  const featureRows = await db
    .select({
      versionId: subscriptionPlanFeatures.planVersionId,
      moduleSlug: subscriptionPlanFeatures.moduleSlug,
    })
    .from(subscriptionPlanFeatures)
    .where(
      inArray(
        subscriptionPlanFeatures.planVersionId,
        choices.map((choice) => choice.versionId),
      ),
    );
  const fiturPerVersi = new Map<number, string[]>();
  for (const row of featureRows) {
    const features = fiturPerVersi.get(row.versionId) ?? [];
    features.push(row.moduleSlug);
    fiturPerVersi.set(row.versionId, features);
  }

  return choices.map((choice) => ({
    ...choice,
    moduleSlugs: fiturPerVersi.get(choice.versionId) ?? [],
  }));
}

export async function listPenetapanPaket(): Promise<PaketTenantRow[]> {
  return db
    .select({
      villageId: villages.id,
      name: villages.name,
      code: villages.code,
      active: villages.active,
      planVersionId: subscriptionPlanVersions.id,
      planSlug: subscriptionPlans.slug,
      planName: subscriptionPlans.name,
      planVersion: subscriptionPlanVersions.version,
    })
    .from(villages)
    .leftJoin(villagePlanSubscriptions, eq(villagePlanSubscriptions.villageId, villages.id))
    .leftJoin(
      subscriptionPlanVersions,
      eq(subscriptionPlanVersions.id, villagePlanSubscriptions.planVersionId),
    )
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptionPlanVersions.planId))
    .where(isNull(villages.purgedAt))
    .orderBy(desc(villages.active), asc(villages.name));
}

export async function buatPaket(input: {
  slug: string;
  name: string;
  description?: string;
  createdBy: string;
}): Promise<{ id: number; versionId: number }> {
  // Pembuatan slug bersamaan dapat sama-sama lolos pemeriksaan slug di use
  // case; yang kalah menabrak unique index sebagai ER_DUP_ENTRY.
  try {
    return await db.transaction(async (tx) => {
      const [plan] = await tx
        .insert(subscriptionPlans)
        .values({
          slug: input.slug,
          name: input.name,
          description: input.description || null,
          createdBy: input.createdBy,
          status: "active",
        })
        .$returningId();
      if (!plan) throw conflict("Gagal membuat paket.");

      const [version] = await tx
        .insert(subscriptionPlanVersions)
        .values({ planId: plan.id, version: 1, status: "draft", createdBy: input.createdBy })
        .$returningId();
      if (!version) throw conflict("Gagal membuat draf fitur paket.");
      return { id: plan.id, versionId: version.id };
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) throw conflict("Slug paket sudah digunakan.");
    throw error;
  }
}

export async function ubahMetadataPaket(input: {
  id: number;
  name: string;
  description?: string;
}): Promise<void> {
  const result = await db
    .update(subscriptionPlans)
    .set({ name: input.name, description: input.description || null })
    .where(and(eq(subscriptionPlans.id, input.id), eq(subscriptionPlans.status, "active")));
  if (result[0].affectedRows === 0) throw notFound("Paket aktif tidak ditemukan.");
}

export async function ubahStatusPaket(id: number, status: StatusPaket): Promise<void> {
  const result = await db
    .update(subscriptionPlans)
    .set({ status })
    .where(eq(subscriptionPlans.id, id));
  if (result[0].affectedRows === 0) throw notFound("Paket tidak ditemukan.");
}

export async function buatDrafVersiPaket(
  planId: number,
  actorId: string,
): Promise<{ id: number; version: number }> {
  return db.transaction(async (tx) => {
    // Kunci baris paket agar pembuatan draf bersamaan terserialisasi:
    // tanpa kunci, dua transaksi melihat "belum ada draf" yang sama dan
    // menghitung nomor versi yang sama, sehingga salah satu menembus
    // unique index (plan_id, version) sebagai error 500.
    const [plan] = await tx
      .select({ id: subscriptionPlans.id, status: subscriptionPlans.status })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .for("update")
      .limit(1);
    if (!plan) throw notFound("Paket tidak ditemukan.");
    if (plan.status !== "active") throw conflict("Paket yang diarsipkan tidak dapat diubah.");

    const versions = await tx
      .select({
        id: subscriptionPlanVersions.id,
        version: subscriptionPlanVersions.version,
        status: subscriptionPlanVersions.status,
      })
      .from(subscriptionPlanVersions)
      .where(eq(subscriptionPlanVersions.planId, planId))
      .orderBy(desc(subscriptionPlanVersions.version));
    if (versions.some((version) => version.status === "draft")) {
      throw conflict("Selesaikan atau arsipkan draf paket yang sudah ada terlebih dahulu.");
    }
    const version = (versions[0]?.version ?? 0) + 1;
    const previous = versions.find((candidate) => candidate.status === "published");
    const [created] = await tx
      .insert(subscriptionPlanVersions)
      .values({ planId, version, status: "draft", createdBy: actorId })
      .$returningId();
    if (!created) throw conflict("Gagal membuat draf paket.");

    if (previous) {
      const features = await tx
        .select({ moduleSlug: subscriptionPlanFeatures.moduleSlug })
        .from(subscriptionPlanFeatures)
        .where(eq(subscriptionPlanFeatures.planVersionId, previous.id));
      if (features.length > 0) {
        await tx.insert(subscriptionPlanFeatures).values(
          features.map((feature) => ({
            planVersionId: created.id,
            moduleSlug: feature.moduleSlug,
          })),
        );
      }
    }

    return { id: created.id, version };
  });
}

export async function simpanFiturDrafPaket(input: {
  planId: number;
  versionId: number;
  moduleSlugs: string[];
  changelog?: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    // Kunci baris paket lalu versi (urutan yang sama di semua mutasi paket)
    // agar penerbitan tidak dapat meng-commit di antara pemeriksaan dan
    // penulisan: versi yang baru terbit tidak pernah diedit di sini.
    const [plan] = await tx
      .select({ id: subscriptionPlans.id, status: subscriptionPlans.status })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, input.planId))
      .for("update")
      .limit(1);
    const [version] = await tx
      .select({
        id: subscriptionPlanVersions.id,
        planId: subscriptionPlanVersions.planId,
        status: subscriptionPlanVersions.status,
      })
      .from(subscriptionPlanVersions)
      .where(
        and(
          eq(subscriptionPlanVersions.id, input.versionId),
          eq(subscriptionPlanVersions.planId, input.planId),
          eq(subscriptionPlanVersions.status, "draft"),
        ),
      )
      .for("update")
      .limit(1);
    if (!plan || plan.status !== "active" || !version) {
      throw conflict("Draf paket tidak ditemukan atau sudah diterbitkan.");
    }

    await tx
      .delete(subscriptionPlanFeatures)
      .where(eq(subscriptionPlanFeatures.planVersionId, input.versionId));
    if (input.moduleSlugs.length > 0) {
      await tx
        .insert(subscriptionPlanFeatures)
        .values(
          input.moduleSlugs.map((moduleSlug) => ({ planVersionId: input.versionId, moduleSlug })),
        );
    }
    await tx
      .update(subscriptionPlanVersions)
      .set({ changelog: input.changelog?.trim() || null })
      .where(eq(subscriptionPlanVersions.id, input.versionId));
  });
}

export async function terbitkanVersiPaket(planId: number, versionId: number): Promise<void> {
  await db.transaction(async (tx) => {
    // Kunci baris paket lalu versi (urutan yang sama dengan penyimpanan
    // draf) agar penerbitan terserialisasi terhadap penulisan draf.
    const [plan] = await tx
      .select({ id: subscriptionPlans.id, status: subscriptionPlans.status })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .for("update")
      .limit(1);
    const [version] = await tx
      .select({
        id: subscriptionPlanVersions.id,
        planId: subscriptionPlanVersions.planId,
        status: subscriptionPlanVersions.status,
      })
      .from(subscriptionPlanVersions)
      .where(
        and(
          eq(subscriptionPlanVersions.id, versionId),
          eq(subscriptionPlanVersions.planId, planId),
          eq(subscriptionPlanVersions.status, "draft"),
        ),
      )
      .for("update")
      .limit(1);
    if (!plan || plan.status !== "active" || !version) {
      throw conflict("Hanya draf dari paket aktif yang dapat diterbitkan.");
    }

    await tx
      .update(subscriptionPlanVersions)
      .set({ status: "archived" })
      .where(
        and(
          eq(subscriptionPlanVersions.planId, planId),
          eq(subscriptionPlanVersions.status, "published"),
        ),
      );
    await tx
      .update(subscriptionPlanVersions)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(subscriptionPlanVersions.id, versionId));
  });
}

export async function previewRolloutPaket(
  planId: number,
  versionId: number,
): Promise<{ tenantCount: number; removedModuleSlugs: string[] }> {
  const [target] = await db
    .select({
      id: subscriptionPlanVersions.id,
      planId: subscriptionPlanVersions.planId,
      status: subscriptionPlanVersions.status,
    })
    .from(subscriptionPlanVersions)
    .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptionPlanVersions.planId))
    .where(
      and(
        eq(subscriptionPlanVersions.id, versionId),
        eq(subscriptionPlanVersions.planId, planId),
        eq(subscriptionPlanVersions.status, "published"),
        eq(subscriptionPlans.status, "active"),
      ),
    )
    .limit(1);
  if (!target) {
    throw conflict("Versi paket terbit tidak ditemukan.");
  }

  const current = await db
    .select({
      villageId: villagePlanSubscriptions.villageId,
      versionId: villagePlanSubscriptions.planVersionId,
    })
    .from(villagePlanSubscriptions)
    .innerJoin(
      subscriptionPlanVersions,
      eq(subscriptionPlanVersions.id, villagePlanSubscriptions.planVersionId),
    )
    .where(
      and(
        eq(subscriptionPlanVersions.planId, planId),
        ne(villagePlanSubscriptions.planVersionId, versionId),
      ),
    );
  const oldVersionIds = [...new Set(current.map((item) => item.versionId))];
  const [targetFeatures, oldFeatures] = await Promise.all([
    db
      .select({ moduleSlug: subscriptionPlanFeatures.moduleSlug })
      .from(subscriptionPlanFeatures)
      .where(eq(subscriptionPlanFeatures.planVersionId, versionId)),
    oldVersionIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            versionId: subscriptionPlanFeatures.planVersionId,
            moduleSlug: subscriptionPlanFeatures.moduleSlug,
          })
          .from(subscriptionPlanFeatures)
          .where(inArray(subscriptionPlanFeatures.planVersionId, oldVersionIds)),
  ]);
  const targetSlugs = new Set(targetFeatures.map((feature) => feature.moduleSlug));
  const removed = new Set<string>();
  for (const feature of oldFeatures) {
    if (!targetSlugs.has(feature.moduleSlug)) removed.add(feature.moduleSlug);
  }
  return { tenantCount: current.length, removedModuleSlugs: [...removed].sort() };
}

export async function rolloutVersiPaket(
  planId: number,
  versionId: number,
  actorId: string,
): Promise<number> {
  // Validasi dan update dalam satu transaksi dengan mengunci baris paket
  // lalu versi target (urutan yang sama di semua mutasi paket): paket yang
  // diarsipkan atau versi yang diarsipkan versi baru di tengah jalan
  // membuat validasi di sini gagal tanpa mengubah tenant.
  return db.transaction(async (tx) => {
    const [plan] = await tx
      .select({ id: subscriptionPlans.id, status: subscriptionPlans.status })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .for("update")
      .limit(1);
    const [target] = await tx
      .select({
        id: subscriptionPlanVersions.id,
        planId: subscriptionPlanVersions.planId,
        status: subscriptionPlanVersions.status,
      })
      .from(subscriptionPlanVersions)
      .where(
        and(
          eq(subscriptionPlanVersions.id, versionId),
          eq(subscriptionPlanVersions.planId, planId),
        ),
      )
      .for("update")
      .limit(1);
    if (!plan || plan.status !== "active" || !target || target.status !== "published") {
      throw conflict("Hanya versi terbit dari paket aktif yang dapat di-rollout.");
    }

    const current = await tx
      .select({ villageId: villagePlanSubscriptions.villageId })
      .from(villagePlanSubscriptions)
      .innerJoin(
        subscriptionPlanVersions,
        eq(subscriptionPlanVersions.id, villagePlanSubscriptions.planVersionId),
      )
      .where(
        and(
          eq(subscriptionPlanVersions.planId, planId),
          ne(villagePlanSubscriptions.planVersionId, versionId),
        ),
      )
      .orderBy(asc(villagePlanSubscriptions.villageId));
    const villageIds = current.map((item) => item.villageId);
    if (villageIds.length === 0) return 0;

    // UPDATE terjaga: daftar villageId hanya kunci akses PK (urutan penguncian
    // sama dengan penetapan manual, sehingga tidak deadlock), sedangkan
    // predikat versi sumber dievaluasi pada saat baris dikunci untuk update.
    // Tenant yang dipindahkan ke paket lain setelah pembacaan di atas
    // tidak lagi memenuhi predikat itu dan tidak ikut tertimpa.
    const sourceVersionIds = tx
      .select({ id: subscriptionPlanVersions.id })
      .from(subscriptionPlanVersions)
      .where(eq(subscriptionPlanVersions.planId, planId));
    const result = await tx
      .update(villagePlanSubscriptions)
      .set({ planVersionId: versionId, assignedBy: actorId, updatedAt: new Date() })
      .where(
        and(
          inArray(villagePlanSubscriptions.villageId, villageIds),
          ne(villagePlanSubscriptions.planVersionId, versionId),
          inArray(villagePlanSubscriptions.planVersionId, sourceVersionIds),
        ),
      );
    return result[0].affectedRows;
  });
}

export async function tetapkanPaketTenant(input: {
  planVersionId: number;
  villageIds: number[];
  actorId: string;
}): Promise<number> {
  return db.transaction(async (tx) => {
    const [version] = await tx
      .select({ id: subscriptionPlanVersions.id })
      .from(subscriptionPlanVersions)
      .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptionPlanVersions.planId))
      .where(
        and(
          eq(subscriptionPlanVersions.id, input.planVersionId),
          eq(subscriptionPlanVersions.status, "published"),
          eq(subscriptionPlans.status, "active"),
        ),
      )
      .limit(1);
    if (!version) throw conflict("Pilih versi terbit dari paket aktif.");

    const tenants = await tx
      .select({ id: villages.id })
      .from(villages)
      .where(and(inArray(villages.id, input.villageIds), isNull(villages.purgedAt)));
    if (tenants.length !== input.villageIds.length) {
      throw notFound("Satu atau lebih tenant tidak ditemukan atau sudah di-purge.");
    }

    const now = new Date();
    await tx
      .insert(villagePlanSubscriptions)
      .values(
        input.villageIds.map((villageId) => ({
          villageId,
          planVersionId: input.planVersionId,
          assignedBy: input.actorId,
          assignedAt: now,
          updatedAt: now,
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          planVersionId: input.planVersionId,
          assignedBy: input.actorId,
          updatedAt: now,
        },
      });
    return tenants.length;
  });
}
