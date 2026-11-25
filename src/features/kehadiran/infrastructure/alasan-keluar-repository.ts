import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  kehadiranAlasanKeluar,
  type KehadiranAlasanKeluar,
  type NewKehadiranAlasanKeluar,
} from "@/db/schema/kehadiran";

import type { AlasanKeluarRow } from "../domain/alasan-keluar";

function keBaris(row: KehadiranAlasanKeluar): AlasanKeluarRow {
  return {
    id: row.id,
    alasan: row.alasan,
    keterangan: row.keterangan,
  };
}

export async function listAlasanKeluar(villageId: number): Promise<AlasanKeluarRow[]> {
  const rows = await db
    .select()
    .from(kehadiranAlasanKeluar)
    .where(eq(kehadiranAlasanKeluar.villageId, villageId))
    .orderBy(asc(kehadiranAlasanKeluar.alasan));

  return rows.map(keBaris);
}

export async function findAlasanKeluar(
  villageId: number,
  id: number,
): Promise<AlasanKeluarRow | null> {
  const [row] = await db
    .select()
    .from(kehadiranAlasanKeluar)
    .where(and(eq(kehadiranAlasanKeluar.villageId, villageId), eq(kehadiranAlasanKeluar.id, id)))
    .limit(1);

  return row ? keBaris(row) : null;
}

export async function createAlasanKeluar(data: NewKehadiranAlasanKeluar): Promise<number> {
  const result = await db.insert(kehadiranAlasanKeluar).values(data);
  const insertId = result[0].insertId;
  return typeof insertId === "bigint" ? Number(insertId) : insertId;
}

export async function updateAlasanKeluar(
  id: number,
  villageId: number,
  data: Pick<NewKehadiranAlasanKeluar, "alasan" | "keterangan" | "updatedBy">,
): Promise<void> {
  await db
    .update(kehadiranAlasanKeluar)
    .set(data)
    .where(and(eq(kehadiranAlasanKeluar.id, id), eq(kehadiranAlasanKeluar.villageId, villageId)));
}

export async function deleteAlasanKeluar(id: number, villageId: number): Promise<void> {
  await db
    .delete(kehadiranAlasanKeluar)
    .where(and(eq(kehadiranAlasanKeluar.id, id), eq(kehadiranAlasanKeluar.villageId, villageId)));
}

/** Hapus beberapa alasan keluar sekaligus (aksi massal OpenSID). */
export async function deleteAlasanKeluarBanyak(
  villageId: number,
  ids: readonly number[],
): Promise<void> {
  if (ids.length === 0) return;
  await db
    .delete(kehadiranAlasanKeluar)
    .where(
      and(
        eq(kehadiranAlasanKeluar.villageId, villageId),
        inArray(kehadiranAlasanKeluar.id, [...ids]),
      ),
    );
}
