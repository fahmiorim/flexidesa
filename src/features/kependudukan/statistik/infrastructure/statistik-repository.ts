import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { regions, residents } from "@/db/schema";
import { bantuanPeserta, bantuanProgram } from "@/db/schema/bantuan";
import {
  type StatistikBantuanParams,
  type StatistikBantuanResult,
  type StatistikBantuanRow,
  type StatistikBantuanSummary,
} from "@/features/kependudukan/statistik/domain/statistik";

const MAX_PAGE = 100;

/** Statistik bantuan sosial per program atau sasaran. */
export async function getStatistikBantuan(
  villageId: number,
  params: StatistikBantuanParams,
): Promise<StatistikBantuanResult> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(MAX_PAGE, Math.max(1, params.perPage ?? 10));
  const offset = (page - 1) * perPage;

  let rows: StatistikBantuanRow[];
  let summary: StatistikBantuanSummary;

  if (params.kind === "program") {
    const programs = await db
      .select({
        id: bantuanProgram.id,
        slug: bantuanProgram.slug,
        name: bantuanProgram.name,
        sasaran: bantuanProgram.sasaran,
      })
      .from(bantuanProgram)
      .where(
        params.programSlug
          ? and(
              eq(bantuanProgram.villageId, villageId),
              eq(bantuanProgram.slug, params.programSlug),
            )
          : eq(bantuanProgram.villageId, villageId),
      );

    const programIds = programs.map((p) => p.id);

    let counts: Array<{
      programId: number;
      total: string | number;
      male: string | number;
      female: string | number;
    }> = [];
    if (programIds.length > 0) {
      counts = await db
        .select({
          programId: bantuanPeserta.programId,
          total: sql<number>`COUNT(${bantuanPeserta.id})`,
          male: sql<number>`COUNT(CASE WHEN ${residents.gender} = 'male' AND ${residents.lifeStatus} = 'alive' THEN 1 END)`,
          female: sql<number>`COUNT(CASE WHEN ${residents.gender} = 'female' AND ${residents.lifeStatus} = 'alive' THEN 1 END)`,
        })
        .from(bantuanPeserta)
        .leftJoin(
          residents,
          and(eq(bantuanPeserta.residentId, residents.id), eq(residents.villageId, villageId)),
        )
        .leftJoin(
          regions,
          and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)),
        )
        .where(
          and(
            inArray(bantuanPeserta.programId, programIds),
            eq(bantuanPeserta.villageId, villageId),
            params.dusun ? eq(regions.dusun, params.dusun) : undefined,
            params.rw ? eq(regions.rw, params.rw) : undefined,
            params.rt ? eq(regions.rt, params.rt) : undefined,
          ),
        )
        .groupBy(bantuanPeserta.programId);
    }

    const map = new Map(counts.map((c) => [c.programId, c]));
    let total = 0;
    let male = 0;
    let female = 0;
    for (const c of counts) {
      total += Number(c.total);
      male += Number(c.male);
      female += Number(c.female);
    }
    summary = { total, male, female };

    rows = programs
      .map((p) => {
        const c = map.get(p.id);
        const grand = summary.total;
        return {
          label: p.name,
          total: c ? Number(c.total) : 0,
          male: c ? Number(c.male) : 0,
          female: c ? Number(c.female) : 0,
          percentage: grand ? Math.round(((c ? Number(c.total) : 0) / grand) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  } else {
    // sasaran: hitung peserta per jenis sasaran (1=penduduk, 2=keluarga, …).
    // `COUNT(bantuan_peserta.id)` penting agar program tanpa peserta tidak ikut
    // terhitung sebagai satu baris (left join tetap menghasilkan satu baris).
    const sasaranRows = await db
      .select({
        sasaran: bantuanProgram.sasaran,
        total: sql<number>`COUNT(${bantuanPeserta.id})`,
        male: sql<number>`COUNT(CASE WHEN ${residents.gender} = 'male' AND ${residents.lifeStatus} = 'alive' THEN 1 END)`,
        female: sql<number>`COUNT(CASE WHEN ${residents.gender} = 'female' AND ${residents.lifeStatus} = 'alive' THEN 1 END)`,
      })
      .from(bantuanProgram)
      .leftJoin(
        bantuanPeserta,
        and(
          eq(bantuanPeserta.programId, bantuanProgram.id),
          eq(bantuanPeserta.villageId, villageId),
        ),
      )
      .leftJoin(
        residents,
        and(eq(bantuanPeserta.residentId, residents.id), eq(residents.villageId, villageId)),
      )
      .leftJoin(regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)))
      .where(
        and(
          params.sasaran
            ? and(
                eq(bantuanProgram.villageId, villageId),
                eq(bantuanProgram.sasaran, params.sasaran),
              )
            : eq(bantuanProgram.villageId, villageId),
          params.dusun ? eq(regions.dusun, params.dusun) : undefined,
          params.rw ? eq(regions.rw, params.rw) : undefined,
          params.rt ? eq(regions.rt, params.rt) : undefined,
          params.periodeMulai
            ? sql`(${bantuanProgram.startDate} IS NULL AND ${bantuanProgram.endDate} IS NULL) OR (${bantuanProgram.startDate} <= ${params.periodeMulai})`
            : undefined,
          params.periodeAkhir
            ? sql`(${bantuanProgram.endDate} IS NULL AND ${bantuanProgram.startDate} IS NULL) OR (${bantuanProgram.endDate} >= ${params.periodeAkhir})`
            : undefined,
        ),
      )
      .groupBy(bantuanProgram.sasaran);

    const labels: Record<number, string> = {
      1: "Penduduk",
      2: "Keluarga",
      3: "Rumah Tangga",
      4: "Kelompok",
    };
    summary = {
      total: sasaranRows.reduce((s, r) => s + Number(r.total), 0),
      male: sasaranRows.reduce((s, r) => s + Number(r.male), 0),
      female: sasaranRows.reduce((s, r) => s + Number(r.female), 0),
    };

    rows = sasaranRows
      .map((r) => {
        const grand = summary.total;
        return {
          label: labels[r.sasaran ?? 0] ?? `Sasaran ${r.sasaran ?? 0}`,
          total: Number(r.total),
          male: Number(r.male),
          female: Number(r.female),
          percentage: grand ? Math.round((Number(r.total) / grand) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  const pageRows = rows.slice(offset, offset + perPage);
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));

  return {
    rows: pageRows,
    summary,
    page,
    perPage,
    pageCount,
  };
}
