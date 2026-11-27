import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { bukuTamu, type BukuTamu } from "@/db/schema/buku-tamu";

export async function listBukuTamu(
  villageId: number,
  opts?: { tanggalMulai?: string; tanggalAkhir?: string },
): Promise<BukuTamu[]> {
  const conditions = [eq(bukuTamu.villageId, villageId)];
  if (opts?.tanggalMulai) conditions.push(sql`${bukuTamu.tanggal} >= ${opts.tanggalMulai}`);
  if (opts?.tanggalAkhir) conditions.push(sql`${bukuTamu.tanggal} <= ${opts.tanggalAkhir}`);
  return db
    .select()
    .from(bukuTamu)
    .where(and(...conditions))
    .orderBy(desc(bukuTamu.tanggal), desc(bukuTamu.id));
}
