import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { laporanPenduduk } from "@/db/schema";
import {
  bulanLabel,
  type LaporanPendudukRow,
} from "@/features/kependudukan/statistik/domain/laporan-penduduk";

function keRow(row: typeof laporanPenduduk.$inferSelect): LaporanPendudukRow {
  return {
    id: row.id,
    judul: row.judul,
    tahun: row.tahun,
    bulan: row.bulan,
    bulanLabel: bulanLabel(row.bulan),
    namaFile: row.namaFile,
    diunggahPada: row.updatedAt.toISOString(),
  };
}

/** Daftar arsip laporan penduduk desa, terbaru lebih dulu. */
export async function listLaporanPenduduk(
  villageId: number,
  tahun?: number,
): Promise<LaporanPendudukRow[]> {
  const rows = await db
    .select()
    .from(laporanPenduduk)
    .where(
      tahun === undefined
        ? eq(laporanPenduduk.villageId, villageId)
        : and(eq(laporanPenduduk.villageId, villageId), eq(laporanPenduduk.tahun, tahun)),
    )
    .orderBy(desc(laporanPenduduk.tahun), desc(laporanPenduduk.bulan), desc(laporanPenduduk.id));

  return rows.map(keRow);
}

/** Tahun yang sudah memiliki arsip, untuk isi dropdown "Pilih Tahun". */
export async function listTahunLaporanPenduduk(villageId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ tahun: laporanPenduduk.tahun })
    .from(laporanPenduduk)
    .where(eq(laporanPenduduk.villageId, villageId))
    .orderBy(desc(laporanPenduduk.tahun));

  return rows.map((row) => row.tahun);
}

/** Cari satu arsip milik desa (dibatasi `villageId`), termasuk jalur berkasnya. */
export async function findLaporanPenduduk(
  villageId: number,
  id: number,
): Promise<(LaporanPendudukRow & { jalurFile: string }) | null> {
  const [row] = await db
    .select()
    .from(laporanPenduduk)
    .where(and(eq(laporanPenduduk.villageId, villageId), eq(laporanPenduduk.id, id)))
    .limit(1);

  if (!row) return null;
  return { ...keRow(row), jalurFile: row.jalurFile };
}

export interface LaporanPendudukInsert {
  judul: string;
  tahun: number;
  bulan: number;
  namaFile: string;
  jalurFile: string;
  ukuranFile: number;
  createdBy: string;
}

export async function insertLaporanPenduduk(
  villageId: number,
  input: LaporanPendudukInsert,
): Promise<number> {
  const [inserted] = await db
    .insert(laporanPenduduk)
    .values({ ...input, villageId })
    .$returningId();

  if (!inserted) throw new Error("Gagal menyimpan laporan penduduk.");
  return inserted.id;
}

/** Ganti metadata dan/atau berkas arsip yang sudah ada. */
export async function updateLaporanPenduduk(
  villageId: number,
  id: number,
  input: {
    judul: string;
    tahun: number;
    bulan: number;
    namaFile?: string;
    jalurFile?: string;
    ukuranFile?: number;
  },
): Promise<void> {
  await db
    .update(laporanPenduduk)
    .set({ ...input })
    .where(and(eq(laporanPenduduk.villageId, villageId), eq(laporanPenduduk.id, id)));
}

/** Hapus beberapa arsip sekaligus (aksi "Hapus" massal OpenSID). */
export async function deleteLaporanPendudukBanyak(villageId: number, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .delete(laporanPenduduk)
    .where(and(eq(laporanPenduduk.villageId, villageId), inArray(laporanPenduduk.id, ids)));
}

/** Apakah sudah ada arsip untuk (tahun, bulan) selain `kecualiId`? */
export async function adaLaporanPendudukSama(
  villageId: number,
  tahun: number,
  bulan: number,
  kecualiId?: number,
): Promise<boolean> {
  const rows = await db
    .select({ id: laporanPenduduk.id })
    .from(laporanPenduduk)
    .where(
      and(
        eq(laporanPenduduk.villageId, villageId),
        eq(laporanPenduduk.tahun, tahun),
        eq(laporanPenduduk.bulan, bulan),
      ),
    );

  return rows.some((row) => row.id !== kecualiId);
}
