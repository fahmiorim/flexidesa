import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { getNamaDesaUseCase } from "@/features/info-desa/desa/application/use-cases";
import {
  hitungStatistikKependudukan,
  kategoriStatistik,
  pendudukKategori,
  STATISTIK_DEFAULT_KATEGORI,
  type HasilStatistikKependudukan,
  type KategoriStatistik,
  type PejabatPenandatanganStatistik,
  type PendudukStatistik,
} from "@/features/kependudukan/statistik/domain/statistik-kependudukan";
import {
  ambilDataStatistikKependudukan,
  listPejabatPenandatangan,
  type FilterWilayahStatistik,
} from "@/features/kependudukan/statistik/infrastructure/statistik-kependudukan-repository";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

export interface PilihanStatistikKependudukan extends FilterWilayahStatistik {
  kategoriSlug: string;
}

export interface HasilStatistikKependudukanData {
  kategori: KategoriStatistik;
  hasil: HasilStatistikKependudukan;
}

/** Ambil potongan teks query yang aman untuk filter wilayah. */
export function nilaiFilter(value: string | string[] | undefined): string | undefined {
  const teks = Array.isArray(value) ? value[0] : value;
  const bersih = (teks ?? "").trim().slice(0, 100);
  return bersih || undefined;
}

/** Normalisasi parameter kategori; kategori tidak dikenal kembali ke bawaan. */
export function normalkanKategori(value: string | undefined): KategoriStatistik {
  return kategoriStatistik(value) ?? kategoriStatistik(STATISTIK_DEFAULT_KATEGORI)!;
}

/** Data halaman statistik untuk desa pada sesi. */
export async function getStatistikKependudukanData(
  villageId: number,
  query: PilihanStatistikKependudukan,
): Promise<HasilStatistikKependudukanData> {
  const kategori = normalkanKategori(query.kategoriSlug);
  const data = await ambilDataStatistikKependudukan(villageId, query);

  return { kategori, hasil: hitungStatistikKependudukan(kategori, data) };
}

/** Varian halaman: memakai izin baca penduduk dan tenant dari sesi. */
export async function getStatistikKependudukanPageData(
  query: PilihanStatistikKependudukan,
): Promise<HasilStatistikKependudukanData> {
  const user = await requirePermission(RESOURCES.penduduk, "read");
  const villageId = await resolveVillageId(user);

  return getStatistikKependudukanData(villageId, query);
}

export interface PendudukKategoriQuery extends FilterWilayahStatistik {
  kategoriSlug: string;
  kelompok: string;
  gender?: "male" | "female";
}

export interface PendudukKategoriData {
  kategori: KategoriStatistik;
  kelompok: string;
  rows: PendudukStatistik[];
}

/** Daftar penduduk pada satu baris kategori statistik. */
export async function getPendudukKategoriPageData(
  query: PendudukKategoriQuery,
): Promise<PendudukKategoriData> {
  const user = await requirePermission(RESOURCES.penduduk, "read");
  const villageId = await resolveVillageId(user);
  const kategori = normalkanKategori(query.kategoriSlug);
  const data = await ambilDataStatistikKependudukan(villageId, query);
  const kelompok = query.kelompok.trim().slice(0, 120);

  let rows = pendudukKategori(kategori, data, kelompok);
  if (query.gender) rows = rows.filter((row) => row.gender === query.gender);
  rows = rows.sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  return { kategori, kelompok, rows };
}

export interface StatistikKependudukanCetakData {
  kategori: KategoriStatistik;
  hasil: HasilStatistikKependudukan;
  namaDesa: string | null;
  pejabat: PejabatPenandatanganStatistik | null;
  nomor: string | null;
}

/** Data halaman cetak lengkap dengan pejabat penanda tangan. */
export async function getStatistikKependudukanCetakData(
  query: PilihanStatistikKependudukan & { ttd?: number; nomor?: string },
): Promise<StatistikKependudukanCetakData> {
  const user = await requirePermission(RESOURCES.penduduk, "read");
  const villageId = await resolveVillageId(user);
  const [{ kategori, hasil }, namaDesa, pejabatRows] = await Promise.all([
    getStatistikKependudukanData(villageId, query),
    getNamaDesaUseCase(villageId),
    listPejabatPenandatangan(villageId),
  ]);

  return {
    kategori,
    hasil,
    namaDesa,
    pejabat:
      query.ttd === undefined ? null : (pejabatRows.find((item) => item.id === query.ttd) ?? null),
    nomor: query.nomor?.trim().slice(0, 100) || null,
  };
}

/** Pejabat aktif untuk dialog penandatanganan. */
export async function getPenandatanganStatistikData(): Promise<PejabatPenandatanganStatistik[]> {
  const user = await requirePermission(RESOURCES.penduduk, "read");
  const villageId = await resolveVillageId(user);

  return listPejabatPenandatangan(villageId);
}

/** Label filter wilayah untuk CSV/PDF dan ringkasan halaman. */
export function labelFilterWilayah(filter: FilterWilayahStatistik): string {
  const bagian = [
    filter.dusun ? `Dusun ${filter.dusun}` : null,
    filter.rw ? `RW ${filter.rw}` : null,
    filter.rt ? `RT ${filter.rt}` : null,
  ].filter(Boolean);

  return bagian.length ? bagian.join(", ") : "Semua wilayah";
}
