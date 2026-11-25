import "server-only";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  accounts,
  subscriptionPlans,
  subscriptionPlanVersions,
  tenantDomainTombstones,
  theme,
  users,
  villageDomains,
  villagePlanSubscriptions,
  villages,
  websiteTemplates,
} from "@/db/schema";
import type { DesaBaruInput } from "@/features/multi-desa/domain/desa-baru";
import { susunSubdomainPlatform } from "@/features/multi-desa/domain/jenis-domain";
import {
  muatTemplateTenant,
  tulisFondasiTenant,
} from "@/features/multi-desa/infrastructure/template-tenant-repository";
import { env } from "@/lib/env";
import { conflict, isDuplicateKeyError } from "@/lib/errors";

export interface DesaSuperAdminRow {
  id: number;
  name: string | null;
  slug: string | null;
  code: string | null;
  domain: string | null;
  district: string | null;
  regency: string | null;
  active: boolean;
  kuotaMediaMb: number | null;
  /** Slug tema publik aktif; `null` bila desa belum memilih tema. */
  tema: string | null;
  /** Nama tampilan tema aktif; cache dari manifest tema. */
  temaNama: string | null;
  temaVersi: string | null;
  pengguna: number;
  penduduk: number;
  jenisSurat: number;
  createdAt: Date;
  /** Awal masa tenggang retensi; `null` = desa aktif atau belum pernah nonaktif. */
  nonaktifSejak: Date | null;
  purgedAt: Date | null;
  /** Apakah ada berkas ekspor yang masih berlaku (syarat purge). */
  adaEksporBerlaku: boolean;
}

/** Daftar seluruh desa beserta ringkasan isinya (khusus super admin). */
export async function listDesaSuperAdmin(): Promise<DesaSuperAdminRow[]> {
  const rows = await db
    .select({
      id: villages.id,
      name: villages.name,
      slug: villages.slug,
      code: villages.code,
      domain: villages.domain,
      district: villages.district,
      regency: villages.regency,
      active: villages.active,
      kuotaMediaMb: villages.kuotaMediaMb,
      createdAt: villages.createdAt,
      nonaktifSejak: villages.nonaktifSejak,
      purgedAt: villages.purgedAt,
      tema: sql<string | null>`(
        SELECT t.slug FROM theme t
        WHERE t.village_id = ${villages.id} AND t.aktif = 1
        LIMIT 1 )`,
      temaNama: sql<string | null>`(
        SELECT t.nama FROM theme t
        WHERE t.village_id = ${villages.id} AND t.aktif = 1
        LIMIT 1 )`,
      temaVersi: sql<string | null>`(
        SELECT t.versi FROM theme t
        WHERE t.village_id = ${villages.id} AND t.aktif = 1
        LIMIT 1 )`,
      // Kolom luar wajib dikualifikasi: interpolasi `${villages.id}` dirender
      // sebagai `id` polos di dalam subquery, sehingga `u.village_id = id`
      // terbaca sebagai `u.village_id = u.id` dan hitungan selalu 0.
      pengguna: sql<number>`(SELECT COUNT(*) FROM users u WHERE u.village_id = villages.id)`,
      penduduk: sql<number>`(SELECT COUNT(*) FROM residents r WHERE r.village_id = villages.id)`,
      jenisSurat: sql<number>`(
        SELECT COUNT(*) FROM letter_types lt WHERE lt.village_id = villages.id )`,
      adaEksporBerlaku: sql<number>`EXISTS(
        SELECT 1 FROM tenant_exports te
        WHERE te.village_id = villages.id AND te.kedaluwarsa_pada > NOW() )`,
    })
    .from(villages)
    .orderBy(asc(villages.id));

  return rows.map((row) => ({
    ...row,
    pengguna: Number(row.pengguna),
    penduduk: Number(row.penduduk),
    jenisSurat: Number(row.jenisSurat),
    adaEksporBerlaku: Boolean(Number(row.adaEksporBerlaku)),
  }));
}

function unwrapId(rows: { id: number }[]): number {
  const row = rows[0];
  if (!row) throw conflict("Operasi database tidak mengembalikan id.");
  return row.id;
}

function opsional(nilai: string | undefined): string | null {
  const bersih = nilai?.trim();
  return bersih ? bersih : null;
}

