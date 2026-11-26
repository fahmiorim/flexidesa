import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  kehadiranJamKerja,
  type KehadiranJamKerja,
  type NewKehadiranJamKerja,
} from "@/db/schema/kehadiran";

import { JAM_KERJA_BAWAAN, jamPendek, type JamKerjaRow } from "../domain/jam-kerja";

function keBaris(row: KehadiranJamKerja): JamKerjaRow {
  return {
    id: row.id,
    namaHari: row.namaHari,
    jamMasuk: jamPendek(row.jamMasuk),
    jamKeluar: jamPendek(row.jamKeluar),
    status: row.status ?? true,
    keterangan: row.keterangan,
  };
}

/**
 * Pastikan tujuh baris hari tersedia.
 *
 * OpenSID hanya menyediakan aksi ubah, sehingga tabelnya diisi lebih dulu di
 * luar aplikasi. Appdes membuat jadwal bawaan saat pertama dibuka agar menu
 * langsung dapat dipakai tanpa langkah manual. `insert ignore` menjaga
 * permintaan paralel tidak menggandakan baris.
 */
async function pastikanJamKerja(villageId: number): Promise<void> {
  const [row] = await db
    .select({ id: kehadiranJamKerja.id })
    .from(kehadiranJamKerja)
    .where(eq(kehadiranJamKerja.villageId, villageId))
    .limit(1);

  if (row) return;

  await db
    .insert(kehadiranJamKerja)
    .ignore()
    .values(
      JAM_KERJA_BAWAAN.map((item) => ({
        villageId,
        namaHari: item.namaHari,
        jamMasuk: `${item.jamMasuk}:00`,
        jamKeluar: `${item.jamKeluar}:00`,
        status: item.status,
        keterangan: item.keterangan,
      })),
    );
}

export async function listJamKerja(villageId: number): Promise<JamKerjaRow[]> {
  await pastikanJamKerja(villageId);

  const rows = await db
    .select()
    .from(kehadiranJamKerja)
    .where(eq(kehadiranJamKerja.villageId, villageId))
    .orderBy(asc(kehadiranJamKerja.id));

  return rows.map(keBaris);
}

export async function findJamKerja(villageId: number, id: number): Promise<JamKerjaRow | null> {
  const [row] = await db
    .select()
    .from(kehadiranJamKerja)
    .where(and(eq(kehadiranJamKerja.villageId, villageId), eq(kehadiranJamKerja.id, id)))
    .limit(1);

  return row ? keBaris(row) : null;
}

export async function updateJamKerja(
  id: number,
  villageId: number,
  data: Pick<NewKehadiranJamKerja, "jamMasuk" | "jamKeluar" | "status" | "keterangan">,
): Promise<void> {
  await db
    .update(kehadiranJamKerja)
    .set(data)
    .where(and(eq(kehadiranJamKerja.id, id), eq(kehadiranJamKerja.villageId, villageId)));
}
