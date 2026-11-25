import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { eq, inArray } from "drizzle-orm";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import {
  accounts,
  modules,
  rolePermissions,
  roles,
  subscriptionPlanFeatures,
  subscriptionPlans,
  subscriptionPlanVersions,
  theme,
  users,
  villageDomains,
  villagePlanSubscriptions,
  villages,
} from "@/db/schema";
import { tambahDomainDesa } from "@/features/multi-desa/infrastructure/kelola-desa-repository";
import {
  buatDrafVersiPaket,
  buatPaket,
  previewRolloutPaket,
  rolloutVersiPaket,
  simpanFiturDrafPaket,
  terbitkanVersiPaket,
} from "@/features/multi-desa/infrastructure/paket-langganan-repository";
import { provisionDesa } from "@/features/multi-desa/infrastructure/provisioning-repository";
import { listPlanModuleSlugs } from "@/features/rbac/infrastructure/rbac-repository";
import { validasiDatabaseUji } from "@/testing/db-test-guard";
import { siapkanDatabaseUji } from "@/testing/migrasi-uji";

/**
 * Regresi race condition rollout versi paket.
 *
 * Versi lama `rolloutVersiPaket()` membaca daftar `villageId` tenant pada paket
 * target, lalu melakukan UPDATE berdasarkan daftar itu tanpa memastikan versi
 * langganan saat update masih milik paket yang sama. Tenant yang dipindahkan
 * ke paket lain di antara kedua langkah tersebut ikut tertimpa.
 *
 * Tes interleaving di bawah mengunci baris langganan tenant pada koneksi
 * kedua, memulai rollout (UPDATE-nya menunggu kunci), memindahkan tenant ke
 * paket lain dari koneksi tersebut, lalu melepaskan kunci. Dengan update
 * atomik berpredikat versi sumber, rollout tidak boleh menyentuh tenant itu
 * dan hasilnya harus 0 baris.
 */

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../db/migrations", import.meta.url));
const RUN = randomUUID().slice(0, 8);

let planTargetId: number | null = null;
let planLainId: number | null = null;
let planArsipId: number | null = null;
let versiLamaId: number | null = null;
let versiTargetId: number | null = null;
let versiLainId: number | null = null;
let versiArsipId: number | null = null;
let versiDrafId: number | null = null;
let tenantLamaId: number | null = null;
let tenantLainId: number | null = null;
let tenantTargetId: number | null = null;
let tenantLegacyId: number | null = null;
let tenantBalapId: number | null = null;
let planDrafId: number | null = null;
let versiTerbitDrafId: number | null = null;
let versiDrafBalapId: number | null = null;
let planProvId: number | null = null;
let versiProvId: number | null = null;

async function buatDesa(kode: string, slug: string): Promise<number> {
  const [desa] = await db
    .insert(villages)
    .values({ name: `Desa Rollout ${kode}`, code: kode, slug })
    .$returningId();
  if (!desa) throw new Error(`Seed uji gagal: desa ${kode} tidak terbentuk.`);
  return desa.id;
}

async function buatPaketUji(slug: string, status: "active" | "archived"): Promise<number> {
  const [plan] = await db
    .insert(subscriptionPlans)
    .values({ slug, name: `Paket ${slug}`, status })
    .$returningId();
  if (!plan) throw new Error(`Seed uji gagal: paket ${slug} tidak terbentuk.`);
  return plan.id;
}

async function buatVersi(
  planId: number,
  version: number,
  status: "draft" | "published" | "archived",
): Promise<number> {
  const [versi] = await db
    .insert(subscriptionPlanVersions)
    .values({
      planId,
      version,
      status,
      publishedAt: status === "published" ? new Date() : null,
    })
    .$returningId();
  if (!versi) throw new Error(`Seed uji gagal: versi ${planId}/${version} tidak terbentuk.`);
  return versi.id;
}

