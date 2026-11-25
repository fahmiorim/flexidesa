import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { regions, residents, villages } from "@/db/schema";
import {
  cariPendudukKepala,
  findWilayahById,
  listWilayahOptions,
  terapkanGantiNama,
  updateBatasWilayah,
  updateKantorWilayah,
  updateWilayah,
} from "@/features/wilayah/infrastructure/wilayah-repository";
import { siapkanDatabaseUji } from "@/testing/migrasi-uji";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../../db/migrations", import.meta.url));
const RUN = randomUUID().slice(0, 8);

let fixture: {
  desaA: number;
  desaB: number;
  hidupA: number;
  meninggalA: number;
  dusunA: number;
  rwA: number;
  rtA: number;
  dusunB: number;
} | null = null;

beforeAll(async () => {
  await siapkanDatabaseUji(db, { migrationsFolder: MIGRATIONS_FOLDER });

  const [desaARow] = await db
    .insert(villages)
    .values({ name: `Desa Wilayah A ${RUN}`, code: `WA${RUN}` })
    .$returningId();
  const [desaBRow] = await db
    .insert(villages)
    .values({ name: `Desa Wilayah B ${RUN}`, code: `WB${RUN}` })
    .$returningId();
  const desaA = desaARow!.id;
  const desaB = desaBRow!.id;

  const [hidup] = await db
    .insert(residents)
    .values({
      villageId: desaA,
      name: `Kepala Hidup ${RUN}`,
      gender: "male",
      nationalId: `A${RUN}`.padEnd(16, "1").slice(0, 16),
      lifeStatus: "alive",
    })
    .$returningId();
  const [meninggal] = await db
    .insert(residents)
    .values({
      villageId: desaA,
      name: `Kepala Meninggal ${RUN}`,
      gender: "female",
      nationalId: `D${RUN}`.padEnd(16, "2").slice(0, 16),
      lifeStatus: "deceased",
    })
    .$returningId();
  const hidupA = hidup!.id;
  const meninggalA = meninggal!.id;

  const [dusunA] = await db
    .insert(regions)
    .values({
      villageId: desaA,
      dusun: "Sukamaju",
      kepala: `Kepala Hidup ${RUN}`,
      kepalaResidentId: hidupA,
      koordinat: "-6.200000, 106.816666",
      path: '{"type":"Polygon","coordinates":[[[106.8,-6.2],[106.9,-6.2],[106.9,-6.3],[106.8,-6.2]]]}',
      zoom: 15,
      mapTipe: "HYBRID",
      warna: "#10b981",
      border: "#047857",
    })
    .$returningId();
  const [rwA] = await db
    .insert(regions)
    .values({ villageId: desaA, dusun: "Sukamaju", rw: "01" })
    .$returningId();
  const [rtA] = await db
    .insert(regions)
    .values({ villageId: desaA, dusun: "Sukamaju", rw: "01", rt: "01" })
    .$returningId();
  const [dusunB] = await db
    .insert(regions)
    .values({ villageId: desaB, dusun: "Sukamaju" })
    .$returningId();

  fixture = {
    desaA,
    desaB,
    hidupA,
    meninggalA,
    dusunA: dusunA!.id,
    rwA: rwA!.id,
    rtA: rtA!.id,
    dusunB: dusunB!.id,
  };
});

describe("wilayah repository", () => {
  it("menyertakan NIK kepala dari penduduk desa yang sama", async () => {
    const rows = await listWilayahOptions(fixture!.desaA);
    const dusun = rows.find((row) => row.id === fixture!.dusunA);
    expect(dusun?.kepalaNik).toBe(`A${RUN}`.padEnd(16, "1").slice(0, 16));
    expect(dusun?.mapTipe).toBe("carto");
  });

  it("hanya menawarkan penduduk hidup pada pencarian kepala", async () => {
    const hasil = await cariPendudukKepala(fixture!.desaA, RUN);
    expect(hasil.some((row) => row.id === fixture!.hidupA)).toBe(true);
    expect(hasil.some((row) => row.id === fixture!.meninggalA)).toBe(false);
    expect(await cariPendudukKepala(fixture!.desaA, "a")).toEqual([]);
  });

  it("mengganti nama dusun beserta turunannya tanpa menyentuh desa lain", async () => {
    await terapkanGantiNama(fixture!.desaA, [
      { id: fixture!.dusunA, dusun: "Sukamaju Baru", rw: "", rt: "" },
      { id: fixture!.rwA, dusun: "Sukamaju Baru", rw: "01", rt: "" },
      { id: fixture!.rtA, dusun: "Sukamaju Baru", rw: "01", rt: "01" },
    ]);

    const rowsA = await listWilayahOptions(fixture!.desaA);
    expect(rowsA.filter((row) => row.dusun === "Sukamaju Baru")).toHaveLength(3);
    const rowB = await db
      .select()
      .from(regions)
      .where(and(eq(regions.villageId, fixture!.desaB), eq(regions.id, fixture!.dusunB)));
    expect(rowB[0]?.dusun).toBe("Sukamaju");
  });

  it("menyimpan identitas tanpa mengosongkan peta", async () => {
    await updateWilayah(fixture!.desaA, fixture!.dusunA, {
      dusun: "Sukamaju Baru",
      rw: "",
      rt: "",
      kepala: "",
      kepalaResidentId: null,
      urut: 3,
    });

    const row = await findWilayahById(fixture!.desaA, fixture!.dusunA);
    expect(row?.koordinat).toBe("-6.200000, 106.816666");
    expect(row?.path).not.toBe("");
    expect(row?.zoom).toBe(15);
    expect(row?.urut).toBe(3);
  });

  it("menyimpan peta kantor dan batas secara terpisah", async () => {
    await updateKantorWilayah(fixture!.desaA, fixture!.dusunA, {
      koordinat: "-6.300000, 106.900000",
      zoom: 17,
      mapTipe: "osm",
    });
    await updateBatasWilayah(fixture!.desaA, fixture!.dusunA, {
      path: '{"type":"MultiPolygon","coordinates":[[[[106.8,-6.2],[106.9,-6.2],[106.9,-6.3],[106.8,-6.2]]]]}',
      zoom: 13,
      warna: "#2563eb",
      border: "#1d4ed8",
    });

    const row = await findWilayahById(fixture!.desaA, fixture!.dusunA);
    expect(row?.mapTipe).toBe("osm");
    expect(row?.zoom).toBe(13);
    expect(row?.path).toContain("MultiPolygon");
    expect(row?.warna).toBe("#2563eb");
    expect(row?.koordinat).toBe("-6.300000, 106.900000");
  });
});
