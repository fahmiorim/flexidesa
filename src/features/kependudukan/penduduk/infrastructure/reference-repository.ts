import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  bloodTypes,
  citizenships,
  educations,
  families,
  familyRelations,
  maritalStatuses,
  occupations,
  religions,
} from "@/db/schema";
import { formatWilayahLabel } from "@/features/info-desa/wilayah/domain/wilayah";
import { listWilayahOptions } from "@/features/info-desa/wilayah/infrastructure/wilayah-repository";
import type { PendudukReferenceData } from "@/features/kependudukan/penduduk/domain/penduduk";

/**
 * Data referensi untuk formulir penduduk.
 *
 * Katalog (agama, pendidikan, pekerjaan, dst.) bersifat global; wilayah dan
 * daftar KK dibatasi per desa. Semuanya dikembalikan dalam satu panggilan agar
 * halaman cukup sekali query.
 */
/** Katalog untuk filter daftar penduduk, tanpa memuat KK dan wilayah desa. */
type PendudukFilterCatalog = Pick<
  PendudukReferenceData,
  "religions" | "educations" | "occupations" | "maritalStatuses"
>;

/**
 * Katalog global (agama, pendidikan, pekerjaan, status kawin) untuk toolbar
 * filter. Dipisah dari `getPendudukReferenceData` agar halaman daftar tidak
 * menarik seluruh KK dan wilayah hanya untuk mengisi pilihan filter.
 */
export async function getPendudukFilterCatalog(): Promise<PendudukFilterCatalog> {
  const [religionRows, educationRows, occupationRows, maritalRows] = await Promise.all([
    db
      .select({ id: religions.id, name: religions.name })
      .from(religions)
      .orderBy(asc(religions.id)),
    db
      .select({ id: educations.id, name: educations.name })
      .from(educations)
      .orderBy(asc(educations.id)),
    db
      .select({ id: occupations.id, name: occupations.name })
      .from(occupations)
      .orderBy(asc(occupations.id)),
    db
      .select({ id: maritalStatuses.id, name: maritalStatuses.name })
      .from(maritalStatuses)
      .orderBy(asc(maritalStatuses.id)),
  ]);

  return {
    religions: religionRows,
    educations: educationRows,
    occupations: occupationRows,
    maritalStatuses: maritalRows,
  };
}

export async function getPendudukReferenceData(villageId: number): Promise<PendudukReferenceData> {
  const [
    religionRows,
    educationRows,
    occupationRows,
    maritalRows,
    relationRows,
    bloodRows,
    citizenshipRows,
    familyRows,
    regionRows,
  ] = await Promise.all([
    db
      .select({ id: religions.id, name: religions.name })
      .from(religions)
      .orderBy(asc(religions.id)),
    db
      .select({ id: educations.id, name: educations.name })
      .from(educations)
      .orderBy(asc(educations.id)),
    db
      .select({ id: occupations.id, name: occupations.name })
      .from(occupations)
      .orderBy(asc(occupations.id)),
    db
      .select({ id: maritalStatuses.id, name: maritalStatuses.name })
      .from(maritalStatuses)
      .orderBy(asc(maritalStatuses.id)),
    db
      .select({ id: familyRelations.id, name: familyRelations.name })
      .from(familyRelations)
      .orderBy(asc(familyRelations.id)),
    db
      .select({ id: bloodTypes.id, name: bloodTypes.name })
      .from(bloodTypes)
      .orderBy(asc(bloodTypes.id)),
    db
      .select({ id: citizenships.id, name: citizenships.name })
      .from(citizenships)
      .orderBy(asc(citizenships.id)),
    db
      .select({ id: families.id, number: families.number })
      .from(families)
      .where(eq(families.villageId, villageId))
      .orderBy(asc(families.number)),
    listWilayahOptions(villageId),
  ]);

  /** Nilai unik & terurut agar pilihan filter tidak menampilkan dusun berulang. */
  const unik = (nilai: (string | null)[]): string[] =>
    [...new Set(nilai.filter((item): item is string => item !== null && item !== ""))].sort(
      (a, b) => a.localeCompare(b, "id"),
    );

  return {
    religions: religionRows,
    educations: educationRows,
    occupations: occupationRows,
    maritalStatuses: maritalRows,
    familyRelations: relationRows,
    bloodTypes: bloodRows,
    citizenships: citizenshipRows,
    families: familyRows.map((row) => ({ id: row.id, label: `KK ${row.number}` })),
    regions: regionRows.map((row) => ({
      id: row.id,
      label: formatWilayahLabel({
        dusun: row.dusun,
        rw: row.rw,
        rt: row.rt,
      }),
    })),
    dusun: unik(regionRows.map((row) => row.dusun)),
    rw: unik(regionRows.map((row) => row.rw)),
    rt: unik(regionRows.map((row) => row.rt)),
  };
}
