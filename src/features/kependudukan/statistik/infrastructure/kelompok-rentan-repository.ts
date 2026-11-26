import "server-only";

import { and, count, eq, isNotNull, ne, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { regions, residents } from "@/db/schema";
import {
  disabilitasKosong,
  lengkapiBarisKelompokRentan,
  urutkanKelompokRentan,
  type BarisKelompokRentan,
  type DisabilitasRentan,
} from "@/features/kependudukan/statistik/domain/kelompok-rentan";

/** `SUM(CASE WHEN ...)` sebagai angka, aman untuk grup tanpa baris cocok. */
function hitungBila(kondisi: SQL): SQL<number> {
  return sql<number>`COALESCE(SUM(CASE WHEN ${kondisi} THEN 1 ELSE 0 END), 0)`;
}

/**
 * Laporan kelompok rentan per RT (paritas Lampiran A-9 OpenSID).
 *
 * Hanya penduduk berstatus hidup dan berwilayah yang dihitung; OpenSID juga
 * menghitung per RT sehingga penduduk tanpa wilayah tidak punya baris.
 */
export async function listKelompokRentan(
  villageId: number,
  dusun: string | null,
): Promise<BarisKelompokRentan[]> {
  const umur = sql<number>`TIMESTAMPDIFF(YEAR, ${residents.birthDate}, CURDATE())`;
  const wilayah = and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId));
  const batasDesa = [
    eq(residents.villageId, villageId),
    eq(residents.lifeStatus, "alive"),
    isNotNull(residents.regionId),
    dusun ? eq(regions.dusun, dusun) : undefined,
  ];

  const [demografi, disabilitas] = await Promise.all([
    db
      .select({
        regionId: regions.id,
        dusun: regions.dusun,
        rw: regions.rw,
        rt: regions.rt,
        lakiLaki: hitungBila(sql`${residents.gender} = 'male'`),
        perempuan: hitungBila(sql`${residents.gender} = 'female'`),
        bayi: hitungBila(sql`${umur} = 0`),
        balita: hitungBila(sql`${umur} BETWEEN 1 AND 5`),
        sd: hitungBila(sql`${umur} BETWEEN 6 AND 12`),
        smp: hitungBila(sql`${umur} BETWEEN 13 AND 15`),
        sma: hitungBila(sql`${umur} BETWEEN 16 AND 18`),
        lansia: hitungBila(sql`${umur} >= 61`),
        sakitLakiLaki: hitungBila(
          sql`${residents.chronicIllness} IS NOT NULL AND ${residents.chronicIllness} <> 'none' AND ${residents.gender} = 'male'`,
        ),
        sakitPerempuan: hitungBila(
          sql`${residents.chronicIllness} IS NOT NULL AND ${residents.chronicIllness} <> 'none' AND ${residents.gender} = 'female'`,
        ),
        hamil: hitungBila(sql`${residents.pregnancyStatus} = 'pregnant'`),
      })
      .from(residents)
      .leftJoin(regions, wilayah)
      .where(and(...batasDesa))
      .groupBy(regions.id, regions.dusun, regions.rw, regions.rt)
      .orderBy(regions.dusun, regions.rw, regions.rt),
    db
      .select({
        regionId: regions.id,
        cacat: residents.disability,
        total: count(),
      })
      .from(residents)
      .leftJoin(regions, wilayah)
      .where(and(...batasDesa, isNotNull(residents.disability), ne(residents.disability, "none")))
      .groupBy(regions.id, residents.disability),
  ]);

  const disabilitasPerWilayah = new Map<number, Record<DisabilitasRentan, number>>();
  for (const row of disabilitas) {
    if (row.regionId === null || row.cacat === null || row.cacat === "none") continue;
    const angka = disabilitasPerWilayah.get(row.regionId) ?? disabilitasKosong();
    angka[row.cacat] += Number(row.total);
    disabilitasPerWilayah.set(row.regionId, angka);
  }

  return demografi
    .flatMap((row) =>
      row.regionId === null
        ? []
        : [
            lengkapiBarisKelompokRentan({
              regionId: row.regionId,
              dusun: row.dusun ?? "",
              rw: row.rw ?? "",
              rt: row.rt ?? "",
              lakiLaki: Number(row.lakiLaki),
              perempuan: Number(row.perempuan),
              bayi: Number(row.bayi),
              balita: Number(row.balita),
              sd: Number(row.sd),
              smp: Number(row.smp),
              sma: Number(row.sma),
              lansia: Number(row.lansia),
              disabilitas: disabilitasPerWilayah.get(row.regionId) ?? disabilitasKosong(),
              sakitLakiLaki: Number(row.sakitLakiLaki),
              sakitPerempuan: Number(row.sakitPerempuan),
              hamil: Number(row.hamil),
            }),
          ],
    )
    .sort(urutkanKelompokRentan);
}
