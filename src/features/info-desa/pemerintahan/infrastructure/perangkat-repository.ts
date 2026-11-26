import "server-only";

/**
 * Query perangkat desa.
 *
 * Semua fungsi dibatasi `villageId` pemilik sehingga tidak ada data yang
 * bocor antar-desa.
 */

import { and, asc, eq, inArray, like, max, ne, or } from "drizzle-orm";

import { db } from "@/db";
import { educations, jabatanPerangkat, perangkatDesa, religions, residents } from "@/db/schema";

export type PerangkatValues = Omit<
  typeof perangkatDesa.$inferInsert,
  "id" | "villageId" | "createdAt" | "updatedAt"
>;

export async function listPerangkat(villageId: number) {
  return db
    .select({
      id: perangkatDesa.id,
      nama: perangkatDesa.nama,
      gelarDepan: perangkatDesa.gelarDepan,
      gelarBelakang: perangkatDesa.gelarBelakang,
      nip: perangkatDesa.nip,
      niap: perangkatDesa.niap,
      nik: perangkatDesa.nik,
      tagIdCard: perangkatDesa.tagIdCard,
      residentId: perangkatDesa.residentId,
      jabatanId: perangkatDesa.jabatanId,
      jabatan: jabatanPerangkat.nama,
      jenisJabatan: jabatanPerangkat.jenis,
      jenisKelamin: perangkatDesa.jenisKelamin,
      tempatLahir: perangkatDesa.tempatLahir,
      tanggalLahir: perangkatDesa.tanggalLahir,
      foto: perangkatDesa.foto,
      status: perangkatDesa.status,
      periode: perangkatDesa.periode,
      pendidikan: perangkatDesa.pendidikan,
      agama: perangkatDesa.agama,
      pangkat: perangkatDesa.pangkat,
      telepon: perangkatDesa.telepon,
      email: perangkatDesa.email,
      alamat: perangkatDesa.alamat,
      nomorSkPengangkatan: perangkatDesa.nomorSkPengangkatan,
      tanggalPengangkatan: perangkatDesa.tanggalPengangkatan,
      nomorSkPemberhentian: perangkatDesa.nomorSkPemberhentian,
      tanggalPemberhentian: perangkatDesa.tanggalPemberhentian,
      atasanId: perangkatDesa.atasanId,
      wilayahId: perangkatDesa.wilayahId,
      urut: perangkatDesa.urut,
      statusPejabat: perangkatDesa.statusPejabat,
      kehadiran: perangkatDesa.kehadiran,
      ttdAn: perangkatDesa.ttdAn,
      ttdUb: perangkatDesa.ttdUb,
      baganTingkat: perangkatDesa.baganTingkat,
      baganOffset: perangkatDesa.baganOffset,
      baganLayout: perangkatDesa.baganLayout,
      baganWarna: perangkatDesa.baganWarna,
      mediaSosial: perangkatDesa.mediaSosial,
    })
    .from(perangkatDesa)
    .leftJoin(
      jabatanPerangkat,
      and(
        eq(perangkatDesa.jabatanId, jabatanPerangkat.id),
        eq(jabatanPerangkat.villageId, villageId),
      ),
    )
    .where(eq(perangkatDesa.villageId, villageId))
    .orderBy(asc(perangkatDesa.urut), asc(perangkatDesa.id));
}

export async function listJabatanRingkas(villageId: number) {
  return db
    .select({
      id: jabatanPerangkat.id,
      nama: jabatanPerangkat.nama,
      slug: jabatanPerangkat.slug,
      jenis: jabatanPerangkat.jenis,
      tupoksi: jabatanPerangkat.tupoksi,
      urut: jabatanPerangkat.urut,
    })
    .from(jabatanPerangkat)
    .where(eq(jabatanPerangkat.villageId, villageId))
    .orderBy(asc(jabatanPerangkat.urut));
}

