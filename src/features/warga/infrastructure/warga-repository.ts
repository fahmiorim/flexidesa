import "server-only";

import { randomInt, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { accounts, families, regions, residents, users } from "@/db/schema";
import type { WargaAccountSummary, WargaProfile } from "@/features/warga/domain/warga";

/** Calon pemilik akun warga (data minimum yang perlu diperiksa). */
interface ResidentAccountCandidate {
  id: number;
  name: string;
  nationalId: string | null;
  lifeStatus: string;
}

/** Ambil penduduk pada desa yang sama; `null` bila bukan milik desa ini. */
export async function findResidentForAccount(
  villageId: number,
  residentId: number,
): Promise<ResidentAccountCandidate | null> {
  const [row] = await db
    .select({
      id: residents.id,
      name: residents.name,
      nationalId: residents.nationalId,
      lifeStatus: residents.lifeStatus,
    })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), eq(residents.id, residentId)))
    .limit(1);

  return row ?? null;
}

/** Apakah username/NIK sudah dipakai akun mana pun (staf atau warga). */

/** Akun warga milik satu penduduk (unik), atau `null`. */

/** Peta `residentId → akun` untuk baris tabel penduduk yang sedang tampil. */

/** PIN sementara 6 digit; hindari PIN berulang/berurutan yang sangat lemah. */
export function generatePin(): string {
  const lemah = new Set(["000000", "111111", "123456", "654321", "222222", "333333"]);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const pin = randomInt(0, 1_000_000).toString().padStart(6, "0");
    if (!lemah.has(pin)) return pin;
  }

  // Praktis tidak tercapai; tetap beri nilai yang valid.
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Buat akun warga + akun kredensial dalam satu transaksi.
 *
 * `users.email` wajib diisi; email fallback berisi NIK + id desa agar tidak
 * bentrok dengan akun staf atau desa lain. Login tetap memakai NIK.
 */
export async function createWargaAccount(input: {
  villageId: number;
  residentId: number;
  name: string;
  nationalId: string;
  pin: string;
}): Promise<WargaAccountSummary> {
  const passwordHash = await hashPassword(input.pin);
  const userId = randomUUID();
  const email = `${input.nationalId}.${input.villageId}@warga.desa.local`;

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: input.name,
      email,
      username: input.nationalId,
      displayUsername: input.nationalId,
      emailVerified: true,
      villageId: input.villageId,
      roleId: null,
      active: true,
      residentId: input.residentId,
      mustChangePin: true,
    });

    await tx.insert(accounts).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    });
  });

  return {
    userId,
    username: input.nationalId,
    active: true,
    mustChangePin: true,
  };
}

/** Ganti hash PIN warga dan tandai wajib ganti PIN. */
export async function resetWargaPin(userId: string, pin: string): Promise<void> {
  const passwordHash = await hashPassword(pin);

  await db.transaction(async (tx) => {
    await tx.update(users).set({ mustChangePin: true, active: true }).where(eq(users.id, userId));

    const [account] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
      .limit(1);

    if (account) {
      await tx.update(accounts).set({ password: passwordHash }).where(eq(accounts.id, account.id));
      return;
    }

    await tx.insert(accounts).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    });
  });
}

/** Tandai PIN warga sudah diganti (dipanggil setelah better-auth sukses). */
export async function clearMustChangePin(userId: string): Promise<void> {
  await db.update(users).set({ mustChangePin: false }).where(eq(users.id, userId));
}

/** Profil warga untuk halaman ringkasan; selalu dibatasi desa & residentId. */
export async function getWargaProfile(
  villageId: number,
  residentId: number,
): Promise<WargaProfile | null> {
  const [row] = await db
    .select({
      residentId: residents.id,
      name: residents.name,
      nationalId: residents.nationalId,
      gender: residents.gender,
      birthPlace: residents.birthPlace,
      birthDate: residents.birthDate,
      address: residents.address,
      phone: residents.phone,
      familyNumber: families.number,
      dusun: regions.dusun,
      rw: regions.rw,
      rt: regions.rt,
    })
    .from(residents)
    .leftJoin(families, eq(residents.familyId, families.id))
    .leftJoin(regions, eq(residents.regionId, regions.id))
    .where(and(eq(residents.villageId, villageId), eq(residents.id, residentId)))
    .limit(1);

  if (!row) return null;

  const regionLabel = [row.dusun, row.rw ? `RW ${row.rw}` : null, row.rt ? `RT ${row.rt}` : null]
    .filter(Boolean)
    .join(" / ");

  return {
    residentId: row.residentId,
    name: row.name,
    nationalId: row.nationalId,
    gender: row.gender,
    birthPlace: row.birthPlace,
    birthDate: row.birthDate,
    address: row.address,
    phone: row.phone,
    familyNumber: row.familyNumber,
    regionLabel: regionLabel || null,
  };
}
