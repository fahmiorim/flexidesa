import "server-only";

import { and, asc, count, eq, getTableColumns, like, ne, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { families, regions, residentMutations, residents, rumahTangga } from "@/db/schema";
import {
  normalisasiTipePeta,
  type BatasWilayahInput,
  type PetaKantorInput,
  type WilayahDTO,
  type WilayahFormInput,
  type WilayahPatch,
} from "@/features/info-desa/wilayah/domain/wilayah";



/** Petakan baris `regions` → DTO domain (kosakata Indonesia). */
function toDto(row: typeof regions.$inferSelect, kepalaNik: string | null = null): WilayahDTO {
  return {
    id: row.id,
    dusun: row.dusun ?? "",
    rw: row.rw ?? "",
    rt: row.rt ?? "",
    kepala: row.kepala ?? "",
    kepalaNik: kepalaNik ?? "",
    kepalaResidentId: row.kepalaResidentId ?? null,
    koordinat: row.koordinat ?? "",
    path: row.path ?? "",
    zoom: row.zoom ?? null,
    mapTipe: row.mapTipe ? normalisasiTipePeta(row.mapTipe) : null,
    warna: row.warna ?? null,
    border: row.border ?? null,
    luasHa: row.luasHa !== null && row.luasHa !== undefined ? Number(row.luasHa) : null,
    urut: row.sortOrder,
  };
}

const kolomWilayah = getTableColumns(regions);

/** Select wilayah beserta NIK kepala dari penduduk desa yang sama. */
function selectWilayah() {
  return db
    .select({ ...kolomWilayah, kepalaNik: residents.nationalId })
    .from(regions)
    .leftJoin(
      residents,
      and(eq(residents.id, regions.kepalaResidentId), eq(residents.villageId, regions.villageId)),
    );
}

export async function findWilayahById(villageId: number, id: number): Promise<WilayahDTO | null> {
  const [row] = await selectWilayah()
    .where(and(eq(regions.villageId, villageId), eq(regions.id, id)))
    .limit(1);

  return row ? toDto(row, row.kepalaNik) : null;
}

/**
 * Seluruh wilayah desa tanpa paginasi.
 *
 * Dipakai fitur lain (penduduk, keluarga) untuk mengisi pilihan wilayah pada
 * formulir, sehingga pengetahuan tentang tabel `regions` tetap terpusat di sini.
 */
export async function listWilayahOptions(villageId: number): Promise<WilayahDTO[]> {
  const rows = await selectWilayah()
    .where(eq(regions.villageId, villageId))
    .orderBy(asc(regions.sortOrder), asc(regions.dusun), asc(regions.rw), asc(regions.rt));

  return rows.map((row) => toDto(row, row.kepalaNik));
}

/** Apakah kombinasi dusun/RW/RT sudah dipakai (kecuali `excludeId`). */
export async function wilayahExists(
  villageId: number,
  input: WilayahFormInput,
  excludeId: number | null,
): Promise<boolean> {
  const filters: SQL[] = [
    eq(regions.villageId, villageId),
    eq(regions.dusun, input.dusun),
    eq(regions.rw, input.rw),
    eq(regions.rt, input.rt),
  ];

  if (excludeId !== null) {
    filters.push(ne(regions.id, excludeId));
  }

  const duplicates = await db
    .select({ id: regions.id })
    .from(regions)
    .where(and(...filters))
    .limit(1);

  return duplicates.length > 0;
}

export async function insertWilayah(villageId: number, input: WilayahFormInput): Promise<number> {
  const [inserted] = await db
    .insert(regions)
    .values({
      villageId,
      dusun: input.dusun,
      rw: input.rw,
      rt: input.rt,
      kepala: input.kepala || null,
      kepalaResidentId: input.kepalaResidentId,
      luasHa: input.luasHa !== null && input.luasHa !== undefined ? String(input.luasHa) : null,
      sortOrder: input.urut,
    })
    .$returningId();

  if (!inserted) throw new Error("Gagal menyimpan data wilayah.");
  return inserted.id;
}

/**
 * Ambil wilayah berdasarkan dusun/RW/RT, atau buat bila belum ada.
 *
 * Dipakai impor penduduk: berkas impor membawa dusun/RW/RT sebagai teks, bukan
 * id. Nilai kosong disimpan sebagai string kosong agar indeks unik tetap
 * mencegah duplikasi (MySQL menganggap NULL berbeda satu sama lain).
 */
export async function pastikanWilayah(
  villageId: number,
  dusun: string,
  rw: string,
  rt: string,
): Promise<number> {
  const [existing] = await db
    .select({ id: regions.id })
    .from(regions)
    .where(
      and(
        eq(regions.villageId, villageId),
        eq(regions.dusun, dusun),
        eq(regions.rw, rw),
        eq(regions.rt, rt),
      ),
    )
    .limit(1);

  if (existing) return existing.id;

  const [inserted] = await db
    .insert(regions)
    .values({ villageId, dusun, rw, rt, sortOrder: 0 })
    .$returningId();
  if (!inserted) throw new Error("Gagal menyimpan data wilayah.");
  return inserted.id;
}

export async function updateWilayah(
  villageId: number,
  id: number,
  input: WilayahFormInput,
): Promise<void> {
  await db
    .update(regions)
    .set({
      dusun: input.dusun,
      rw: input.rw,
      rt: input.rt,
      kepala: input.kepala || null,
      kepalaResidentId: input.kepalaResidentId,
      luasHa: input.luasHa !== null && input.luasHa !== undefined ? String(input.luasHa) : null,
      sortOrder: input.urut,
    })
    .where(and(eq(regions.villageId, villageId), eq(regions.id, id)));
}

export interface KepalaRingkas {
  id: number;
  nama: string;
  nik: string;
  alamat: string;
}

/** Cari penduduk hidup berdasarkan NIK/nama untuk pemilih kepala wilayah. */
export async function cariPendudukKepala(
  villageId: number,
  q: string,
  limit = 10,
): Promise<KepalaRingkas[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const pola = `%${term}%`;

  const rows = await db
    .select({
      id: residents.id,
      nama: residents.name,
      nik: residents.nationalId,
      alamat: residents.address,
    })
    .from(residents)
    .where(
      and(
        eq(residents.villageId, villageId),
        eq(residents.lifeStatus, "alive"),
        or(like(residents.nationalId, pola), like(residents.name, pola)),
      ),
    )
    .orderBy(asc(residents.name), asc(residents.id))
    .limit(Math.min(Math.max(limit, 1), 10));

  return rows.map((row) => ({
    id: row.id,
    nama: row.nama,
    nik: row.nik ?? "",
    alamat: row.alamat ?? "",
  }));
}

/** Terapkan patch rename (nama dusun/RW/RT) dalam satu transaksi desa. */
export async function terapkanGantiNama(
  villageId: number,
  patches: readonly WilayahPatch[],
): Promise<void> {
  if (patches.length === 0) return;
  await db.transaction(async (tx) => {
    for (const patch of patches) {
      await tx
        .update(regions)
        .set({ dusun: patch.dusun, rw: patch.rw, rt: patch.rt })
        .where(and(eq(regions.villageId, villageId), eq(regions.id, patch.id)));
    }
  });
}

/** Simpan titik kantor, zoom, dan tipe peta tanpa menyentuh identitas. */
export async function updateKantorWilayah(
  villageId: number,
  id: number,
  input: PetaKantorInput,
): Promise<void> {
  await db
    .update(regions)
    .set({
      koordinat: input.koordinat || null,
      zoom: input.zoom,
      mapTipe: input.mapTipe,
    })
    .where(and(eq(regions.villageId, villageId), eq(regions.id, id)));
}

/** Simpan batas wilayah beserta pengaturan tampilannya. */
export async function updateBatasWilayah(
  villageId: number,
  id: number,
  input: BatasWilayahInput,
): Promise<void> {
  await db
    .update(regions)
    .set({
      path: input.path || null,
      zoom: input.zoom,
      warna: input.warna,
      border: input.border,
    })
    .where(and(eq(regions.villageId, villageId), eq(regions.id, id)));
}

/** Memastikan penduduk calon kepala wilayah benar milik desa aktif. */
export async function pendudukMilikDesa(villageId: number, id: number) {
  const [row] = await db
    .select({ id: residents.id, nama: residents.name })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), eq(residents.id, id)))
    .limit(1);
  return row ?? null;
}

