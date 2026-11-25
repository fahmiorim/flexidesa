import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { pengaturanDesa } from "@/db/schema";

/** Nilai JSON satu kunci pengaturan desa; `null` bila tidak ada/rusak. */
export async function bacaNilaiPengaturan(villageId: number, kunci: string): Promise<unknown> {
  const [row] = await db
    .select({ nilai: pengaturanDesa.nilai })
    .from(pengaturanDesa)
    .where(and(eq(pengaturanDesa.villageId, villageId), eq(pengaturanDesa.kunci, kunci)))
    .limit(1);
  if (!row?.nilai) return null;
  try {
    return JSON.parse(row.nilai) as unknown;
  } catch {
    return null;
  }
}

export async function simpanNilaiPengaturan(
  villageId: number,
  kunci: string,
  nilai: unknown,
): Promise<void> {
  const nilaiJson = JSON.stringify(nilai);
  await db
    .insert(pengaturanDesa)
    .values({ villageId, kunci, nilai: nilaiJson })
    .onDuplicateKeyUpdate({ set: { nilai: nilaiJson } });
}

export async function hapusNilaiPengaturan(villageId: number, kunci: string): Promise<void> {
  await db
    .delete(pengaturanDesa)
    .where(and(eq(pengaturanDesa.villageId, villageId), eq(pengaturanDesa.kunci, kunci)));
}
