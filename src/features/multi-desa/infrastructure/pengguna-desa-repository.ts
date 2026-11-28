import "server-only";

import { and, asc, eq, isNotNull, like, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { accounts, roles, sessions, users, villages } from "@/db/schema";
import { conflict } from "@/lib/errors";

/**
 * Direktori akun pengguna desa lintas tenant (`village_id IS NOT NULL`).
 *
 * Berbeda dari `pengguna-platform-repository` yang hanya menyentuh akun
 * platform, modul ini sengaja dibatasi pada akun desa dan selalu menyertakan
 * desa pemiliknya. Pemanggil tetap wajib memeriksa Super Admin di use case;
 * kolom rahasia (sandi, token sesi) tidak pernah dibaca.
 */

export interface PenggunaDesaRow {
  id: string;
  name: string;
  email: string;
  username: string | null;
  villageId: number;
  villageName: string | null;
  villageSlug: string | null;
  roleName: string | null;
  roleSlug: string | null;
  active: boolean;
  mustChangePin: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  sesiAktif: number;
}

export interface FilterPenggunaDesa {
  /** Kata kunci nama/email/username/nama desa. */
  q?: string;
  /** Batasi ke satu desa. */
  villageId?: number;
  /** `true` hanya akun aktif, `false` hanya nonaktif, `undefined` semua. */
  aktif?: boolean;
  limit?: number;
}

const BATAS_MAKSIMAL = 200;

export async function listPenggunaDesa(
  filter: FilterPenggunaDesa = {},
): Promise<PenggunaDesaRow[]> {
  const syarat = [isNotNull(users.villageId)];

  if (filter.villageId !== undefined) syarat.push(eq(users.villageId, filter.villageId));
  if (filter.aktif !== undefined) syarat.push(eq(users.active, filter.aktif));

  const kataKunci = filter.q?.trim();
  if (kataKunci) {
    const pola = `%${kataKunci}%`;
    const pencarian = or(
      like(users.name, pola),
      like(users.email, pola),
      like(users.username, pola),
      like(villages.name, pola),
    );
    if (pencarian) syarat.push(pencarian);
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      villageId: users.villageId,
      villageName: villages.name,
      villageSlug: villages.slug,
      roleName: roles.name,
      roleSlug: roles.slug,
      active: users.active,
      mustChangePin: users.mustChangePin,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      sesiAktif: sql<number>`(
        SELECT COUNT(*) FROM sessions s
        WHERE s.user_id = users.id AND s.expires_at > NOW() )`,
    })
    .from(users)
    .innerJoin(villages, eq(villages.id, users.villageId))
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(and(...syarat))
    .orderBy(asc(villages.name), asc(users.name))
    .limit(Math.min(filter.limit ?? BATAS_MAKSIMAL, BATAS_MAKSIMAL));

  return rows.map((row) => ({
    ...row,
    villageId: row.villageId as number,
    sesiAktif: Number(row.sesiAktif),
  }));
}

/** Akun desa milik satu tenant, untuk tab Pengguna pada detail tenant. */
export async function listPenggunaSatuDesa(villageId: number): Promise<PenggunaDesaRow[]> {
  return listPenggunaDesa({ villageId });
}

/**
 * Pastikan akun yang akan diubah benar-benar akun desa.
 *
 * Mengembalikan baris ringkas atau `null`; akun platform ditolak agar jalur ini
 * tidak dapat dipakai mengubah akun Super Admin.
 */
export async function getPenggunaDesa(id: string): Promise<PenggunaDesaRow | null> {
  const [baris] = await listPenggunaDesaById(id);
  return baris ?? null;
}

async function listPenggunaDesaById(id: string): Promise<PenggunaDesaRow[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      villageId: users.villageId,
      villageName: villages.name,
      villageSlug: villages.slug,
      roleName: roles.name,
      roleSlug: roles.slug,
      active: users.active,
      mustChangePin: users.mustChangePin,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      sesiAktif: sql<number>`(
        SELECT COUNT(*) FROM sessions s
        WHERE s.user_id = users.id AND s.expires_at > NOW() )`,
    })
    .from(users)
    .innerJoin(villages, eq(villages.id, users.villageId))
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.id, id), isNotNull(users.villageId)))
    .limit(1);

  return rows.map((row) => ({
    ...row,
    villageId: row.villageId as number,
    sesiAktif: Number(row.sesiAktif),
  }));
}

export async function setStatusPenggunaDesa(id: string, active: boolean): Promise<void> {
  await db
    .update(users)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(users.id, id), isNotNull(users.villageId)));
}

export async function resetSandiPenggunaDesa(id: string, passwordHash: string): Promise<void> {
  // Sandi disimpan di tabel `accounts` (provider credential), bukan di `users`.
  await db.transaction(async (tx) => {
    const hasil = await tx
      .update(accounts)
      .set({ password: passwordHash })
      .where(and(eq(accounts.userId, id), eq(accounts.providerId, "credential")));

    if (hasil[0].affectedRows === 0) {
      throw conflict("Akun desa ini tidak memiliki kredensial sandi.");
    }

    await tx.delete(sessions).where(eq(sessions.userId, id));
    await tx.update(users).set({ updatedAt: new Date() }).where(eq(users.id, id));
  });
}

export async function cabutSesiPenggunaDesa(id: string): Promise<number> {
  const [hitung] = await db
    .select({ jumlah: sql<number>`COUNT(*)` })
    .from(sessions)
    .where(eq(sessions.userId, id));

  await db.delete(sessions).where(eq(sessions.userId, id));

  return Number(hitung?.jumlah ?? 0);
}

/** Jumlah akun desa per tenant, untuk ringkasan detail tenant. */
export async function hitungPenggunaDesa(villageId: number): Promise<number> {
  const [row] = await db
    .select({ jumlah: sql<number>`COUNT(*)` })
    .from(users)
    .where(and(eq(users.villageId, villageId), isNotNull(users.villageId)));

  return Number(row?.jumlah ?? 0);
}
