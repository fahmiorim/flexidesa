import "server-only";

/**
 * Query wilayah administratif dan profil wilayah.
 *
 * Semua fungsi dibatasi `villageId` pemilik sehingga tidak ada data yang
 * bocor antar-desa.
 */

import { and, asc, count, eq, getTableColumns, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  families,
  jabatanPerangkat,
  perangkatDesa,
  profilDesa,
  regions,
  residents,
} from "@/db/schema";
import {
  hitungJumlahWilayah,
  normalisasiTipePeta,
  tingkatWilayah,
  type JumlahWilayah,
  type WilayahDenganJumlah,
} from "@/features/info-desa/wilayah/domain/wilayah";

export async function listRegions(villageId: number) {
  return db
    .select({ ...getTableColumns(regions), kepalaNik: residents.nationalId })
    .from(regions)
    .leftJoin(
      residents,
      and(eq(residents.id, regions.kepalaResidentId), eq(residents.villageId, regions.villageId)),
    )
    .where(eq(regions.villageId, villageId))
    .orderBy(asc(regions.sortOrder), asc(regions.dusun), asc(regions.rw), asc(regions.rt));
}

export interface RingkasanDusun extends JumlahWilayah {
  dusun: string;
  jumlahRw: number;
  jumlahRt: number;
  kepala: string;
  kepalaNik: string;
  kepalaResidentId: number | null;
}

export interface WilayahAdministratifData {
  rows: WilayahDenganJumlah[];
  perDusun: RingkasanDusun[];
  ringkasan: JumlahWilayah;
  /**
   * Penduduk/KK yang belum terpetakan ke wilayah mana pun.
   * Bukan dusun — ditampilkan terpisah agar data tanpa wilayah terlihat di
   * admin tanpa menggelembungkan jumlah dusun.
   */
  tanpaWilayah: JumlahWilayah;
}

export type ProfilWilayahValues = {
  luasWilayah: string | null;
  batasUtara: string | null;
  batasSelatan: string | null;
  batasTimur: string | null;
  batasBarat: string | null;
  ketinggian: string | null;
  suhuRataRata: string | null;
  curahHujan: string | null;
  topografi: string | null;
};

/**
 * Data wilayah administratif beserta jumlah KK/penduduk.
 *
 * Jumlah penduduk dihitung dari penduduk hidup pada tenant ini. Baris
 * dusun/RW menjumlahkan subtree-nya agar tidak ada angka ganda antara baris
 * induk dan RT. Penduduk/KK tanpa `region_id` dikelompokkan sebagai
 * "Belum diisi" (bukan baris `regions`) supaya tetap terlihat di admin dan
 * ikut terhitung pada ringkasan total.
 */