async function langganan(villageId: number, planVersionId: number): Promise<void> {
  await db.insert(villagePlanSubscriptions).values({ villageId, planVersionId });
}

async function bacaLangganan(villageId: number): Promise<number | null> {
  const [baris] = await db
    .select({ planVersionId: villagePlanSubscriptions.planVersionId })
    .from(villagePlanSubscriptions)
    .where(eq(villagePlanSubscriptions.villageId, villageId))
    .limit(1);
  return baris?.planVersionId ?? null;
}

beforeAll(async () => {
  await siapkanDatabaseUji(db, { migrationsFolder: MIGRATIONS_FOLDER });

  planTargetId = await buatPaketUji(`target-${RUN}`, "active");
  versiLamaId = await buatVersi(planTargetId, 1, "archived");
  versiTargetId = await buatVersi(planTargetId, 2, "published");
  versiDrafId = await buatVersi(planTargetId, 3, "draft");

  planLainId = await buatPaketUji(`lain-${RUN}`, "active");
  versiLainId = await buatVersi(planLainId, 1, "published");

  planArsipId = await buatPaketUji(`arsip-${RUN}`, "archived");
  versiArsipId = await buatVersi(planArsipId, 1, "published");
  await db
    .insert(subscriptionPlanFeatures)
    .values({ planVersionId: versiArsipId, moduleSlug: "penduduk" });

  planDrafId = await buatPaketUji(`draf-${RUN}`, "active");
  versiTerbitDrafId = await buatVersi(planDrafId, 1, "published");
  versiDrafBalapId = await buatVersi(planDrafId, 2, "draft");
  await db
    .insert(subscriptionPlanFeatures)
    .values({ planVersionId: versiDrafBalapId, moduleSlug: "penduduk" });

  planProvId = await buatPaketUji(`prov-${RUN}`, "active");
  versiProvId = await buatVersi(planProvId, 1, "published");

  tenantLamaId = await buatDesa(`R${RUN}L`, `desa-rollout-${RUN}-lama`);
  await langganan(tenantLamaId, versiLamaId);

  tenantLainId = await buatDesa(`R${RUN}P`, `desa-rollout-${RUN}-lain`);
  await langganan(tenantLainId, versiLainId);

  tenantTargetId = await buatDesa(`R${RUN}T`, `desa-rollout-${RUN}-target`);
  await langganan(tenantTargetId, versiTargetId);

  tenantLegacyId = await buatDesa(`R${RUN}G`, `desa-rollout-${RUN}-legacy`);
  // Tenant legacy: tanpa baris village_plan_subscriptions.

  tenantBalapId = await buatDesa(`R${RUN}B`, `desa-rollout-${RUN}-balap`);
  await langganan(tenantBalapId, versiLamaId);
});

afterAll(async () => {
  const desaIds = [
    tenantLamaId,
    tenantLainId,
    tenantTargetId,
    tenantLegacyId,
    tenantBalapId,
  ].filter((id): id is number => id !== null);
  if (desaIds.length > 0) {
    await db
      .delete(villagePlanSubscriptions)
      .where(inArray(villagePlanSubscriptions.villageId, desaIds));
    await db.delete(villages).where(inArray(villages.id, desaIds));
  }
  const planIds = [planTargetId, planLainId, planArsipId, planDrafId, planProvId].filter(
    (id): id is number => id !== null,
  );
  if (planIds.length > 0) {
    await db.delete(subscriptionPlans).where(inArray(subscriptionPlans.id, planIds));
  }
});

