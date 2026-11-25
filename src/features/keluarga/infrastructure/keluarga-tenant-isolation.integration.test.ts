import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { inArray } from "drizzle-orm";
import mysql, { type ResultSetHeader } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import {
  families,
  familyMemberLogs,
  familyRelations,
  regions,
  residents,
  rumahTangga,
  villages,
} from "@/db/schema";
import {
  HEAD_OF_FAMILY_RELATION_ID,
  type KeluargaFormInput,
} from "@/features/keluarga/domain/keluarga";
import {
  deleteKeluarga,
  deleteKeluargaBanyak,
  findKeluargaById,
  findKeluargaDetail,
  getKeluargaRingkasan,
  listKeluarga,
  listKeluargaAnggotaRows,
  listKeluargaMemberDetails,
  listKeluargaMembers,
  nextTemporaryKeluargaNumber,
  pecahKeluarga,
  pindahWilayahKeluarga,
  updateKeluarga,
  validateKeluargaRegion,
} from "@/features/keluarga/infrastructure/keluarga-repository";
import {
  listRumahTanggaMembers,
  tambahRtmKolektif,
} from "@/features/rumah-tangga/infrastructure/rumah-tangga-repository";
import { validasiDatabaseUji } from "@/testing/db-test-guard";
import { siapkanDatabaseUji } from "@/testing/migrasi-uji";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../../db/migrations", import.meta.url));
const RUN = randomUUID().slice(0, 8);

interface Fixture {
  villageA: number;
  villageB: number;
  regionA: number;
  regionB: number;
  familyA: number;
  familyB: number;
  foreignResidentName: string;
}

let fixture: Fixture | null = null;

function pastiId(row: { id: number | undefined } | undefined, label: string): number {
  if (row?.id === undefined) throw new Error(`Seed uji gagal: ${label}`);
  return row.id;
}

async function sisipkanLegacy(sql: string, values: unknown[]): Promise<number> {
  const connection = await mysql.createConnection(validasiDatabaseUji(process.env).opsiKoneksi);
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    const [result] = await connection.query<ResultSetHeader>(sql, values);
    return result.insertId;
  } finally {
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    await connection.end();
  }
}

async function seedFixture(): Promise<Fixture> {
  const [villageARow] = await db
    .insert(villages)
    .values({ name: `Desa Keluarga A ${RUN}`, code: `KLA${RUN}`.slice(0, 10) })
    .$returningId();
  const [villageBRow] = await db
    .insert(villages)
    .values({ name: `Desa Keluarga B ${RUN}`, code: `KLB${RUN}`.slice(0, 10) })
    .$returningId();
  const villageA = pastiId(villageARow, "village A");
  const villageB = pastiId(villageBRow, "village B");

  const [regionARow] = await db
    .insert(regions)
    .values({ villageId: villageA, dusun: `Dusun A ${RUN}` })
    .$returningId();
  const [regionBRow] = await db
    .insert(regions)
    .values({ villageId: villageB, dusun: `Dusun Rahasia B ${RUN}` })
    .$returningId();
  const regionA = pastiId(regionARow, "region A");
  const regionB = pastiId(regionBRow, "region B");

  const [familyARow] = await db
    .insert(families)
    .values({ villageId: villageA, number: `KKA-${RUN}`, regionId: regionA })
    .$returningId();
  const [familyBRow] = await db
    .insert(families)
    .values({ villageId: villageB, number: `KKB-${RUN}`, regionId: regionB })
    .$returningId();
  const familyA = pastiId(familyARow, "family A");
  const familyB = pastiId(familyBRow, "family B");

  await sisipkanLegacy(
    "INSERT INTO residents (village_id, family_id, family_relation_id, name, gender, birth_date) VALUES (?, ?, ?, ?, 'male', '1980-01-01')",
    [villageA, familyA, HEAD_OF_FAMILY_RELATION_ID, `Kepala Keluarga A ${RUN}`],
  );

  const foreignResidentName = `Identitas Rahasia Desa B ${RUN}`;
  await sisipkanLegacy(
    "INSERT INTO residents (village_id, family_id, family_relation_id, name, gender, birth_date) VALUES (?, ?, ?, ?, 'female', '1990-01-01')",
    [villageB, familyA, HEAD_OF_FAMILY_RELATION_ID, foreignResidentName],
  );
  await sisipkanLegacy("UPDATE families SET region_id = ? WHERE id = ?", [regionB, familyA]);

  return { villageA, villageB, regionA, regionB, familyA, familyB, foreignResidentName };
}