/** Label subdomain dari nama desa: huruf kecil, angka, dan tanda hubung. */
function slugDariNama(nama: string): string {
  const dasar = nama
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return dasar || "desa";
}

/**
 * Buat desa baru beserta seluruh fondasinya.
 *
 * Fondasi (role, modul, matriks akses, tema, menu publik) berasal dari template
 * platform di `src/db/templates/tenant-template.ts`, **bukan** dari desa lain
 * yang kebetulan sudah ada. Karena itu provisioning berjalan pada instalasi baru
 * yang belum berisi desa sama sekali.
 *
 * Katalog surat, buku bumindes, dan kategori inventaris sengaja tidak dibuat:
 * ketiganya data master milik desa dan tidak boleh diwariskan dari tenant lain.
 *
 * Akun administrator desa dibuat langsung (bukan lewat `auth.api`) dengan hash
 * resmi better-auth agar login PIN/sandi tetap cocok. Versi paket yang dipilih
 * wajib sudah terbit dan tercatat sebagai langganan awal tenant.
 */
export async function provisionDesa(
  input: DesaBaruInput,
): Promise<{ id: number; planSlug: string; planVersion: number }> {
  // Slug unik untuk wildcard `<slug>.<DESA_BASE_DOMAIN>`. Slug pilihan operator
  // dipakai apa adanya dan ditolak bila sudah dipakai; slug turunan nama desa
  // diberi akhiran angka agar pendaftaran tetap berhasil.
  const slugDipakai = new Set(
    (await db.select({ slug: villages.slug }).from(villages)).map((baris) => baris.slug),
  );
  const slugDasar = input.slug?.trim() || slugDariNama(input.name);
  let slug = slugDasar;
  if (input.slug) {
    if (slugDipakai.has(slug)) {
      throw conflict("Subdomain tersebut sudah dipakai desa lain. Pilih label lain.");
    }
  } else {
    for (let urutan = 2; slugDipakai.has(slug); urutan += 1) {
      slug = `${slugDasar}-${urutan}`;
    }
  }

  // Setiap tenant wajib punya alamat. Bila operator belum menyiapkan domain
  // sendiri, pakai subdomain platform `<slug>.<DESA_BASE_DOMAIN>`; domain
  // custom dapat ditambahkan/diubah belakangan lewat panel Kelola.
  const domain = input.domain ?? susunSubdomainPlatform(slug, env.DESA_BASE_DOMAIN);
  if (!domain) {
    throw conflict(
      "Subdomain platform belum dikonfigurasi. Isi domain desa secara manual agar tenant memiliki alamat.",
    );
  }

  const [domainAda] = await db
    .select({ villageId: villageDomains.villageId })
    .from(villageDomains)
    .where(eq(villageDomains.domain, domain))
    .limit(1);
  if (domainAda) throw conflict("Domain tersebut sudah dipakai desa lain.");

  // Domain milik desa yang sudah di-purge tetap dicadangkan (tombstone) agar
  // tenant baru tidak mewarisi identitas desa lama.
  const [tombstone] = await db
    .select({ id: tenantDomainTombstones.id })
    .from(tenantDomainTombstones)
    .where(eq(tenantDomainTombstones.domain, domain))
    .limit(1);
  if (tombstone) {
    throw conflict("Domain tersebut milik desa yang sudah di-purge dan tidak dapat dipakai ulang.");
  }

  const [usernameAda] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, input.adminUsername))
    .limit(1);
  if (usernameAda) throw conflict("Username admin sudah digunakan.");

  const [emailAda] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.adminEmail))
    .limit(1);
  if (emailAda) throw conflict("Email admin sudah digunakan.");

  // Versi paket harus terbit dan paketnya aktif; diperiksa sebelum menulis apa
  // pun agar pilihan yang salah tidak meninggalkan desa setengah jadi.
  const [paket] = await db
    .select({
      planSlug: subscriptionPlans.slug,
      planVersion: subscriptionPlanVersions.version,
    })
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
  if (!paket) throw conflict("Versi paket yang dipilih tidak tersedia atau belum terbit.");

  // Template pilihan dari katalog wajib terbit; diperiksa sebelum menulis apa
  // pun agar pilihan yang salah tidak meninggalkan desa setengah jadi.
  let temaPilihan: { slug: string; name: string; version: string; tokens: string } | null = null;
  if (input.themeSlug) {
    const [katalog] = await db
      .select({
        slug: websiteTemplates.slug,
        name: websiteTemplates.name,
        version: websiteTemplates.version,
        tokens: websiteTemplates.tokens,
      })
      .from(websiteTemplates)
      .where(
        and(eq(websiteTemplates.slug, input.themeSlug), eq(websiteTemplates.status, "published")),
      )
      .limit(1);
    if (!katalog) {
      throw conflict("Template tema yang dipilih tidak tersedia atau belum terbit.");
    }
    temaPilihan = katalog;
  }

  // Validasi template fondasi sebelum menulis apa pun: template rusak tidak
  // boleh meninggalkan desa setengah jadi.
  const template = muatTemplateTenant();
  const passwordHash = await hashPassword(input.adminPassword);

  try {
    return await provisionDesaDalamTransaksi(
      input,
      template,
      temaPilihan,
      passwordHash,
      slug,
      domain,
      paket,
    );
  } catch (error) {
    // Provisioning bersamaan dapat sama-sama lolos pemeriksaan domain/
    // username/email di atas; yang kalah menabrak unique index sebagai
    // ER_DUP_ENTRY. Petakan ke CONFLICT, bukan error 500.
    if (isDuplicateKeyError(error)) {
      throw conflict(
        "Data bentrok dengan data yang sudah ada (domain, username, atau subdomain). Muat ulang dan coba lagi.",
      );
    }
    throw error;
  }
}