describe("rolloutVersiPaket", () => {
  it("hanya memindahkan tenant yang masih pada versi lama paket target", async () => {
    if (planTargetId === null || versiTargetId === null || versiLainId === null) {
      throw new Error("Fixture paket tidak siap.");
    }

    const jumlah = await rolloutVersiPaket(planTargetId, versiTargetId, "aktor-uji");

    // Tenant balap masih pada versi lama saat test ini berjalan, sehingga
    // ikut terhitung: 2 tenant (lama + balap) pada versi 1 paket target.
    expect(jumlah).toBe(2);
    expect(await bacaLangganan(tenantLamaId!)).toBe(versiTargetId);
    expect(await bacaLangganan(tenantBalapId!)).toBe(versiTargetId);
    expect(await bacaLangganan(tenantLainId!)).toBe(versiLainId);
    expect(await bacaLangganan(tenantTargetId!)).toBe(versiTargetId);
    expect(await bacaLangganan(tenantLegacyId!)).toBeNull();
  });

  it("menolak versi draf dan paket arsip tanpa mengubah langganan", async () => {
    if (
      planTargetId === null ||
      versiDrafId === null ||
      planArsipId === null ||
      versiArsipId === null
    ) {
      throw new Error("Fixture paket tidak siap.");
    }
    const sebelum = await bacaLangganan(tenantLainId!);

    await expect(rolloutVersiPaket(planTargetId, versiDrafId, "aktor-uji")).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(rolloutVersiPaket(planArsipId, versiArsipId, "aktor-uji")).rejects.toMatchObject({
      code: "CONFLICT",
    });
    // Pratinjau disamakan dengan rollout: paket terarsip pun ditolak.
    await expect(previewRolloutPaket(planArsipId, versiArsipId)).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(await bacaLangganan(tenantLainId!)).toBe(sebelum);
  });

  it("tidak menimpa tenant yang dipindahkan ke paket lain saat rollout berjalan", async () => {
    if (
      planTargetId === null ||
      versiTargetId === null ||
      versiLamaId === null ||
      versiLainId === null ||
      tenantBalapId === null
    ) {
      throw new Error("Fixture paket tidak siap.");
    }
    const desaBalap = tenantBalapId;
    const planTarget = planTargetId;
    const versiTarget = versiTargetId;

    // Kembalikan tenant balap ke versi lama paket target untuk interleaving.
    await db
      .update(villagePlanSubscriptions)
      .set({ planVersionId: versiLamaId })
      .where(eq(villagePlanSubscriptions.villageId, desaBalap));

    const koneksi = await mysql.createConnection(validasiDatabaseUji(process.env).opsiKoneksi);
    try {
      await koneksi.beginTransaction();
      // Kunci baris langganan tenant balap pada koneksi kedua.
      await koneksi.query(
        "SELECT plan_version_id FROM village_plan_subscriptions WHERE village_id = ? FOR UPDATE",
        [desaBalap],
      );

      const rollout = rolloutVersiPaket(planTarget, versiTarget, "aktor-uji");
      // Tangkap hasil rollout lebih awal agar tidak unhandled bila gagal.
      const hasilRollout = rollout.then(
        (jumlah) => ({ jumlah, error: null as unknown }),
        (error: unknown) => ({ jumlah: -1, error }),
      );

      // Tunggu (tanpa sleep tetap) sampai UPDATE rollout benar-benar
      // menunggu kunci baris tersebut. Ini membuktikan langkah
      // baca-tenant rollout sudah lewat sebelum pemindahan terjadi.
      const batas = Date.now() + 15_000;
      let menungguKunci = false;
      while (Date.now() < batas) {
        const [baris] = await koneksi.query<(RowDataPacket & { n: number })[]>(
          `SELECT COUNT(*) AS n FROM performance_schema.processlist
           WHERE ID <> CONNECTION_ID()
             AND COMMAND = 'Query'
             AND INFO LIKE '%village_plan_subscriptions%'
             AND INFO LIKE '%update%'`,
        );
        if (Number(baris[0]?.n) > 0) {
          menungguKunci = true;
          break;
        }
        await new Promise((selesai) => setTimeout(selesai, 25));
      }
      if (!menungguKunci) {
        throw new Error("UPDATE rollout tidak pernah menunggu kunci; interleaving tidak tercapai.");
      }

      // Koneksi kedua memindahkan tenant ke paket lain, lalu melepaskan kunci.
      await koneksi.query(
        "UPDATE village_plan_subscriptions SET plan_version_id = ? WHERE village_id = ?",
        [versiLainId, desaBalap],
      );
      await koneksi.commit();

      const hasil = await hasilRollout;
      if (hasil.error) throw hasil.error;

      expect(hasil.jumlah).toBe(0);
      expect(await bacaLangganan(desaBalap)).toBe(versiLainId);
    } finally {
      await koneksi.end();
    }
  });

  it("gagal tanpa mengubah tenant bila versi target tidak lagi terbit saat rollout menunggu kunci", async () => {
    if (
      planTargetId === null ||
      versiTargetId === null ||
      versiLamaId === null ||
      tenantBalapId === null
    ) {
      throw new Error("Fixture paket tidak siap.");
    }
    const desaBalap = tenantBalapId;
    const planTarget = planTargetId;
    const versiTarget = versiTargetId;

    await db
      .update(villagePlanSubscriptions)
      .set({ planVersionId: versiLamaId })
      .where(eq(villagePlanSubscriptions.villageId, desaBalap));

    const koneksi = await mysql.createConnection(validasiDatabaseUji(process.env).opsiKoneksi);
    try {
      await koneksi.beginTransaction();
      // Kunci baris versi target; rollout harus menunggu kunci ini sebelum
      // memvalidasi status versi di dalam transaksinya.
      await koneksi.query("SELECT id FROM subscription_plan_versions WHERE id = ? FOR UPDATE", [
        versiTarget,
      ]);

      const hasilRollout = rolloutVersiPaket(planTarget, versiTarget, "aktor-uji").then(
        (jumlah) => ({ jumlah, error: null as unknown }),
        (error: unknown) => ({ jumlah: -1, error }),
      );

      const batas = Date.now() + 15_000;
      let menungguKunci = false;
      while (Date.now() < batas) {
        const [baris] = await koneksi.query<(RowDataPacket & { n: number })[]>(
          `SELECT COUNT(*) AS n FROM performance_schema.processlist
           WHERE ID <> CONNECTION_ID()
             AND COMMAND = 'Query'
             AND INFO LIKE '%for update%'
             AND INFO LIKE '%subscription_plan_versions%'`,
        );
        if (Number(baris[0]?.n) > 0) {
          menungguKunci = true;
          break;
        }
        await new Promise((selesai) => setTimeout(selesai, 25));
      }
      if (!menungguKunci) {
        throw new Error(
          "Validasi rollout tidak pernah menunggu kunci versi; interleaving tidak tercapai.",
        );
      }

      // Pemegang kunci mengarsipkan versi target, lalu melepaskan kunci.
      await koneksi.query(
        "UPDATE subscription_plan_versions SET status = 'archived' WHERE id = ?",
        [versiTarget],
      );
      await koneksi.commit();

      const hasil = await hasilRollout;
      expect(hasil.error).toMatchObject({ code: "CONFLICT" });
      expect(await bacaLangganan(desaBalap)).toBe(versiLamaId);
    } finally {
      await koneksi.end();
    }
  }, 30_000);
});

