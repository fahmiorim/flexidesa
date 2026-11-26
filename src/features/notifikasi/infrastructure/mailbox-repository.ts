import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { mailboxPesan } from "@/db/schema/mailbox-pesan";

export type MailboxBaris = Pick<
  typeof mailboxPesan.$inferSelect,
  "id" | "arah" | "alamat" | "subjek" | "isi" | "dibaca" | "createdAt"
>;

export async function listMailboxPesan(villageId: number): Promise<MailboxBaris[]> {
  return db
    .select({
      id: mailboxPesan.id,
      arah: mailboxPesan.arah,
      alamat: mailboxPesan.alamat,
      subjek: mailboxPesan.subjek,
      isi: mailboxPesan.isi,
      dibaca: mailboxPesan.dibaca,
      createdAt: mailboxPesan.createdAt,
    })
    .from(mailboxPesan)
    .where(eq(mailboxPesan.villageId, villageId))
    .orderBy(desc(mailboxPesan.createdAt), desc(mailboxPesan.id))
    .limit(100);
}

export async function simpanMailboxPesan(data: typeof mailboxPesan.$inferInsert): Promise<number> {
  const [row] = await db.insert(mailboxPesan).values(data).$returningId();
  if (!row) throw new Error("Gagal menyimpan pesan email.");
  return row.id;
}

/**
 * Apakah error adalah pelanggaran unique key MySQL.
 *
 * Drizzle membungkus error driver dengan `DrizzleQueryError`, sedangkan kode
 * MySQL berada pada `cause`. Rantai `cause` diperiksa agar idempotensi webhook
 * tidak bergantung pada bentuk pembungkusan versi driver.
 */
function galatDuplikat(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth += 1) {
    const item = current as { code?: unknown; errno?: unknown; cause?: unknown };
    if (item.code === "ER_DUP_ENTRY" || item.errno === 1062) return true;
    current = item.cause;
  }
  return false;
}

export async function simpanMailboxPesanWebhook(
  data: typeof mailboxPesan.$inferInsert & { webhookEventId: string },
): Promise<{ id: number; created: boolean }> {
  try {
    const [row] = await db.insert(mailboxPesan).values(data).$returningId();
    if (!row) throw new Error("Gagal menyimpan pesan email.");
    return { id: row.id, created: true };
  } catch (error) {
    if (!galatDuplikat(error)) throw error;

    const [existing] = await db
      .select({ id: mailboxPesan.id })
      .from(mailboxPesan)
      .where(
        and(
          eq(mailboxPesan.villageId, data.villageId),
          eq(mailboxPesan.webhookEventId, data.webhookEventId),
        ),
      )
      .limit(1);
    if (!existing) throw error;
    return { id: existing.id, created: false };
  }
}

export async function getPesanMasukMailbox(
  villageId: number,
  id: number,
): Promise<MailboxBaris | null> {
  const [row] = await db
    .select({
      id: mailboxPesan.id,
      arah: mailboxPesan.arah,
      alamat: mailboxPesan.alamat,
      subjek: mailboxPesan.subjek,
      isi: mailboxPesan.isi,
      dibaca: mailboxPesan.dibaca,
      createdAt: mailboxPesan.createdAt,
    })
    .from(mailboxPesan)
    .where(
      and(
        eq(mailboxPesan.villageId, villageId),
        eq(mailboxPesan.id, id),
        eq(mailboxPesan.arah, "masuk"),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function tandaiMailboxDibaca(villageId: number, id: number): Promise<void> {
  await db
    .update(mailboxPesan)
    .set({ dibaca: true })
    .where(
      and(
        eq(mailboxPesan.villageId, villageId),
        eq(mailboxPesan.id, id),
        eq(mailboxPesan.arah, "masuk"),
      ),
    );
}