beforeAll(async () => {
  await siapkanDatabaseUji(db, { migrationsFolder: MIGRATIONS_FOLDER });
  await db
    .insert(familyRelations)
    .values({ id: HEAD_OF_FAMILY_RELATION_ID, name: "KEPALA KELUARGA" })
    .onDuplicateKeyUpdate({ set: { name: "KEPALA KELUARGA" } });
  fixture = await seedFixture();
});

afterAll(async () => {
  if (!fixture) return;
  const villageIds = [fixture.villageA, fixture.villageB];
  await db.delete(familyMemberLogs).where(inArray(familyMemberLogs.villageId, villageIds));
  await db.delete(residents).where(inArray(residents.villageId, villageIds));
  await db.delete(rumahTangga).where(inArray(rumahTangga.villageId, villageIds));
  await db.delete(families).where(inArray(families.villageId, villageIds));
  await db.delete(regions).where(inArray(regions.villageId, villageIds));
  await db.delete(villages).where(inArray(villages.id, villageIds));
});

describe("isolasi tenant repository keluarga", () => {
  it("tidak menampilkan kepala keluarga, anggota, jumlah, atau wilayah dari desa lain", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    const daftar = await listKeluarga({
      villageId: current.villageA,
      search: "",
      status: "all",
      gender: "all",
      regionId: null,
      temporaryOnly: false,
      programId: null,
      numbers: [],
      page: 1,
      pageSize: 20,
    });
    expect(daftar.rows).toHaveLength(1);
    expect(daftar.rows[0]?.headName).toContain("Kepala Keluarga A");
    expect(daftar.rows[0]?.headName).not.toContain("Rahasia Desa B");
    expect(daftar.rows[0]?.memberCount).toBe(1);
    expect(daftar.rows[0]?.regionLabel).toBe("Wilayah tanpa nama");

    const anggota = await listKeluargaMembers(current.villageA, current.familyA);
    expect(anggota).toHaveLength(1);
    expect(anggota.some((row) => row.name === current.foreignResidentName)).toBe(false);

    const detailAnggota = await listKeluargaMemberDetails(current.villageA, current.familyA);
    expect(detailAnggota).toHaveLength(1);
    expect(detailAnggota.some((row) => row.name === current.foreignResidentName)).toBe(false);

    const barisAnggota = await listKeluargaAnggotaRows(current.villageA, current.familyA);
    expect(barisAnggota).toHaveLength(1);
    expect(barisAnggota.some((row) => row.name === current.foreignResidentName)).toBe(false);

    const detail = await findKeluargaDetail(current.villageA, current.familyA);
    expect(detail?.regionLabel).toBe("Wilayah tanpa nama");
  });

  it("membatasi update dan delete KK berdasarkan desa pada repository", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    const before = await findKeluargaById(current.villageA, current.familyA);
    expect(before).not.toBeNull();
    const input: KeluargaFormInput = {
      number: `JANGAN-${RUN}`,
      temporary: false,
      address: "",
      regionId: null,
      welfareClass: null,
      cardPrintedAt: null,
    };

    await updateKeluarga(current.villageB, current.familyA, input);
    await deleteKeluarga(current.villageB, current.familyA);

    const after = await findKeluargaById(current.villageA, current.familyA);
    expect(after?.number).toBe(before?.number);
  });

  it("menolak wilayah milik desa lain dan menerima wilayah sendiri", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    await expect(validateKeluargaRegion(current.villageA, current.regionB)).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(
      validateKeluargaRegion(current.villageA, current.regionA),
    ).resolves.toBeUndefined();
    await expect(validateKeluargaRegion(current.villageA, null)).resolves.toBeUndefined();
  });

  it("menghitung ringkasan KK secara tenant dan status kepala keluarga", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    const ringkasan = await getKeluargaRingkasan(current.villageA);
    expect(ringkasan.total).toBe(1);
    expect(ringkasan.active).toBe(1);
    expect(ringkasan.temporary).toBe(0);
    expect(ringkasan.members).toBe(1);
  });

  it("membuat RTM kolektif, menautkan anggota, dan melewati kepala yang sudah punya RTM", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    const [familyC] = await db
      .insert(families)
      .values({
        villageId: current.villageA,
        number: `KKC-${RUN}`,
        regionId: current.regionA,
        address: "Alamat RTM Uji",
      })
      .$returningId();
    if (!familyC) throw new Error("Seed family C gagal.");
    const [kepala] = await db
      .insert(residents)
      .values({
        villageId: current.villageA,
        familyId: familyC.id,
        familyRelationId: HEAD_OF_FAMILY_RELATION_ID,
        name: `Kepala RTM ${RUN}`,
        gender: "male",
        lifeStatus: "alive",
      })
      .$returningId();
    const [anggota] = await db
      .insert(residents)
      .values({
        villageId: current.villageA,
        familyId: familyC.id,
        name: `Anggota RTM ${RUN}`,
        gender: "female",
        lifeStatus: "alive",
      })
      .$returningId();
    if (!kepala || !anggota) throw new Error("Seed anggota RTM gagal.");

    const hasil = await tambahRtmKolektif(current.villageA, [familyC.id], "3201");
    expect(hasil.dibuat).toBe(1);
    expect(hasil.dilewati).toHaveLength(0);

    const [rtm] = await db
      .select()
      .from(rumahTangga)
      .where(inArray(rumahTangga.villageId, [current.villageA]));
    expect(rtm?.number).toMatch(/^3201\d{5}$/);
    expect(rtm?.address).toBe("Alamat RTM Uji");

    const anggotaRtm = await listRumahTanggaMembers(current.villageA, rtm!.id);
    expect(anggotaRtm).toHaveLength(2);
    expect(anggotaRtm.find((row) => row.id === kepala.id)?.level).toBe(1);
    expect(anggotaRtm.find((row) => row.id === anggota.id)?.level).toBe(2);

    const ulang = await tambahRtmKolektif(current.villageA, [familyC.id], "3201");
    expect(ulang.dibuat).toBe(0);
    expect(ulang.dilewati).toEqual([`KKC-${RUN}`]);
  });

  it("menghapus KK kosong secara massal dan melewati KK beranggota", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    const [familyD] = await db
      .insert(families)
      .values({ villageId: current.villageA, number: `KKD-${RUN}`, regionId: current.regionA })
      .$returningId();
    if (!familyD) throw new Error("Seed family D gagal.");

    const hasil = await deleteKeluargaBanyak(current.villageA, [familyD.id, current.familyA]);
    expect(hasil.dihapus).toBe(1);
    expect(hasil.dilewati).toEqual([`KKA-${RUN}`]);
    expect(await findKeluargaById(current.villageA, familyD.id)).toBeNull();
    expect(await findKeluargaById(current.villageA, current.familyA)).not.toBeNull();
  });

  it("membuat nomor KK sementara 16 angka dan memindahkan wilayah keluarga", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    const nomor = await nextTemporaryKeluargaNumber(current.villageA);
    expect(nomor).toMatch(/^\d{16}$/);
    expect(nomor.startsWith("0")).toBe(true);

    const jumlah = await pindahWilayahKeluarga(
      current.villageA,
      [current.familyA],
      current.regionA,
    );
    expect(jumlah).toBe(1);
    const keluarga = await findKeluargaById(current.villageA, current.familyA);
    expect(keluarga?.regionId).toBe(current.regionA);
  });

  it("memecah KK dan memindahkan anggota hidup ke kepala keluarga baru", async () => {
    if (!fixture) throw new Error("Fixture integrasi tidak siap.");
    const current = fixture;

    await db
      .update(residents)
      .set({ lifeStatus: "deceased" })
      .where(inArray(residents.familyId, [current.familyA]));
    const [anak] = await db
      .insert(residents)
      .values({
        villageId: current.villageA,
        familyId: current.familyA,
        name: `Anak Pecah ${RUN}`,
        gender: "female",
        lifeStatus: "alive",
      })
      .$returningId();
    if (!anak) throw new Error("Seed anggota pecah gagal.");

    const nomor = await nextTemporaryKeluargaNumber(current.villageA);
    const baru = await pecahKeluarga(current.villageA, current.familyA, nomor, anak.id, null);
    expect(baru).not.toBe(current.familyA);

    const anggotaBaru = await listKeluargaAnggotaRows(current.villageA, baru);
    expect(anggotaBaru).toHaveLength(1);
    expect(anggotaBaru[0]?.relationId).toBe(HEAD_OF_FAMILY_RELATION_ID);

    const anggotaLama = await listKeluargaAnggotaRows(current.villageA, current.familyA);
    expect(anggotaLama.every((row) => row.lifeStatus !== "alive")).toBe(true);
  });
});