async function provisionDesaDalamTransaksi(
  input: DesaBaruInput,
  template: ReturnType<typeof muatTemplateTenant>,
  temaPilihan: { slug: string; name: string; version: string; tokens: string } | null,
  passwordHash: string,
  slug: string,
  domain: string,
  paket: { planSlug: string; planVersion: number },
): Promise<{ id: number; planSlug: string; planVersion: number }> {
  return db.transaction(async (tx) => {
    const villageId = unwrapId(
      await tx
        .insert(villages)
        .values({
          name: input.name,
          code: input.code,
          bpsCode: opsional(input.kodeBps),
          postalCode: opsional(input.kodePos),
          slug,
          domain,
          district: opsional(input.district),
          districtCode: opsional(input.districtCode),
          regency: opsional(input.regency),
          regencyCode: opsional(input.regencyCode),
          province: opsional(input.province),
          provinceCode: opsional(input.provinceCode),
          headName: opsional(input.headName),
          // Email desa terpisah dari email akun administrator.
          email: opsional(input.email),
          phone: opsional(input.phone),
          officeAddress: opsional(input.officeAddress),
          active: true,
          kuotaMediaMb: input.kuotaMediaMb ?? null,
        })
        .$returningId(),
    );

    // Domain utama selalu dibuat (alias lain dapat ditambahkan ke tabel yang sama).
    await tx.insert(villageDomains).values({ villageId, domain, isPrimary: true });

    const { adminRoleId } = await tulisFondasiTenant(tx, villageId, template);

    // Template pilihan menggantikan tema bawaan fondasi. Baris tema dibuat
    // fondasi; perbarui slug/nama/versi/opsi dari katalog terbit.
    if (temaPilihan) {
      await tx
        .update(theme)
        .set({
          slug: temaPilihan.slug,
          nama: temaPilihan.name,
          versi: temaPilihan.version,
          opsi: temaPilihan.tokens,
        })
        .where(eq(theme.villageId, villageId));
    }

    // Akun administrator desa baru.
    const userId = randomUUID();
    await tx.insert(users).values({
      id: userId,
      name: input.adminName,
      email: input.adminEmail,
      emailVerified: true,
      username: input.adminUsername,
      displayUsername: input.adminUsername,
      roleId: adminRoleId,
      villageId,
      active: true,
      mustChangePin: false,
    });
    await tx.insert(accounts).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    });

    // Langganan paket awal tenant; perubahan versi berikutnya lewat rollout
    // atau penetapan paket eksplisit di konsol platform.
    await tx
      .insert(villagePlanSubscriptions)
      .values({ villageId, planVersionId: input.planVersionId, assignedBy: null });

    return { id: villageId, planSlug: paket.planSlug, planVersion: paket.planVersion };
  });
}
