import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, forbidden as renderForbidden } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import { accounts, roles, sessions, users, villages } from "@/db/schema";
import { villageSecuritySettings } from "@/db/schema/village-security";
import {
  computeEffectivePermissions,
  hasPermission,
  type EffectivePermissions,
} from "@/features/pengaturan/rbac/application/authorization";
import type { Action } from "@/features/pengaturan/rbac/domain/permission";
import { auth } from "@/lib/auth";
import { forbidden, unauthenticated } from "@/lib/errors";

/** Pengguna yang sedang login beserta role & izin efektifnya. */
export interface CurrentUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  image: string | null;
  villageId: number | null;
  roleId: number | null;
  /** Penduduk yang ditautkan ke akun; hanya untuk akun warga. */
  residentId: number | null;
  /** Warga wajib mengganti PIN sementara sebelum memakai layanan. */
  mustChangePin: boolean;
  passwordExpired: boolean;
  mustEnrollTwoFactor: boolean;
  permissions: EffectivePermissions;
  /**
   * Identitas asli pemilik sesi. Selama impersonasi, `id` tetap pemilik sesi
   * (super admin) agar audit mencatat pelaku sebenarnya; field lain di bawah
   * memuat identitas efektif administrator desa target.
   */
  realActorId: string;
  /** True bila sesi ini sedang mengimpersonasi administrator desa. */
  impersonating: boolean;
  /** Akun administrator desa target impersonasi; `null` bila tidak impersonasi. */
  impersonationTargetUserId: string | null;
  impersonationExpiresAt: Date | null;
}

/** Pengguna yang sudah dipastikan memiliki akun warga. */
interface WargaUser extends CurrentUser {
  residentId: number;
}

