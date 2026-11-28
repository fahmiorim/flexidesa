import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users, villages } from "@/db/schema";

/**
 * Penulisan konteks impersonasi pada baris sesi.
 *
 * Baca konteks ada di `getImpersonationState`/`getCurrentUser` (`src/lib/dal.ts`);
 * modul ini hanya menulis (mulai/akhir) agar repository tetap batas akses DB.
 */

interface KonteksImpersonasiBaru {
  villageId: number;
  userId: string;
  expiresAt: Date;
}

export async function mulaiImpersonasi(
  sessionId: string,
  konteks: KonteksImpersonasiBaru,
): Promise<void> {
  await db
    .update(sessions)
    .set({
      impersonatedVillageId: konteks.villageId,
      impersonatedUserId: konteks.userId,
      impersonatedExpiresAt: konteks.expiresAt,
    })
    .where(eq(sessions.id, sessionId));
}

interface InfoTargetImpersonasi {
  targetName: string;
  targetUsername: string | null;
  villageName: string;
}

/** Nama target dan desa untuk banner impersonasi; `null` bila target hilang. */
export async function ambilInfoTargetImpersonasi(
  userId: string,
  villageId: number,
): Promise<InfoTargetImpersonasi | null> {
  const [row] = await db
    .select({
      targetName: users.name,
      targetUsername: users.username,
      villageName: villages.name,
    })
    .from(users)
    .innerJoin(villages, eq(villages.id, users.villageId))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return null;
  return {
    targetName: row.targetName,
    targetUsername: row.targetUsername ?? null,
    villageName: row.villageName ?? `Desa #${villageId}`,
  };
}

export async function akhiriImpersonasi(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({
      impersonatedVillageId: null,
      impersonatedUserId: null,
      impersonatedExpiresAt: null,
    })
    .where(eq(sessions.id, sessionId));
}