/**
 * Menghitung pemakai wilayah sebelum penghapusan.
 *
 * Penghapusan ditolak bila masih ada baris turunan, penduduk, keluarga, atau
 * rumah tangga yang menunjuk ke wilayah ini. Tanpa pemeriksaan ini, data
 * kependudukan kehilangan keterkaitan wilayah secara diam-diam.
 */
export async function hitungPemakaiWilayah(
  villageId: number,
  id: number,
): Promise<{ penduduk: number; keluarga: number; rumahTangga: number }> {
  const [penduduk, keluarga, rumahTanggaRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(residents)
      .where(and(eq(residents.villageId, villageId), eq(residents.regionId, id))),
    db
      .select({ value: count() })
      .from(families)
      .where(and(eq(families.villageId, villageId), eq(families.regionId, id))),
    db
      .select({ value: count() })
      .from(rumahTangga)
      .where(and(eq(rumahTangga.villageId, villageId), eq(rumahTangga.regionId, id))),
  ]);
  return {
    penduduk: penduduk[0]?.value ?? 0,
    keluarga: keluarga[0]?.value ?? 0,
    rumahTangga: rumahTanggaRows[0]?.value ?? 0,
  };
}

/**
 * Menukar `sort_order` satu baris dengan tetangga terdekat pada tingkat yang
 * sama (dusun/RW/RT), sehingga urutan dapat diatur tanpa mengetik angka.
 */