/** Memastikan penduduk yang dipilih benar milik desa aktif. */
export async function getPendudukTenant(villageId: number, id: number) {
  const [row] = await db
    .select({ id: residents.id, nama: residents.name })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), eq(residents.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getPerangkatByNik(villageId: number, nik: string, excludeId: number | null) {
  const [row] = await db
    .select({ id: perangkatDesa.id })
    .from(perangkatDesa)
    .where(
      and(
        eq(perangkatDesa.villageId, villageId),
        eq(perangkatDesa.nik, nik),
        ...(excludeId ? [ne(perangkatDesa.id, excludeId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getPerangkatByNip(villageId: number, nip: string, excludeId: number | null) {
  const [row] = await db
    .select({ id: perangkatDesa.id })
    .from(perangkatDesa)
    .where(
      and(
        eq(perangkatDesa.villageId, villageId),
        eq(perangkatDesa.nip, nip),
        ...(excludeId ? [ne(perangkatDesa.id, excludeId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Sekretaris desa aktif untuk blok tanda tangan dokumen cetak. */
export async function getSekretarisAktif(villageId: number) {
  const [row] = await db
    .select({
      nama: perangkatDesa.nama,
      gelarDepan: perangkatDesa.gelarDepan,
      gelarBelakang: perangkatDesa.gelarBelakang,
      nip: perangkatDesa.nip,
      niap: perangkatDesa.niap,
    })
    .from(perangkatDesa)
    .innerJoin(
      jabatanPerangkat,
      and(
        eq(jabatanPerangkat.id, perangkatDesa.jabatanId),
        eq(jabatanPerangkat.villageId, villageId),
      ),
    )
    .where(
      and(
        eq(perangkatDesa.villageId, villageId),
        eq(jabatanPerangkat.jenis, "sekdes"),
        eq(perangkatDesa.status, "aktif"),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getMaxUrutPerangkat(villageId: number) {
  const [row] = await db
    .select({ maks: max(perangkatDesa.urut) })
    .from(perangkatDesa)
    .where(eq(perangkatDesa.villageId, villageId));
  return row?.maks ?? 0;
}

export async function getPerangkatByTagIdCard(
  villageId: number,
  tagIdCard: string,
  excludeId: number | null,
) {
  const [row] = await db
    .select({ id: perangkatDesa.id })
    .from(perangkatDesa)
    .where(
      and(
        eq(perangkatDesa.villageId, villageId),
        eq(perangkatDesa.tagIdCard, tagIdCard),
        ...(excludeId ? [ne(perangkatDesa.id, excludeId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getPerangkat(villageId: number, id: number) {
  const [row] = await db
    .select({
      id: perangkatDesa.id,
      foto: perangkatDesa.foto,
      atasanId: perangkatDesa.atasanId,
      status: perangkatDesa.status,
    })
    .from(perangkatDesa)
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.id, id)))
    .limit(1);
  return row ?? null;
}

/** Aparat yang tertaut ke satu wilayah (kepala dusun hasil sinkronisasi). */
export async function getPerangkatByWilayah(villageId: number, wilayahId: number) {
  const [row] = await db
    .select({
      id: perangkatDesa.id,
      nama: perangkatDesa.nama,
      residentId: perangkatDesa.residentId,
      jabatanId: perangkatDesa.jabatanId,
      wilayahId: perangkatDesa.wilayahId,
      atasanId: perangkatDesa.atasanId,
      status: perangkatDesa.status,
    })
    .from(perangkatDesa)
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.wilayahId, wilayahId)))
    .limit(1);
  return row ?? null;
}

/** Aparat aktif yang menjabat Kepala Desa, dipakai sebagai atasan kepala dusun. */
export async function getKepalaDesaAktifId(villageId: number) {
  const [row] = await db
    .select({ id: perangkatDesa.id })
    .from(perangkatDesa)
    .innerJoin(
      jabatanPerangkat,
      and(
        eq(perangkatDesa.jabatanId, jabatanPerangkat.id),
        eq(jabatanPerangkat.villageId, villageId),
      ),
    )
    .where(
      and(
        eq(perangkatDesa.villageId, villageId),
        eq(perangkatDesa.status, "aktif"),
        eq(jabatanPerangkat.jenis, "kades"),
      ),
    )
    .limit(1);
  return row?.id ?? null;
}

export async function insertPerangkat(villageId: number, values: PerangkatValues) {
  await db.insert(perangkatDesa).values({ ...values, villageId });
}

export async function updatePerangkat(
  villageId: number,
  id: number,
  values: Partial<PerangkatValues>,
) {
  await db
    .update(perangkatDesa)
    .set(values)
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.id, id)));
}

export async function clearAtasanPerangkat(villageId: number, atasanId: number) {
  await db
    .update(perangkatDesa)
    .set({ atasanId: null })
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.atasanId, atasanId)));
}

/** Lepas atasan untuk banyak aparat yang dihapus sekaligus. */
export async function clearAtasanPerangkatBanyak(villageId: number, atasanIds: number[]) {
  if (!atasanIds.length) return;
  await db
    .update(perangkatDesa)
    .set({ atasanId: null })
    .where(and(eq(perangkatDesa.villageId, villageId), inArray(perangkatDesa.atasanId, atasanIds)));
}

export async function deletePerangkat(villageId: number, id: number) {
  await db
    .delete(perangkatDesa)
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.id, id)));
}

/** Hapus banyak aparat dalam satu perintah agar tidak ada penghapusan sebagian. */
export async function deletePerangkatBanyak(villageId: number, ids: number[]) {
  if (!ids.length) return;
  await db
    .delete(perangkatDesa)
    .where(and(eq(perangkatDesa.villageId, villageId), inArray(perangkatDesa.id, ids)));
}

/**
 * Pencarian penduduk hidup untuk memilih aparat desa.
 *
 * Menyertakan data kependudukan yang dipakai untuk mengisi otomatis field
 * identitas pada form perangkat (nama, kelamin, tempat/tanggal lahir, agama,
 * dan pendidikan).
 */
export async function cariPendudukAparat(villageId: number, q: string, limit = 10) {
  const term = q.trim();
  if (term.length < 2) return [];
  const pola = `%${term}%`;
  return db
    .select({
      id: residents.id,
      nama: residents.name,
      nik: residents.nationalId,
      jenisKelamin: residents.gender,
      tempatLahir: residents.birthPlace,
      tanggalLahir: residents.birthDate,
      agama: religions.name,
      pendidikan: educations.name,
    })
    .from(residents)
    .leftJoin(religions, eq(religions.id, residents.religionId))
    .leftJoin(educations, eq(educations.id, residents.educationId))
    .where(
      and(
        eq(residents.villageId, villageId),
        eq(residents.lifeStatus, "alive"),
        or(like(residents.nationalId, pola), like(residents.name, pola)),
      ),
    )
    .orderBy(asc(residents.name), asc(residents.id))
    .limit(Math.min(Math.max(limit, 1), 10));
}

export async function getPerangkatStatus(villageId: number, id: number) {
  const [row] = await db
    .select({ status: perangkatDesa.status })
    .from(perangkatDesa)
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.id, id)))
    .limit(1);
  return row ?? null;
}
