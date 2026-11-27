import "server-only";

import { and, desc, eq, like, or } from "drizzle-orm";

import { db } from "@/db";
import { arsip, type Arsip, type NewArsip } from "@/db/schema/arsip";

export async function listArsip(
  villageId: number,
  opts?: { kategori?: string; q?: string },
): Promise<Arsip[]> {
  const where = [eq(arsip.villageId, villageId)];
  if (opts?.kategori) where.push(eq(arsip.kategori, opts.kategori));
  if (opts?.q) {
    where.push(
      or(
        like(arsip.judul, `%${opts.q}%`),
        like(arsip.kategori ?? "", `%${opts.q}%`),
        like(arsip.keterangan ?? "", `%${opts.q}%`),
      )!,
    );
  }
  return db
    .select()
    .from(arsip)
    .where(and(...where))
    .orderBy(desc(arsip.id));
}

export async function updateArsip(
  id: number,
  villageId: number,
  data: Partial<NewArsip>,
): Promise<void> {
  await db
    .update(arsip)
    .set(data)
    .where(and(eq(arsip.id, id), eq(arsip.villageId, villageId)));
}

export async function deleteArsip(id: number, villageId: number): Promise<void> {
  await db.delete(arsip).where(and(eq(arsip.id, id), eq(arsip.villageId, villageId)));
}