export async function tukarUrutanWilayah(
  villageId: number,
  id: number,
  arah: "naik" | "turun",
): Promise<void> {
  const rows = await listWilayahOptions(villageId);
  const posisi = rows.findIndex((row) => row.id === id);
  if (posisi < 0) throw new Error("Wilayah tidak ditemukan pada desa aktif.");
  const sekarang = rows[posisi];
  if (!sekarang) throw new Error("Wilayah tidak ditemukan pada desa aktif.");
  // Saudara = baris pada tingkat dan induk yang sama.
  const saudara = rows.filter((row) => {
    if (!sekarang.rw && !sekarang.rt) return !row.rw && !row.rt;
    if (sekarang.rw && !sekarang.rt)
      return row.dusun === sekarang.dusun && Boolean(row.rw) && !row.rt;
    return row.dusun === sekarang.dusun && row.rw === sekarang.rw && Boolean(row.rt);
  });
  const index = saudara.findIndex((row) => row.id === id);
  const target = index + (arah === "naik" ? -1 : 1);
  const tetangga = saudara[target];
  if (!tetangga) return;

  await db.transaction(async (tx) => {
    await tx
      .update(regions)
      .set({ sortOrder: tetangga.urut })
      .where(and(eq(regions.villageId, villageId), eq(regions.id, sekarang.id)));
    await tx
      .update(regions)
      .set({ sortOrder: sekarang.urut })
      .where(and(eq(regions.villageId, villageId), eq(regions.id, tetangga.id)));
  });
}

export async function deleteWilayah(villageId: number, id: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(families)
      .set({ regionId: null })
      .where(and(eq(families.villageId, villageId), eq(families.regionId, id)));
    await tx
      .update(residents)
      .set({ regionId: null })
      .where(and(eq(residents.villageId, villageId), eq(residents.regionId, id)));
    await tx
      .update(rumahTangga)
      .set({ regionId: null })
      .where(and(eq(rumahTangga.villageId, villageId), eq(rumahTangga.regionId, id)));
    await tx
      .update(residentMutations)
      .set({ fromRegionId: null })
      .where(
        and(eq(residentMutations.villageId, villageId), eq(residentMutations.fromRegionId, id)),
      );
    await tx
      .update(residentMutations)
      .set({ toRegionId: null })
      .where(and(eq(residentMutations.villageId, villageId), eq(residentMutations.toRegionId, id)));
    await tx.delete(regions).where(and(eq(regions.villageId, villageId), eq(regions.id, id)));
  });
}