/**
 * Sesi mentah better-auth (di-cache per permintaan).
 *
 * JANGAN dipakai langsung untuk otorisasi; gunakan `getCurrentUser()`.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Ambil pengguna saat ini lengkap dengan izin efektifnya.
 * Mengembalikan `null` bila belum login.
 *
 * Ini adalah satu-satunya pintu resmi untuk mengetahui "siapa yang sedang
 * login" di server. Semua Server Action & Route Handler WAJIB memakainya.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = session.user;

  // Status aktif, role, dan desa dibaca dari DB (bukan cookie cache sesi) agar
  // akun yang dinonaktifkan, diturunkan role-nya, atau dipindah desa langsung
  // kehilangan akses lama tanpa menunggu cache sesi kedaluwarsa.
  const [account] = await db
    .select({
      active: users.active,
      residentId: users.residentId,
      mustChangePin: users.mustChangePin,
      twoFactorEnabled: users.twoFactorEnabled,
      villageActive: villages.active,
      villageId: users.villageId,
      roleId: users.roleId,
    })
    .from(users)
    .leftJoin(villages, eq(users.villageId, villages.id))
    .where(eq(users.id, user.id))
    .limit(1);

  if (!account?.active) return null;

  let passwordExpired = false;
  let mustEnrollTwoFactor = false;
  if (account.villageId !== null) {
    const [[security], [credential]] = await Promise.all([
      db
        .select({
          timeout: villageSecuritySettings.sessionTimeoutMinutes,
          enabled: villageSecuritySettings.autoLogoutInactive,
          passwordExpiryDays: villageSecuritySettings.passwordExpiryDays,
          requireTwoFactor: villageSecuritySettings.requireTwoFactorForAllUsers,
        })
        .from(villageSecuritySettings)
        .where(eq(villageSecuritySettings.villageId, account.villageId))
        .limit(1),
      db
        .select({ updatedAt: accounts.updatedAt })
        .from(accounts)
        .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")))
        .limit(1),
    ]);
    const expiryDays = security?.passwordExpiryDays ?? 90;
    passwordExpired =
      account.residentId === null &&
      expiryDays > 0 &&
      Boolean(credential?.updatedAt) &&
      Date.now() - credential!.updatedAt!.getTime() > expiryDays * 86_400_000;
    mustEnrollTwoFactor =
      account.residentId === null &&
      Boolean(security?.requireTwoFactor) &&
      !account.twoFactorEnabled;
    if (security?.enabled ?? true) {
      const timeoutMinutes = security?.timeout ?? 30;
      const lastActivity = (session.session.updatedAt ?? session.session.createdAt).getTime();
      if (Date.now() - lastActivity > timeoutMinutes * 60_000) {
        await db.delete(sessions).where(eq(sessions.id, session.session.id));
        return null;
      }
      // Touch session on authenticated server requests to implement an actual idle timeout.
      await db
        .update(sessions)
        .set({ updatedAt: new Date() })
        .where(eq(sessions.id, session.session.id));
    }
  }

  // Desa nonaktif (arsip lunak) memblokir seluruh akun staf & warga miliknya.
  // Super admin (villageId null) tetap bisa masuk untuk mengelola desa.
  if (account.villageId !== null && account.villageActive !== true) return null;

  const impersonasi = await muatKonteksImpersonasi(session.session.id, account.villageId);
  if (impersonasi) {
    return {
      id: user.id,
      realActorId: user.id,
      name: impersonasi.name,
      username: impersonasi.username,
      email: impersonasi.email,
      image: impersonasi.image,
      villageId: impersonasi.villageId,
      roleId: impersonasi.roleId,
      residentId: null,
      mustChangePin: impersonasi.mustChangePin,
      passwordExpired: false,
      mustEnrollTwoFactor: false,
      permissions: await computeEffectivePermissions(
        impersonasi.roleId ?? 0,
        impersonasi.villageId,
      ),
      impersonating: true,
      impersonationTargetUserId: impersonasi.userId,
      impersonationExpiresAt: impersonasi.expiresAt,
    };
  }

  const permissions = await computeEffectivePermissions(account.roleId ?? 0, account.villageId);

  return {
    id: user.id,
    realActorId: user.id,
    name: user.name,
    username: (user.username as string | null) ?? null,
    email: user.email,
    image: user.image ?? null,
    villageId: account.villageId,
    roleId: account.roleId,
    residentId: account.residentId,
    mustChangePin: account.mustChangePin,
    passwordExpired,
    mustEnrollTwoFactor,
    permissions,
    impersonating: false,
    impersonationTargetUserId: null,
    impersonationExpiresAt: null,
  };
});

/** Baris konteks impersonasi pada sesi, dibaca langsung dari tabel sesi. */
async function barisImpersonasi(sessionId: string) {
  const [row] = await db
    .select({
      impersonatedVillageId: sessions.impersonatedVillageId,
      impersonatedUserId: sessions.impersonatedUserId,
      impersonatedExpiresAt: sessions.impersonatedExpiresAt,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return row ?? null;
}

interface TargetImpersonasi {
  userId: string;
  name: string;
  username: string | null;
  email: string;
  image: string | null;
  villageId: number;
  roleId: number | null;
  mustChangePin: boolean;
  expiresAt: Date;
}

/**
 * Muat konteks impersonasi yang masih berlaku, atau `null`.
 *
 * Hanya akun platform (`villageId === null`) yang boleh mengimpersonasi, dan
 * target wajib administrator desa aktif. Konteks kedaluwarsa atau target yang
 * tak lagi valid diperlakukan sebagai tidak ada — sesi super admin tidak
 * ikut terpengaruh.
 */
async function muatKonteksImpersonasi(
  sessionId: string,
  villageIdPemilik: number | null,
): Promise<TargetImpersonasi | null> {
  if (villageIdPemilik !== null) return null;

  const baris = await barisImpersonasi(sessionId);
  if (!baris?.impersonatedVillageId || !baris.impersonatedUserId || !baris.impersonatedExpiresAt) {
    return null;
  }
  if (baris.impersonatedExpiresAt <= new Date()) return null;

  const [target] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      image: users.image,
      villageId: users.villageId,
      roleId: users.roleId,
      mustChangePin: users.mustChangePin,
      active: users.active,
      residentId: users.residentId,
      villageActive: villages.active,
      roleSlug: roles.slug,
    })
    .from(users)
    .leftJoin(villages, eq(users.villageId, villages.id))
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, baris.impersonatedUserId))
    .limit(1);

  if (
    !target ||
    target.villageId !== baris.impersonatedVillageId ||
    target.active !== true ||
    target.residentId !== null ||
    target.roleSlug !== "administrator" ||
    target.villageActive !== true
  ) {
    return null;
  }

  return {
    userId: target.id,
    name: target.name,
    username: target.username ?? null,
    email: target.email,
    image: target.image ?? null,
    villageId: baris.impersonatedVillageId,
    roleId: target.roleId,
    mustChangePin: target.mustChangePin,
    expiresAt: baris.impersonatedExpiresAt,
  };
}

/** Keadaan impersonasi sesi saat ini, untuk banner dan use case keluar. */
export interface KeadaanImpersonasi {
  sessionId: string;
  ownerId: string;
  ownerVillageId: number | null;
  ownerRoleId: number | null;
  impersonating: boolean;
  impersonatedVillageId: number | null;
  impersonatedUserId: string | null;
  impersonatedExpiresAt: Date | null;
}

