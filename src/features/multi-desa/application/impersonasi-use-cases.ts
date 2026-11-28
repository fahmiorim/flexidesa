import "server-only";

import { z } from "zod";

import { kadaluarsaImpersonasi } from "@/features/multi-desa/domain/impersonasi";
import {
  akhiriImpersonasi,
  ambilInfoTargetImpersonasi,
  mulaiImpersonasi,
} from "@/features/multi-desa/infrastructure/impersonasi-repository";
import { findAdminDesa } from "@/features/multi-desa/infrastructure/kelola-desa-repository";
import { getPenggunaDesa } from "@/features/multi-desa/infrastructure/pengguna-desa-repository";
import { recordAuditEvent } from "@/features/pengaturan/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/pengaturan/audit/domain/audit";
import { getRoleById } from "@/features/pengaturan/rbac/application/kontrak";
import { PLATFORM_ROLE_SLUG } from "@/features/pengaturan/rbac/domain/role";
import { getImpersonationState, type KeadaanImpersonasi } from "@/lib/dal";
import { conflict, forbidden, notFound, unauthenticated } from "@/lib/errors";

/**
 * Impersonasi Super Admin sebagai administrator desa.
 *
 * Pendekatan overlay: sesi tetap milik super admin; kolom konteks pada baris
 * sesi menumpahkan identitas efektif menjadi administrator desa target (lihat
 * `getCurrentUser` di `src/lib/dal.ts`). Karena itu gerbang di sini memeriksa
 * **pemilik sesi** (`ownerVillageId`/`ownerRoleId`), bukan identitas efektif —
 * `requireSuperAdmin()` biasa akan gagal tepat saat impersonasi berjalan, dan
 * justru itulah yang mencegah akses kembali ke konsol platform selama impersonasi.
 */

const villageIdSchema = z.coerce
  .number({ error: "Desa tidak valid." })
  .int("Desa tidak valid.")
  .positive("Desa tidak valid.");

/** Pastikan pemilik sesi adalah pengelola platform. */
async function requireSuperAdminAsli(): Promise<KeadaanImpersonasi> {
  const state = await getImpersonationState();
  if (!state) throw unauthenticated();

  if (state.ownerVillageId !== null || state.ownerRoleId === null) {
    throw forbidden("Hanya super admin yang boleh mengimpersonasi administrator desa.");
  }

  const role = await getRoleById(state.ownerRoleId, state.ownerVillageId);
  if (role?.slug !== PLATFORM_ROLE_SLUG) {
    throw forbidden("Hanya super admin yang boleh mengimpersonasi administrator desa.");
  }

  return state;
}

interface HasilMasukSebagai {
  villageId: number;
  targetUserId: string;
  username: string | null;
  kadaluarsa: Date;
}

/** Mulai impersonasi administrator desa pada sesi super admin saat ini. */
export async function masukSebagaiAdminDesa(input: unknown): Promise<HasilMasukSebagai> {
  const state = await requireSuperAdminAsli();
  const villageId = villageIdSchema.parse(input);

  if (state.impersonating) {
    throw conflict("Sesi ini sudah mengimpersonasi; keluar dari impersonasi terlebih dahulu.");
  }

  const admin = await findAdminDesa(villageId);
  if (!admin) throw notFound("Desa ini belum memiliki akun administrator.");

  const pengguna = await getPenggunaDesa(admin.id);
  if (!pengguna || !pengguna.active || pengguna.villageId !== villageId) {
    throw conflict("Akun administrator desa ini tidak aktif.");
  }

  const kadaluarsa = kadaluarsaImpersonasi();
  await mulaiImpersonasi(state.sessionId, {
    villageId,
    userId: pengguna.id,
    expiresAt: kadaluarsa,
  });

  await recordAuditEvent({
    villageId,
    actorId: state.ownerId,
    event: AUDIT_EVENTS.impersonationStart,
    resource: "sessions",
    resourceId: state.sessionId,
    details: {
      targetUserId: pengguna.id,
      username: pengguna.username,
      kadaluarsa: kadaluarsa.toISOString(),
      sumber: "platform",
    },
  });

  return {
    villageId,
    targetUserId: pengguna.id,
    username: pengguna.username,
    kadaluarsa,
  };
}

/** Akhiri impersonasi pada sesi saat ini. Aman dipanggil berulang. */
export async function keluarDariImpersonasi(): Promise<{ berakhir: boolean }> {
  const state = await requireSuperAdminAsli();
  if (!state.impersonating) return { berakhir: false };

  await akhiriImpersonasi(state.sessionId);

  await recordAuditEvent({
    villageId: state.impersonatedVillageId,
    actorId: state.ownerId,
    event: AUDIT_EVENTS.impersonationEnd,
    resource: "sessions",
    resourceId: state.sessionId,
    details: { targetUserId: state.impersonatedUserId, sumber: "platform" },
  });

  return { berakhir: true };
}

export interface KonteksImpersonasiTampil {
  villageId: number;
  villageName: string;
  targetName: string;
  targetUsername: string | null;
  kadaluarsa: Date;
}

/** Konteks impersonasi aktif untuk banner layout; `null` bila tidak impersonasi. */
export async function getKonteksImpersonasi(): Promise<KonteksImpersonasiTampil | null> {
  const state = await getImpersonationState();
  if (!state?.impersonating || !state.impersonatedVillageId || !state.impersonatedUserId) {
    return null;
  }

  const info = await ambilInfoTargetImpersonasi(
    state.impersonatedUserId,
    state.impersonatedVillageId,
  );
  if (!info) return null;

  return {
    villageId: state.impersonatedVillageId,
    villageName: info.villageName,
    targetName: info.targetName,
    targetUsername: info.targetUsername,
    kadaluarsa: state.impersonatedExpiresAt as Date,
  };
}
