import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { kehadiranPengaduan } from "@/db/schema/kehadiran";
import { kepegawaianPegawai } from "@/db/schema/kepegawaian";
import { residents } from "@/db/schema/resident";
import type { PengaduanKehadiranRow } from "@/features/kehadiran/kehadiran/domain/pengaduan-kehadiran";

/**
 * Daftar pengaduan kehadiran milik desa.
 *
 * Hanya desa sendiri yang terlihat; pelapor dan terlapor diambil lewat
 * join agar tabel tidak menampilkan id mentah.
 */
export async function listPengaduanKehadiran(villageId: number): Promise<PengaduanKehadiranRow[]> {
  const rows = await db
    .select({
      id: kehadiranPengaduan.id,
      waktu: kehadiranPengaduan.waktu,
      keterangan: kehadiranPengaduan.keterangan,
      status: kehadiranPengaduan.status,
      pelapor: residents.name,
      terlapor: kepegawaianPegawai.nama,
    })
    .from(kehadiranPengaduan)
    .leftJoin(
      residents,
      and(
        eq(residents.villageId, kehadiranPengaduan.villageId),
        eq(residents.id, kehadiranPengaduan.pelaporId),
      ),
    )
    .leftJoin(
      kepegawaianPegawai,
      and(
        eq(kepegawaianPegawai.villageId, kehadiranPengaduan.villageId),
        eq(kepegawaianPegawai.id, kehadiranPengaduan.pegawaiId),
      ),
    )
    .where(eq(kehadiranPengaduan.villageId, villageId))
    .orderBy(desc(kehadiranPengaduan.waktu));

  return rows.map((row) => ({
    id: row.id,
    waktu: row.waktu.toISOString(),
    pelapor: row.pelapor ?? null,
    terlapor: row.terlapor ?? null,
    keterangan: row.keterangan ?? null,
    selesai: row.status,
  }));
}

/** Cari satu pengaduan milik desa (dibatasi `villageId`). */
export async function findPengaduanKehadiran(villageId: number, id: number) {
  const [row] = await db
    .select({ id: kehadiranPengaduan.id, keterangan: kehadiranPengaduan.keterangan })
    .from(kehadiranPengaduan)
    .where(and(eq(kehadiranPengaduan.villageId, villageId), eq(kehadiranPengaduan.id, id)))
    .limit(1);

  return row ?? null;
}

/** Simpan keterangan hasil suntingan operator. */
export async function updateKeteranganPengaduan(
  villageId: number,
  id: number,
  keterangan: string | null,
): Promise<void> {
  await db
    .update(kehadiranPengaduan)
    .set({ keterangan })
    .where(and(eq(kehadiranPengaduan.villageId, villageId), eq(kehadiranPengaduan.id, id)));
}