/** Sesi aktif, pemilik sesi, dan konteks impersonasi mentah (tanpa validasi target). */
export const getImpersonationState = cache(async (): Promise<KeadaanImpersonasi | null> => {
  const session = await getSession();
  if (!session) return null;

  const [row] = await db
    .select({
      sessionId: sessions.id,
      ownerId: sessions.userId,
      impersonatedVillageId: sessions.impersonatedVillageId,
      impersonatedUserId: sessions.impersonatedUserId,
      impersonatedExpiresAt: sessions.impersonatedExpiresAt,
    })
    .from(sessions)
    .where(eq(sessions.id, session.session.id))
    .limit(1);
  if (!row) return null;

  const [owner] = await db
    .select({ villageId: users.villageId, roleId: users.roleId })
    .from(users)
    .where(eq(users.id, row.ownerId))
    .limit(1);
  if (!owner) return null;

  const berlaku =
    row.impersonatedVillageId !== null &&
    row.impersonatedUserId !== null &&
    row.impersonatedExpiresAt !== null &&
    row.impersonatedExpiresAt > new Date();

  return {
    sessionId: row.sessionId,
    ownerId: row.ownerId,
    ownerVillageId: owner.villageId,
    ownerRoleId: owner.roleId,
    impersonating: berlaku,
    impersonatedVillageId: berlaku ? row.impersonatedVillageId : null,
    impersonatedUserId: berlaku ? row.impersonatedUserId : null,
    impersonatedExpiresAt: berlaku ? row.impersonatedExpiresAt : null,
  };
});

/**
 * Pastikan ada pengguna login, jika tidak alihkan ke halaman masuk.
 * Dipakai di Server Component (layout/halaman).
 */
export async function verifySession(redirectTo = "/masuk"): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(redirectTo);
  }
  if (user.passwordExpired) redirect("/profil/keamanan?passwordExpired=1");
  if (user.mustEnrollTwoFactor) redirect("/profil/keamanan?require2fa=1");

  return user;
}

/**
 * Ambil pengguna atau lempar `AppError` (untuk Server Action / Route Handler).
 */
export async function requireUser(
  options: { allowSecurityRecovery?: boolean } = {},
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthenticated();
  if ((user.passwordExpired || user.mustEnrollTwoFactor) && !options.allowSecurityRecovery)
    throw forbidden();
  return user;
}

/**
 * Pastikan sesi aktif adalah akun warga (punya `residentId`).
 *
 * Dipakai Server Component area warga. Pengguna staf yang membuka area warga
 * dialihkan ke beranda admin; pengguna tanpa sesi ke halaman masuk.
 */
export async function verifyWargaSession(): Promise<WargaUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/masuk?next=%2Flayanan-mandiri%2Fberanda");
  }

  if (user.residentId === null) {
    redirect("/beranda");
  }

  return user as WargaUser;
}

/**
 * Gerbang halaman area warga.
 *
 * Layout dan page dapat dirender paralel, jadi setiap page wajib memeriksa
 * sesi sendiri sebelum memanggil use case yang melempar `forbidden` untuk
 * akun staf. Warga dengan PIN sementara diarahkan ke form ubah PIN.
 */
export async function verifyWargaPage(): Promise<WargaUser> {
  const user = await verifyWargaSession();

  if (user.mustChangePin) {
    redirect("/layanan-mandiri/ubah-pin");
  }

  return user;
}

/**
 * Versi `verifyWargaSession` untuk Server Action/Route Handler: tidak mengalihkan,
 * tetapi melempar kesalahan yang aman.
 */
export async function requireWarga(): Promise<WargaUser> {
  const user = await requireUser();

  if (user.residentId === null) {
    throw forbidden("Akun ini bukan akun warga.");
  }

  return user as WargaUser;
}

/** Warga yang sudah boleh memakai layanan (PIN sementara sudah diganti). */
export async function requireWargaAktif(): Promise<WargaUser> {
  const user = await requireWarga();

  if (user.mustChangePin) {
    throw forbidden("Ganti PIN sementara terlebih dahulu sebelum memakai layanan.");
  }

  return user;
}

/**
 * Wajib punya izin `action` atas **salah satu** `resources`; jika tidak, lempar
 * kesalahan.
 *
 * Dipakai halaman yang menggabungkan beberapa menu pemilik, misalnya Website →
 * Konten yang menampung berita, galeri, agenda, dan slider. Server Action tetap
 * harus memakai `requirePermission` untuk resource spesifik aksinya.
 */
export async function requireAnyPermission(
  resources: readonly string[],
  action: Action,
): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.passwordExpired) throw forbidden();

  if (!resources.some((resource) => hasPermission(user.permissions, resource, action))) {
    // `forbidden()` Next merender `src/app/forbidden.tsx` (403), bukan error
    // runtime. Server Action yang memanggil ini tetap mendapat respons 403.
    renderForbidden();
  }

  return user;
}

/**
 * Wajib punya izin `action` atas `resource`; jika tidak, lempar kesalahan.
 *
 * Selalu panggil ini di awal setiap Server Action yang mengubah data — Server
 * Action dapat dipanggil langsung (POST) tanpa melewati UI.
 */
export async function requirePermission(resource: string, action: Action): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.passwordExpired) renderForbidden();

  if (!hasPermission(user.permissions, resource, action)) {
    // Halaman tanpa izin harus menampilkan 403 yang ramah, bukan layar error.
    renderForbidden();
  }

  return user;
}
