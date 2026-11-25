import "server-only";

import { and, eq, gte, inArray, isNull, lt, notExists, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { families, residents } from "@/db/schema";
import { residentMutations, type ResidentMutationType } from "@/db/schema/resident-mutation";
import type { JumlahBulanan } from "@/features/laporan-bulanan/domain/laporan-bulanan";
import { HEAD_OF_FAMILY_RELATION_ID } from "@/features/penduduk/domain/penduduk";

/**
 * Pengambilan data Laporan Kependudukan Bulanan.
 *
 * FlexiDesa tidak menyimpan snapshot harian penduduk, jadi keadaan pada suatu
 * tanggal direkonstruksi dari data penduduk + riwayat mutasi:
 *
 * - penduduk yang lahir pada/ sesudah tanggal belum dihitung;
 * - status pada tanggal diambil dari mutasi terakhir sebelum tanggal: penduduk
 *   dengan status terakhir mati/pindah/hilang/pergi tidak dihitung, sedangkan
 *   pengembalian status menjadi Hidup membuatnya dihitung lagi;
 * - penduduk dengan mutasi `birth`/`move_in` pada/sesudah tanggal belum dihitung.
 *
 * Penduduk lama tanpa riwayat mutasi (data impor) dihitung sejak awal, sesuai
 * tanggal lahirnya. Kewarganegaraan `null` dianggap WNI karena katalog
 * kewarganegaraan boleh kosong pada data yang belum lengkap; `citizenshipId`
 * selain 1 (WNA/dua kewarganegaraan) masuk kolom WNA seperti OpenSID.
 */

/** Potongan SQL jumlah penduduk per kewarganegaraan dan gender. */
const jumlahPenduduk = {
  wniL: sql<number>`COALESCE(SUM(CASE WHEN (${residents.citizenshipId} IS NULL OR ${residents.citizenshipId} = 1) AND ${residents.gender} = 'male' THEN 1 ELSE 0 END), 0)`,
  wniP: sql<number>`COALESCE(SUM(CASE WHEN (${residents.citizenshipId} IS NULL OR ${residents.citizenshipId} = 1) AND ${residents.gender} = 'female' THEN 1 ELSE 0 END), 0)`,
  wnaL: sql<number>`COALESCE(SUM(CASE WHEN ${residents.citizenshipId} IS NOT NULL AND ${residents.citizenshipId} <> 1 AND ${residents.gender} = 'male' THEN 1 ELSE 0 END), 0)`,
  wnaP: sql<number>`COALESCE(SUM(CASE WHEN ${residents.citizenshipId} IS NOT NULL AND ${residents.citizenshipId} <> 1 AND ${residents.gender} = 'female' THEN 1 ELSE 0 END), 0)`,
};

/** Kepala keluarga per gender. */
const jumlahKk = {
  kkL: sql<number>`COALESCE(SUM(CASE WHEN ${residents.gender} = 'male' THEN 1 ELSE 0 END), 0)`,
  kkP: sql<number>`COALESCE(SUM(CASE WHEN ${residents.gender} = 'female' THEN 1 ELSE 0 END), 0)`,
};

/**
 * Mutasi yang dicatat saat penduduk menjadi kepala keluarga. Dipakai untuk kolom
 * KK baris kematian/pindah/hilang, paritas `log_keluarga` OpenSID.
 */
const mutasiKepalaKeluarga = sql`COALESCE(
  JSON_UNQUOTE(JSON_EXTRACT(${residentMutations.meta}, '$.kepalaKeluarga')),
  'false'
) = 'true'`;

/** Kepala keluarga yang mengalami mutasi, per gender. */
const jumlahKkMutasi = {
  kkL: sql<number>`COALESCE(SUM(CASE WHEN ${mutasiKepalaKeluarga} AND ${residents.gender} = 'male' THEN 1 ELSE 0 END), 0)`,
  kkP: sql<number>`COALESCE(SUM(CASE WHEN ${mutasiKepalaKeluarga} AND ${residents.gender} = 'female' THEN 1 ELSE 0 END), 0)`,
};

/**
 * Status kependudukan setelah sebuah mutasi: `meta.toLifeStatus` bila ada,
 * selain itu disimpulkan dari jenis mutasinya.
 */
const statusSetelahMutasi = sql`COALESCE(
  JSON_UNQUOTE(JSON_EXTRACT(${residentMutations.meta}, '$.toLifeStatus')),
  CASE ${residentMutations.type}
    WHEN 'birth' THEN 'alive'
    WHEN 'move_in' THEN 'alive'
    WHEN 'death' THEN 'deceased'
    WHEN 'move_out' THEN 'moved'
    WHEN 'missing' THEN 'missing'
    ELSE 'alive'
  END
)`;

/**
 * Syarat penduduk sudah ada (lahir dan berstatus hidup) pada `tanggal`.
 *
 * Status ditentukan mutasi terakhir sebelum tanggal, sehingga penduduk yang
 * statusnya dikembalikan menjadi Hidup setelah sempat mati/pindah/hilang ikut
 * dihitung lagi. Penduduk tanpa riwayat mutasi (data impor) dihitung sejak
 * tanggal lahirnya.
 */
function syaratHadirPada(villageId: number, tanggal: string) {
  const mutasiTerakhirBukanHidup = db
    .select({ satu: sql`1` })
    .from(residentMutations)
    .where(
      and(
        eq(residentMutations.villageId, villageId),
        eq(residentMutations.residentId, residents.id),
        lt(residentMutations.eventDate, tanggal),
        sql`${statusSetelahMutasi} <> 'alive'`,
        sql`NOT EXISTS (
          SELECT 1 FROM resident_mutations berikut
          WHERE berikut.village_id = ${villageId}
            AND berikut.resident_id = ${residentMutations.residentId}
            AND berikut.event_date < ${tanggal}
            AND (berikut.event_date > ${residentMutations.eventDate}
              OR (berikut.event_date = ${residentMutations.eventDate}
                AND berikut.id > ${residentMutations.id}))
        )`,
      ),
    );

  const belumMasuk = db
    .select({ satu: sql`1` })
    .from(residentMutations)
    .where(
      and(
        eq(residentMutations.villageId, villageId),
        eq(residentMutations.residentId, residents.id),
        inArray(residentMutations.type, ["birth", "move_in"]),
        gte(residentMutations.eventDate, tanggal),
      ),
    );

  return [
    or(isNull(residents.birthDate), lt(residents.birthDate, tanggal)),
    notExists(mutasiTerakhirBukanHidup),
    notExists(belumMasuk),
  ];
}

/**
 * Keadaan penduduk dan kepala keluarga pada `tanggal` (awal hari, eksklusif).
 *
 * `tanggal` berformat `YYYY-MM-DD`. Untuk keadaan awal bulan kirim tanggal 1
 * bulan tersebut; untuk keadaan akhir bulan kirim tanggal 1 bulan berikutnya.
 */
export async function hitungKelompokPada(
  villageId: number,
  tanggal: string,
): Promise<JumlahBulanan> {
  const [penduduk] = await db
    .select(jumlahPenduduk)
    .from(residents)
    .where(and(eq(residents.villageId, villageId), ...syaratHadirPada(villageId, tanggal)));

  const [kk] = await db
    .select(jumlahKk)
    .from(families)
    .innerJoin(
      residents,
      and(eq(residents.familyId, families.id), eq(residents.villageId, families.villageId)),
    )
    .where(
      and(
        eq(families.villageId, villageId),
        eq(residents.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
        lt(families.createdAt, new Date(`${tanggal}T00:00:00`)),
        ...syaratHadirPada(villageId, tanggal),
      ),
    );

  return {
    wniL: Number(penduduk?.wniL ?? 0),
    wniP: Number(penduduk?.wniP ?? 0),
    wnaL: Number(penduduk?.wnaL ?? 0),
    wnaP: Number(penduduk?.wnaP ?? 0),
    kkL: Number(kk?.kkL ?? 0),
    kkP: Number(kk?.kkP ?? 0),
  };
}

/** Peristiwa penduduk sebulan, dipisah menurut jenis mutasi. */
export interface MutasiBulanan {
  kelahiran: JumlahBulanan;
  kematian: JumlahBulanan;
  pendatang: JumlahBulanan;
  pindah: JumlahBulanan;
  hilang: JumlahBulanan;
}

/** Jumlah kosong untuk baris peristiwa yang tidak punya data. */
function jumlahKosong(): JumlahBulanan {
  return { wniL: 0, wniP: 0, wnaL: 0, wnaP: 0, kkL: 0, kkP: 0 };
}

/**
 * Hitung peristiwa penduduk pada rentang `[mulai, selesai)`.
 *
 * Penduduk hilang dicatat sebagai mutasi `missing` oleh perubahan status dasar,
 * sehingga baris "Penduduk hilang" terisi. Kolom KK dihitung dari mutasi yang
 * ditandai `meta.kepalaKeluarga`, paritas `log_keluarga` OpenSID.
 */
export async function hitungMutasiBulan(
  villageId: number,
  mulai: string,
  selesai: string,
): Promise<MutasiBulanan> {
  const rows = await db
    .select({
      type: residentMutations.type,
      ...jumlahPenduduk,
      ...jumlahKkMutasi,
    })
    .from(residentMutations)
    .leftJoin(
      residents,
      and(eq(residentMutations.residentId, residents.id), eq(residents.villageId, villageId)),
    )
    .where(
      and(
        eq(residentMutations.villageId, villageId),
        gte(residentMutations.eventDate, mulai),
        lt(residentMutations.eventDate, selesai),
      ),
    )
    .groupBy(residentMutations.type);

  const perJenis = new Map(
    rows.map((row) => [
      row.type,
      {
        wniL: Number(row.wniL ?? 0),
        wniP: Number(row.wniP ?? 0),
        wnaL: Number(row.wnaL ?? 0),
        wnaP: Number(row.wnaP ?? 0),
        kkL: Number(row.kkL ?? 0),
        kkP: Number(row.kkP ?? 0),
      } satisfies JumlahBulanan,
    ]),
  );

  const ambil = (jenis: ResidentMutationType): JumlahBulanan =>
    perJenis.get(jenis) ?? jumlahKosong();

  return {
    kelahiran: ambil("birth"),
    kematian: ambil("death"),
    pendatang: ambil("move_in"),
    pindah: ambil("move_out"),
    hilang: ambil("missing"),
  };
}

/**
 * Keluarga yang terdaftar pada rentang `[mulai, selesai)`, dihitung sebagai
 * "Keluarga baru" pada baris kelahiran.
 *
 * FlexiDesa tidak mencatat peristiwa kepala keluarga pindah/mati/hilang, jadi
 * hanya keluarga baru yang bisa dipisahkan dari data.
 */
export async function hitungKeluargaBaru(
  villageId: number,
  mulai: string,
  selesai: string,
): Promise<{ kkL: number; kkP: number }> {
  const [baru] = await db
    .select(jumlahKk)
    .from(families)
    .innerJoin(
      residents,
      and(eq(residents.familyId, families.id), eq(residents.villageId, families.villageId)),
    )
    .where(
      and(
        eq(families.villageId, villageId),
        eq(residents.familyRelationId, HEAD_OF_FAMILY_RELATION_ID),
        gte(families.createdAt, new Date(`${mulai}T00:00:00`)),
        lt(families.createdAt, new Date(`${selesai}T00:00:00`)),
      ),
    );

  return { kkL: Number(baru?.kkL ?? 0), kkP: Number(baru?.kkP ?? 0) };
}