describe("simpanFiturDrafPaket vs terbitkanVersiPaket", () => {
  it("menolak penyimpanan pada versi yang sudah terbit", async () => {
    if (planDrafId === null || versiTerbitDrafId === null) {
      throw new Error("Fixture paket tidak siap.");
    }

    await expect(
      simpanFiturDrafPaket({
        planId: planDrafId,
        versionId: versiTerbitDrafId,
        moduleSlugs: ["keuangan"],
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("tidak mengedit versi yang baru saja terbit saat penyimpanan draf berjalan", async () => {
    if (planDrafId === null || versiDrafBalapId === null) {
      throw new Error("Fixture paket tidak siap.");
    }
    const planDraf = planDrafId;
    const versiDraf = versiDrafBalapId;

    // Keadaan awal draf yang diketahui sebelum interleaving.
    await simpanFiturDrafPaket({
      planId: planDraf,
      versionId: versiDraf,
      moduleSlugs: ["penduduk"],
    });

    const koneksi = await mysql.createConnection(validasiDatabaseUji(process.env).opsiKoneksi);
    try {
      await koneksi.beginTransaction();
      // Kunci baris fitur draf; DELETE di dalam simpanFiturDrafPaket akan
      // berhenti di sini, setelah ia membaca (dan mengunci) baris versi.
      await koneksi.query(
        "SELECT id FROM subscription_plan_features WHERE plan_version_id = ? FOR UPDATE",
        [versiDraf],
      );

      const hasilSimpan = simpanFiturDrafPaket({
        planId: planDraf,
        versionId: versiDraf,
        moduleSlugs: ["keuangan"],
        changelog: "berubah saat balapan",
      }).then(
        () => ({ error: null as unknown }),
        (error: unknown) => ({ error }),
      );

      const batas = Date.now() + 15_000;
      let menungguKunci = false;
      while (Date.now() < batas) {
        const [baris] = await koneksi.query<(RowDataPacket & { n: number })[]>(
          `SELECT COUNT(*) AS n FROM performance_schema.processlist
           WHERE ID <> CONNECTION_ID()
             AND COMMAND = 'Query'
             AND INFO LIKE '%subscription_plan_features%'
             AND INFO LIKE '%delete%'`,
        );
        if (Number(baris[0]?.n) > 0) {
          menungguKunci = true;
          break;
        }
        await new Promise((selesai) => setTimeout(selesai, 25));
      }
      if (!menungguKunci) {
        throw new Error(
          "DELETE fitur simpan tidak pernah menunggu kunci; interleaving tidak tercapai.",
        );
      }

      let terbitSelesai = false;
      const hasilTerbit = terbitkanVersiPaket(planDraf, versiDraf).then(
        () => {
          terbitSelesai = true;
          return { error: null as unknown };
        },
        (error: unknown) => {
          terbitSelesai = true;
          return { error };
        },
      );

      // Penerbitan tidak boleh melompati penyimpanan yang sedang berjalan:
      // ia harus menunggu kunci baris versi (atau sudah selesai ditolak).
      const batasTerbit = Date.now() + 15_000;
      let terbitMenunggu = false;
      while (Date.now() < batasTerbit) {
        if (terbitSelesai) break;
        const [baris] = await koneksi.query<(RowDataPacket & { n: number })[]>(
          `SELECT COUNT(*) AS n FROM performance_schema.processlist
           WHERE ID <> CONNECTION_ID()
             AND COMMAND = 'Query'
             AND INFO LIKE '%for update%'`,
        );
        if (Number(baris[0]?.n) > 0) {
          terbitMenunggu = true;
          break;
        }
        await new Promise((selesai) => setTimeout(selesai, 25));
      }
      if (terbitSelesai && !terbitMenunggu) {
        throw new Error(
          "Penerbitan selesai sebelum penyimpanan draf; interleaving tidak tercapai.",
        );
      }

      // Pada titik ini versi masih harus berstatus draf: penerbitan tidak
      // boleh meng-commit sebelum penyimpanan draf selesai.
      const [barisVersi] = await db
        .select({ status: subscriptionPlanVersions.status })
        .from(subscriptionPlanVersions)
        .where(eq(subscriptionPlanVersions.id, versiDraf))
        .limit(1);
      expect(barisVersi?.status).toBe("draft");

      await koneksi.commit();

      const hasil = await hasilSimpan;
      if (hasil.error) throw hasil.error;
      const hasilTerbitFinal = await hasilTerbit;
      if (hasilTerbitFinal.error) throw hasilTerbitFinal.error;

      const [versiFinal] = await db
        .select({
          status: subscriptionPlanVersions.status,
          changelog: subscriptionPlanVersions.changelog,
        })
        .from(subscriptionPlanVersions)
        .where(eq(subscriptionPlanVersions.id, versiDraf))
        .limit(1);
      expect(versiFinal?.status).toBe("published");
      expect(versiFinal?.changelog).toBe("berubah saat balapan");
      const fiturFinal = await db
        .select({ moduleSlug: subscriptionPlanFeatures.moduleSlug })
        .from(subscriptionPlanFeatures)
        .where(eq(subscriptionPlanFeatures.planVersionId, versiDraf));
      expect(fiturFinal.map((f) => f.moduleSlug)).toEqual(["keuangan"]);
    } finally {
      await koneksi.end();
    }
  }, 30_000);
});

describe("buatDrafVersiPaket bersamaan", () => {
  it("hanya satu draf yang dibuat; yang lain ditolak CONFLICT", async () => {
    if (planDrafId === null) throw new Error("Fixture paket tidak siap.");
    const planDraf = planDrafId;

    const hasil = await Promise.allSettled([
      buatDrafVersiPaket(planDraf, "aktor-uji"),
      buatDrafVersiPaket(planDraf, "aktor-uji"),
    ]);
    const terpenuhi = hasil.filter((h) => h.status === "fulfilled");
    const ditolak = hasil.filter((h) => h.status === "rejected");
    expect(terpenuhi).toHaveLength(1);
    expect(ditolak).toHaveLength(1);
    const alasan = (ditolak[0] as PromiseRejectedResult).reason;
    expect(alasan).toMatchObject({ code: "CONFLICT" });

    const draf = await db
      .select({ id: subscriptionPlanVersions.id })
      .from(subscriptionPlanVersions)
      .where(eq(subscriptionPlanVersions.planId, planDraf));
    // Versi 1 terarsip, versi 2 terbit, dan tepat satu draf baru.
    expect(draf).toHaveLength(3);
  });
});

describe("bentrok duplikat bersamaan", () => {
  it("buatPaket dengan slug sama: satu berhasil, satu CONFLICT", async () => {
    const slug = `sama-${RUN}`;
    const hasil = await Promise.allSettled([
      buatPaket({ slug, name: "Paket Sama Satu", createdBy: "aktor-uji" }),
      buatPaket({ slug, name: "Paket Sama Dua", createdBy: "aktor-uji" }),
    ]);
    const terpenuhi = hasil.filter((h) => h.status === "fulfilled");
    const ditolak = hasil.filter((h) => h.status === "rejected");
    expect(terpenuhi).toHaveLength(1);
    expect(ditolak).toHaveLength(1);
    expect((ditolak[0] as PromiseRejectedResult).reason).toMatchObject({ code: "CONFLICT" });

    const id = (terpenuhi[0] as unknown as PromiseFulfilledResult<{ id: number }>).value.id;
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  });

  it("tambahDomainDesa dengan domain sama: satu berhasil, satu CONFLICT", async () => {
    const desaA = await buatDesa(`9${RUN}3`, `desa-domain-${RUN}-a`);
    const desaB = await buatDesa(`9${RUN}4`, `desa-domain-${RUN}-b`);
    const domain = `alias-${RUN}.test`;
    try {
      const hasil = await Promise.allSettled([
        tambahDomainDesa(desaA, domain),
        tambahDomainDesa(desaB, domain),
      ]);
      const terpenuhi = hasil.filter((h) => h.status === "fulfilled");
      const ditolak = hasil.filter((h) => h.status === "rejected");
      expect(terpenuhi).toHaveLength(1);
      expect(ditolak).toHaveLength(1);
      expect((ditolak[0] as PromiseRejectedResult).reason).toMatchObject({ code: "CONFLICT" });
    } finally {
      await db.delete(villageDomains).where(inArray(villageDomains.villageId, [desaA, desaB]));
      await db.delete(villages).where(inArray(villages.id, [desaA, desaB]));
    }
  });

  it("provisionDesa dengan domain sama: satu berhasil, satu CONFLICT", async () => {
    if (versiProvId === null) throw new Error("Fixture paket tidak siap.");
    const domain = `bersama-${RUN}.test`;
    const dasar = {
      domain,
      adminPassword: "sandi-uji-panjang-2026",
      kuotaMediaMb: null,
      planVersionId: versiProvId,
    } as const;
    let selesaiId: number | null = null;
    try {
      const hasil = await Promise.allSettled([
        provisionDesa({
          ...dasar,
          name: `Desa Bersama Satu ${RUN}`,
          code: `8${RUN}1`,
          adminName: "Admin Bersama Satu",
          adminUsername: `bersama-satu-${RUN}`,
          adminEmail: `bersama-satu-${RUN}@contoh.id`,
        }),
        provisionDesa({
          ...dasar,
          name: `Desa Bersama Dua ${RUN}`,
          code: `8${RUN}2`,
          adminName: "Admin Bersama Dua",
          adminUsername: `bersama-dua-${RUN}`,
          adminEmail: `bersama-dua-${RUN}@contoh.id`,
        }),
      ]);
      const terpenuhi = hasil.filter((h) => h.status === "fulfilled");
      const ditolak = hasil.filter((h) => h.status === "rejected");
      expect(terpenuhi).toHaveLength(1);
      expect(ditolak).toHaveLength(1);
      expect((ditolak[0] as PromiseRejectedResult).reason).toMatchObject({ code: "CONFLICT" });
      selesaiId = (terpenuhi[0] as PromiseFulfilledResult<{ id: number }>).value.id;
    } finally {
      if (selesaiId !== null) {
        const pengguna = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.villageId, selesaiId));
        if (pengguna.length > 0) {
          await db.delete(accounts).where(
            inArray(
              accounts.userId,
              pengguna.map((baris) => baris.id),
            ),
          );
          await db.delete(users).where(eq(users.villageId, selesaiId));
        }
        const daftarRole = await db
          .select({ id: roles.id })
          .from(roles)
          .where(eq(roles.villageId, selesaiId));
        if (daftarRole.length > 0) {
          await db.delete(rolePermissions).where(
            inArray(
              rolePermissions.roleId,
              daftarRole.map((baris) => baris.id),
            ),
          );
          await db.delete(roles).where(eq(roles.villageId, selesaiId));
        }
        await db.delete(modules).where(eq(modules.villageId, selesaiId));
        await db.delete(theme).where(eq(theme.villageId, selesaiId));
        await db.delete(villageDomains).where(eq(villageDomains.villageId, selesaiId));
        await db.delete(villages).where(eq(villages.id, selesaiId));
      }
    }
  }, 60_000);
});

describe("paket terarsip dan akses tenant", () => {
  it("tenant yang berlangganan paket terarsip tetap menerima fitur paketnya (grandfathering)", async () => {
    if (versiArsipId === null) throw new Error("Fixture paket tidak siap.");
    const desa = await buatDesa(`9${RUN}5`, `desa-arsip-${RUN}`);
    try {
      await langganan(desa, versiArsipId);
      // Pengarsipan membekukan perubahan/penerbitan/penetapan baru; langganan
      // yang sudah ada dipertahankan, sesuai salinan UI "menghentikan perubahan
      // dan penerbitan versinya".
      const fitur = await listPlanModuleSlugs(desa);
      expect(fitur).toEqual(new Set(["penduduk"]));
    } finally {
      await db.delete(villagePlanSubscriptions).where(eq(villagePlanSubscriptions.villageId, desa));
      await db.delete(villages).where(eq(villages.id, desa));
    }
  });
});
