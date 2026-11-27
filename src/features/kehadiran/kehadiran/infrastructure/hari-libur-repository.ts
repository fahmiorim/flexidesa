import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  kehadiranHariLibur,
  type KehadiranHariLibur,
  type NewKehadiranHariLibur,
} from "@/db/schema/kehadiran";

import type { HariLiburRow } from "../domain/hari-libur";

function keBaris(row: KehadiranHariLibur): HariLiburRow {
  return {
    id: row.id,
    tanggal: row.tanggal,
    keterangan: row.keterangan,
  };
}

export async function listHariLibur(villageId: number): Promise<HariLiburRow[]> {
  const rows = await db
    .select()
    .from(kehadiranHariLibur)
    .where(eq(kehadiranHariLibur.villageId, villageId))
    .orderBy(asc(kehadiranHariLibur.tanggal));

  return rows.map(keBaris);
}

export async function findHariLibur(villageId: number, id: number): Promise<HariLiburRow | null> {
  const [row] = await db
    .select()
    .from(kehadiranHariLibur)
    .where(and(eq(kehadiranHariLibur.villageId, villageId), eq(kehadiranHariLibur.id, id)))
    .limit(1);

  return row ? keBaris(row) : null;
}

export async function findHariLiburByTanggal(
  villageId: number,
  tanggal: string,
): Promise<HariLiburRow | null> {
  const [row] = await db
    .select()
    .from(kehadiranHariLibur)
    .where(
      and(eq(kehadiranHariLibur.villageId, villageId), eq(kehadiranHariLibur.tanggal, tanggal)),
    )
    .limit(1);

  return row ? keBaris(row) : null;
}

export async function createHariLibur(data: NewKehadiranHariLibur): Promise<number> {
  const result = await db.insert(kehadiranHariLibur).values(data);
  const insertId = result[0].insertId;
  return typeof insertId === "bigint" ? Number(insertId) : insertId;
}

export async function updateHariLibur(
  id: number,
  villageId: number,
  data: Pick<NewKehadiranHariLibur, "tanggal" | "keterangan">,
): Promise<void> {
  await db
    .update(kehadiranHariLibur)
    .set(data)
    .where(and(eq(kehadiranHariLibur.id, id), eq(kehadiranHariLibur.villageId, villageId)));
}

export async function deleteHariLibur(id: number, villageId: number): Promise<void> {
  await db
    .delete(kehadiranHariLibur)
    .where(and(eq(kehadiranHariLibur.id, id), eq(kehadiranHariLibur.villageId, villageId)));
}

/** Hapus beberapa hari libur sekaligus (aksi massal OpenSID). */
export async function deleteHariLiburBanyak(
  villageId: number,
  ids: readonly number[],
): Promise<void> {
  if (ids.length === 0) return;
  await db
    .delete(kehadiranHariLibur)
    .where(
      and(eq(kehadiranHariLibur.villageId, villageId), inArray(kehadiranHariLibur.id, [...ids])),
    );
}

/**
 * Impor tanggal libur dari sumber kalender (mirip `HariLiburController@import`).
 *
 * Tanggal yang sudah ada diperbarui keterangannya, tanggal baru ditambahkan.
 * Semua operasi dibatasi pada desa aktif agar tidak menyentuh tenant lain.
 */
