import "server-only";

/**
 * Query statistik kunjungan dan tema situs (admin).
 *
 * Seluruh fungsi wajib menerima `villageId` dari sesi sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, eq, gte, sum } from "drizzle-orm";

import { db } from "@/db";
import { pengunjungLog, theme } from "@/db/schema";

export async function totalKunjungan(villageId: number) {
  const [row] = await db
    .select({ total: sum(pengunjungLog.jumlah) })
    .from(pengunjungLog)
    .where(eq(pengunjungLog.villageId, villageId));
  return Number(row?.total ?? 0);
}

export async function totalKunjunganSejak(villageId: number, sejak: string) {
  const [row] = await db
    .select({ total: sum(pengunjungLog.jumlah) })
    .from(pengunjungLog)
    .where(and(eq(pengunjungLog.villageId, villageId), gte(pengunjungLog.tanggal, sejak)));
  return Number(row?.total ?? 0);
}

export async function barisKunjunganSejak(villageId: number, sejak: string) {
  return db
    .select({ tanggal: pengunjungLog.tanggal, jumlah: pengunjungLog.jumlah })
    .from(pengunjungLog)
    .where(and(eq(pengunjungLog.villageId, villageId), gte(pengunjungLog.tanggal, sejak)));
}

/** Tema aktif tenant; `undefined` bila belum ada tema yang diaktifkan. */
export async function ambilTemaAktif(villageId: number) {
  const [row] = await db
    .select({ slug: theme.slug, nama: theme.nama, versi: theme.versi, aktif: theme.aktif })
    .from(theme)
    .where(and(eq(theme.villageId, villageId), eq(theme.aktif, true)))
    .limit(1);
  return row;
}

export async function ambilTemaAktifDenganOpsi(villageId: number) {
  const [row] = await db
    .select({
      id: theme.id,
      slug: theme.slug,
      nama: theme.nama,
      versi: theme.versi,
      opsi: theme.opsi,
    })
    .from(theme)
    .where(and(eq(theme.villageId, villageId), eq(theme.aktif, true)))
    .limit(1);
  return row;
}

export async function ubahOpsiTema(villageId: number, id: number, opsi: string) {
  await db
    .update(theme)
    .set({ opsi })
    .where(and(eq(theme.villageId, villageId), eq(theme.id, id)));
}

/* ------------------------------------------------------- halaman statis */