export async function listWilayahAdministratif(
  villageId: number,
): Promise<WilayahAdministratifData> {
  const [regionRows, residentRows, familyRows, residentTanpaWilayah, familyTanpaWilayah] =
    await Promise.all([
      listRegions(villageId),
      db
        .select({
          dusun: regions.dusun,
          regionId: residents.regionId,
          gender: residents.gender,
          total: count(),
        })
        .from(residents)
        .innerJoin(
          regions,
          and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)),
        )
        .where(and(eq(residents.villageId, villageId), eq(residents.lifeStatus, "alive")))
        .groupBy(regions.dusun, residents.regionId, residents.gender),
      db
        .select({
          dusun: regions.dusun,
          regionId: families.regionId,
          total: count(),
        })
        .from(families)
        .innerJoin(
          regions,
          and(eq(families.regionId, regions.id), eq(regions.villageId, villageId)),
        )
        .where(eq(families.villageId, villageId))
        .groupBy(regions.dusun, families.regionId),
      db
        .select({ gender: residents.gender, total: count() })
        .from(residents)
        .where(
          and(
            eq(residents.villageId, villageId),
            eq(residents.lifeStatus, "alive"),
            isNull(residents.regionId),
          ),
        )
        .groupBy(residents.gender),
      db
        .select({ total: count() })
        .from(families)
        .where(and(eq(families.villageId, villageId), isNull(families.regionId))),
    ]);

  const kosong = (): JumlahWilayah => ({ jumlahKk: 0, lakiLaki: 0, perempuan: 0, total: 0 });
  const exact = new Map<number, JumlahWilayah>();
  const perDusunCount = new Map<string, JumlahWilayah>();

  for (const row of residentRows) {
    if (row.regionId === null) continue;
    const dusun = row.dusun ?? "";
    const exactRow = exact.get(row.regionId) ?? kosong();
    const dusunRow = perDusunCount.get(dusun) ?? kosong();
    if (row.gender === "male") {
      exactRow.lakiLaki += row.total;
      dusunRow.lakiLaki += row.total;
    } else if (row.gender === "female") {
      exactRow.perempuan += row.total;
      dusunRow.perempuan += row.total;
    }
    exactRow.total += row.total;
    dusunRow.total += row.total;
    exact.set(row.regionId, exactRow);
    perDusunCount.set(dusun, dusunRow);
  }
  for (const row of familyRows) {
    if (row.regionId === null) continue;
    const exactRow = exact.get(row.regionId) ?? kosong();
    const dusunRow = perDusunCount.get(row.dusun ?? "") ?? kosong();
    exactRow.jumlahKk += row.total;
    dusunRow.jumlahKk += row.total;
    exact.set(row.regionId, exactRow);
    perDusunCount.set(row.dusun ?? "", dusunRow);
  }

  const normalized = regionRows.map((row) => ({
    id: row.id,
    dusun: row.dusun ?? "",
    rw: row.rw ?? "",
    rt: row.rt ?? "",
    kepala: row.kepala ?? "",
    kepalaNik: row.kepalaNik ?? "",
    kepalaResidentId: row.kepalaResidentId ?? null,
    koordinat: row.koordinat ?? "",
    path: row.path ?? "",
    zoom: row.zoom ?? null,
    mapTipe: row.mapTipe ? normalisasiTipePeta(row.mapTipe) : null,
    warna: row.warna ?? null,
    border: row.border ?? null,
    luasHa: row.luasHa !== null && row.luasHa !== undefined ? Number(row.luasHa) : null,
    urut: row.sortOrder,
  }));
  const jumlah = hitungJumlahWilayah(normalized, exact);
  const rows = normalized.map((row) => ({
    ...row,
    ...(jumlah.get(row.id) ?? kosong()),
    tingkat: tingkatWilayah(row),
  }));

  const tanpaWilayah = kosong();
  for (const row of residentTanpaWilayah) {
    if (row.gender === "male") tanpaWilayah.lakiLaki += row.total;
    else if (row.gender === "female") tanpaWilayah.perempuan += row.total;
    tanpaWilayah.total += row.total;
  }
  tanpaWilayah.jumlahKk = familyTanpaWilayah[0]?.total ?? 0;

  const perDusun = [...new Set(normalized.map((row) => row.dusun))].map((dusun) => {
    const items = normalized.filter((row) => row.dusun === dusun);
    const induk = items.find((row) => !row.rw && !row.rt);
    return {
      dusun,
      ...(perDusunCount.get(dusun) ?? kosong()),
      jumlahRw: new Set(items.map((row) => row.rw).filter(Boolean)).size,
      jumlahRt: new Set(items.filter((row) => row.rt).map((row) => `${row.rw ?? ""}::${row.rt}`))
        .size,
      kepala: induk?.kepala ?? "",
      kepalaNik: induk?.kepalaNik ?? "",
      kepalaResidentId: induk?.kepalaResidentId ?? null,
    };
  });

  const ringkasan = [...exact.values()].reduce<JumlahWilayah>(
    (total, item) => ({
      jumlahKk: total.jumlahKk + item.jumlahKk,
      lakiLaki: total.lakiLaki + item.lakiLaki,
      perempuan: total.perempuan + item.perempuan,
      total: total.total + item.total,
    }),
    { ...tanpaWilayah },
  );

  return { rows, perDusun, ringkasan, tanpaWilayah };
}

export async function listPerangkatWilayah(villageId: number) {
  return db
    .select({
      id: perangkatDesa.id,
      nama: perangkatDesa.nama,
      jabatan: jabatanPerangkat.nama,
      atasanId: perangkatDesa.atasanId,
      status: perangkatDesa.status,
      urut: perangkatDesa.urut,
    })
    .from(perangkatDesa)
    .leftJoin(
      jabatanPerangkat,
      and(
        eq(perangkatDesa.jabatanId, jabatanPerangkat.id),
        eq(jabatanPerangkat.villageId, villageId),
      ),
    )
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.status, "aktif")))
    .orderBy(asc(perangkatDesa.urut));
}

export async function getProfilDesa(villageId: number) {
  const [row] = await db
    .select()
    .from(profilDesa)
    .where(eq(profilDesa.villageId, villageId))
    .limit(1);
  return row ?? null;
}

export async function upsertProfilWilayah(villageId: number, values: ProfilWilayahValues) {
  const [existing] = await db
    .select({ id: profilDesa.id })
    .from(profilDesa)
    .where(eq(profilDesa.villageId, villageId))
    .limit(1);
  if (existing) {
    await db
      .update(profilDesa)
      .set(values)
      .where(and(eq(profilDesa.villageId, villageId), eq(profilDesa.id, existing.id)));
    return;
  }
  await db.insert(profilDesa).values({ ...values, villageId });
}
