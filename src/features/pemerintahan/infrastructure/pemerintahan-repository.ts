import "server-only";

import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  inArray,
  isNull,
  like,
  max,
  ne,
  or,
} from "drizzle-orm";

import { db } from "@/db";
import {
  areas,
  educations,
  families,
  jabatanPerangkat,
  lembagaAnggota,
  lembagaDesa,
  lembagaMaster,
  pemerintahanDokumen,
  perangkatDesa,
  perangkatRiwayatJabatan,
  polygons,
  profilDesa,
  regions,
  religions,
  residents,
} from "@/db/schema";
import {
  hitungJumlahWilayah,
  normalisasiTipePeta,
  tingkatWilayah,
  type JumlahWilayah,
  type WilayahDenganJumlah,
} from "@/features/wilayah/domain/wilayah";

/**
 * Repository modul Pemerintahan Desa.
 *
 * Semua query di sini wajib dibatasi `village_id` tenant yang sudah
 * diverifikasi di application layer. Pemeriksaan aturan bisnis (validasi
 * status, relasi atasan, GeoJSON) tetap berada di use case.
 */

export type PerangkatValues = Omit<
  typeof perangkatDesa.$inferInsert,
  "id" | "villageId" | "createdAt" | "updatedAt"
>;
export type LembagaValues = Omit<
  typeof lembagaDesa.$inferInsert,
  "id" | "villageId" | "createdAt" | "updatedAt"
>;
export type MasterLembagaValues = Omit<
  typeof lembagaMaster.$inferInsert,
  "id" | "villageId" | "createdAt" | "updatedAt"
>;
export type AnggotaValues = Omit<
  typeof lembagaAnggota.$inferInsert,
  "id" | "villageId" | "createdAt" | "updatedAt"
>;
export type RiwayatValues = Omit<
  typeof perangkatRiwayatJabatan.$inferInsert,
  "id" | "villageId" | "createdAt"
>;
export type AreaValues = Omit<typeof areas.$inferInsert, "id" | "villageId">;
export type PolygonValues = Omit<typeof polygons.$inferInsert, "id" | "villageId">;
export type DokumenValues = Omit<
  typeof pemerintahanDokumen.$inferInsert,
  "id" | "villageId" | "createdAt"
>;
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

export async function listRiwayatJabatan(villageId: number) {
  return db
    .select()
    .from(perangkatRiwayatJabatan)
    .where(eq(perangkatRiwayatJabatan.villageId, villageId))
    .orderBy(asc(perangkatRiwayatJabatan.mulai));
}

export async function listDokumenPemerintahan(villageId: number) {
  return db
    .select()
    .from(pemerintahanDokumen)
    .where(eq(pemerintahanDokumen.villageId, villageId))
    .orderBy(asc(pemerintahanDokumen.tanggal));
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

export async function getJabatan(villageId: number, id: number) {
  const [row] = await db
    .select({ id: jabatanPerangkat.id })
    .from(jabatanPerangkat)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.id, id)))
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

/** Semua berkas dokumen milik aparat yang akan dihapus, untuk pembersihan media. */
export async function listBerkasDokumenPerangkatBanyak(villageId: number, perangkatIds: number[]) {
  if (!perangkatIds.length) return [];
  return db
    .select({ berkas: pemerintahanDokumen.berkas })
    .from(pemerintahanDokumen)
    .where(
      and(
        eq(pemerintahanDokumen.villageId, villageId),
        inArray(pemerintahanDokumen.perangkatId, perangkatIds),
      ),
    );
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

export async function listBerkasDokumen(
  villageId: number,
  owner: { perangkatId: number } | { lembagaId: number },
) {
  const condition =
    "perangkatId" in owner
      ? eq(pemerintahanDokumen.perangkatId, owner.perangkatId)
      : eq(pemerintahanDokumen.lembagaId, owner.lembagaId);
  return db
    .select({ berkas: pemerintahanDokumen.berkas })
    .from(pemerintahanDokumen)
    .where(and(eq(pemerintahanDokumen.villageId, villageId), condition));
}

/** Nama ketua lembaga dari data penduduk, untuk tampilan cetak/unduh. */
export async function listKetuaLembaga(villageId: number) {
  return db
    .select({ lembagaId: lembagaDesa.id, nama: residents.name })
    .from(lembagaDesa)
    .innerJoin(
      residents,
      and(eq(residents.villageId, villageId), eq(residents.id, lembagaDesa.ketuaResidentId)),
    )
    .where(eq(lembagaDesa.villageId, villageId));
}

export async function listMasterLembaga(villageId: number) {
  return db
    .select()
    .from(lembagaMaster)
    .where(eq(lembagaMaster.villageId, villageId))
    .orderBy(asc(lembagaMaster.urut), asc(lembagaMaster.nama));
}

export async function getMasterLembaga(villageId: number, id: number) {
  const [row] = await db
    .select()
    .from(lembagaMaster)
    .where(and(eq(lembagaMaster.villageId, villageId), eq(lembagaMaster.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getMasterLembagaByNama(
  villageId: number,
  nama: string,
  excludeId: number | null,
) {
  const [row] = await db
    .select({ id: lembagaMaster.id })
    .from(lembagaMaster)
    .where(
      and(
        eq(lembagaMaster.villageId, villageId),
        eq(lembagaMaster.nama, nama),
        excludeId ? ne(lembagaMaster.id, excludeId) : undefined,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function insertMasterLembaga(villageId: number, values: MasterLembagaValues) {
  await db.insert(lembagaMaster).values({ ...values, villageId });
}

export async function updateMasterLembaga(
  villageId: number,
  id: number,
  values: MasterLembagaValues,
) {
  await db
    .update(lembagaMaster)
    .set(values)
    .where(and(eq(lembagaMaster.villageId, villageId), eq(lembagaMaster.id, id)));
}

export async function deleteMasterLembaga(villageId: number, id: number) {
  await db
    .delete(lembagaMaster)
    .where(and(eq(lembagaMaster.villageId, villageId), eq(lembagaMaster.id, id)));
}

export async function countLembagaByMaster(villageId: number, masterId: number) {
  const [row] = await db
    .select({ jumlah: count() })
    .from(lembagaDesa)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.masterId, masterId)));
  return row?.jumlah ?? 0;
}

export async function listLembaga(villageId: number) {
  return db
    .select()
    .from(lembagaDesa)
    .where(eq(lembagaDesa.villageId, villageId))
    .orderBy(asc(lembagaDesa.urut), asc(lembagaDesa.id));
}

export async function listAnggota(villageId: number) {
  return db
    .select()
    .from(lembagaAnggota)
    .where(eq(lembagaAnggota.villageId, villageId))
    .orderBy(asc(lembagaAnggota.urut), asc(lembagaAnggota.id));
}

export async function getLembaga(villageId: number, id: number) {
  const [row] = await db
    .select({ id: lembagaDesa.id, logo: lembagaDesa.logo })
    .from(lembagaDesa)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getLembagaByKode(villageId: number, kode: string, excludeId: number | null) {
  const [row] = await db
    .select({ id: lembagaDesa.id })
    .from(lembagaDesa)
    .where(
      and(
        eq(lembagaDesa.villageId, villageId),
        eq(lembagaDesa.kode, kode),
        ...(excludeId ? [ne(lembagaDesa.id, excludeId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Cek apakah penduduk sudah terdaftar sebagai anggota lembaga yang sama. */
export async function getAnggotaLembagaByResident(
  villageId: number,
  lembagaId: number,
  residentId: number,
  excludeId: number | null,
) {
  const [row] = await db
    .select({ id: lembagaAnggota.id })
    .from(lembagaAnggota)
    .where(
      and(
        eq(lembagaAnggota.villageId, villageId),
        eq(lembagaAnggota.lembagaId, lembagaId),
        eq(lembagaAnggota.residentId, residentId),
        ...(excludeId ? [ne(lembagaAnggota.id, excludeId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getNomorAnggotaLembaga(
  villageId: number,
  lembagaId: number,
  nomorAnggota: string,
  excludeId: number | null,
) {
  const [row] = await db
    .select({ id: lembagaAnggota.id })
    .from(lembagaAnggota)
    .where(
      and(
        eq(lembagaAnggota.villageId, villageId),
        eq(lembagaAnggota.lembagaId, lembagaId),
        eq(lembagaAnggota.nomorAnggota, nomorAnggota),
        ...(excludeId ? [ne(lembagaAnggota.id, excludeId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listPendudukLembaga(villageId: number) {
  return db
    .select({ id: residents.id, nama: residents.name, nik: residents.nationalId })
    .from(residents)
    .where(and(eq(residents.villageId, villageId), eq(residents.lifeStatus, "alive")))
    .orderBy(asc(residents.name))
    .limit(2000);
}

export async function insertLembaga(villageId: number, values: LembagaValues) {
  await db.insert(lembagaDesa).values({ ...values, villageId });
}

export async function updateLembaga(villageId: number, id: number, values: LembagaValues) {
  await db
    .update(lembagaDesa)
    .set(values)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.id, id)));
}

export async function deleteLembaga(villageId: number, id: number) {
  await db
    .delete(lembagaDesa)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.id, id)));
}

export async function getAnggota(villageId: number, id: number) {
  const [row] = await db
    .select({ id: lembagaAnggota.id, foto: lembagaAnggota.foto })
    .from(lembagaAnggota)
    .where(and(eq(lembagaAnggota.villageId, villageId), eq(lembagaAnggota.id, id)))
    .limit(1);
  return row ?? null;
}

export async function listFotoAnggota(villageId: number, lembagaId: number) {
  return db
    .select({ foto: lembagaAnggota.foto })
    .from(lembagaAnggota)
    .where(and(eq(lembagaAnggota.villageId, villageId), eq(lembagaAnggota.lembagaId, lembagaId)));
}

export async function insertAnggota(villageId: number, values: AnggotaValues) {
  await db.insert(lembagaAnggota).values({ ...values, villageId });
}

export async function updateAnggota(villageId: number, id: number, values: AnggotaValues) {
  await db
    .update(lembagaAnggota)
    .set(values)
    .where(and(eq(lembagaAnggota.villageId, villageId), eq(lembagaAnggota.id, id)));
}

export async function deleteAnggota(villageId: number, id: number) {
  await db
    .delete(lembagaAnggota)
    .where(and(eq(lembagaAnggota.villageId, villageId), eq(lembagaAnggota.id, id)));
}

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

export async function listArea(villageId: number) {
  return db
    .select({
      id: areas.id,
      nama: areas.nama,
      desk: areas.desk,
      foto: areas.foto,
      enabled: areas.enabled,
      path: areas.path,
      refPolygon: areas.refPolygon,
      sortOrder: areas.sortOrder,
    })
    .from(areas)
    .where(eq(areas.villageId, villageId))
    .orderBy(asc(areas.sortOrder));
}

export async function listPolygon(villageId: number) {
  return db
    .select({
      id: polygons.id,
      nama: polygons.nama,
      color: polygons.color,
      enabled: polygons.enabled,
      sortOrder: polygons.sortOrder,
    })
    .from(polygons)
    .where(eq(polygons.villageId, villageId))
    .orderBy(asc(polygons.sortOrder));
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

export async function getArea(villageId: number, id: number) {
  const [row] = await db
    .select({ id: areas.id, foto: areas.foto })
    .from(areas)
    .where(and(eq(areas.villageId, villageId), eq(areas.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getPolygon(villageId: number, id: number) {
  const [row] = await db
    .select({ id: polygons.id })
    .from(polygons)
    .where(and(eq(polygons.villageId, villageId), eq(polygons.id, id)))
    .limit(1);
  return row ?? null;
}

export async function insertArea(villageId: number, values: AreaValues) {
  await db.insert(areas).values({ ...values, villageId });
}

export async function updateArea(villageId: number, id: number, values: AreaValues) {
  await db
    .update(areas)
    .set(values)
    .where(and(eq(areas.villageId, villageId), eq(areas.id, id)));
}

export async function deleteArea(villageId: number, id: number) {
  await db.delete(areas).where(and(eq(areas.villageId, villageId), eq(areas.id, id)));
}

export async function countAreaByLayer(villageId: number, layerId: number) {
  const [row] = await db
    .select({ id: areas.id })
    .from(areas)
    .where(and(eq(areas.villageId, villageId), eq(areas.refPolygon, layerId)))
    .limit(1);
  return row ?? null;
}

export async function insertPolygon(villageId: number, values: PolygonValues) {
  await db.insert(polygons).values({ ...values, villageId });
}

export async function updatePolygon(villageId: number, id: number, values: PolygonValues) {
  await db
    .update(polygons)
    .set(values)
    .where(and(eq(polygons.villageId, villageId), eq(polygons.id, id)));
}

export async function deletePolygon(villageId: number, id: number) {
  await db.delete(polygons).where(and(eq(polygons.villageId, villageId), eq(polygons.id, id)));
}

export async function getJabatanBySlug(villageId: number, slug: string) {
  const [row] = await db
    .select({ id: jabatanPerangkat.id })
    .from(jabatanPerangkat)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.slug, slug)))
    .limit(1);
  return row ?? null;
}

export type JabatanValues = {
  nama: string;
  slug: string;
  jenis: string;
  tupoksi: string | null;
  urut: number;
};

export async function insertJabatan(villageId: number, values: JabatanValues) {
  const [row] = await db
    .insert(jabatanPerangkat)
    .values({ ...values, villageId })
    .$returningId();
  return row?.id ?? 0;
}

export async function updateJabatan(villageId: number, id: number, values: JabatanValues) {
  await db
    .update(jabatanPerangkat)
    .set(values)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.id, id)));
}

export async function getJabatanDetail(villageId: number, id: number) {
  const [row] = await db
    .select({ id: jabatanPerangkat.id, jenis: jabatanPerangkat.jenis })
    .from(jabatanPerangkat)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.id, id)))
    .limit(1);
  return row ?? null;
}

export async function deleteJabatan(villageId: number, id: number) {
  await db
    .delete(jabatanPerangkat)
    .where(and(eq(jabatanPerangkat.villageId, villageId), eq(jabatanPerangkat.id, id)));
}

export async function countPerangkatByJabatan(villageId: number, jabatanId: number) {
  const [row] = await db
    .select({ id: perangkatDesa.id })
    .from(perangkatDesa)
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.jabatanId, jabatanId)))
    .limit(1);
  return row ?? null;
}

export async function getRiwayat(villageId: number, id: number) {
  const [row] = await db
    .select({ id: perangkatRiwayatJabatan.id })
    .from(perangkatRiwayatJabatan)
    .where(
      and(eq(perangkatRiwayatJabatan.villageId, villageId), eq(perangkatRiwayatJabatan.id, id)),
    )
    .limit(1);
  return row ?? null;
}

export async function insertRiwayat(villageId: number, values: RiwayatValues) {
  await db.insert(perangkatRiwayatJabatan).values({ ...values, villageId });
}

export async function updateRiwayat(villageId: number, id: number, values: RiwayatValues) {
  await db
    .update(perangkatRiwayatJabatan)
    .set(values)
    .where(
      and(eq(perangkatRiwayatJabatan.villageId, villageId), eq(perangkatRiwayatJabatan.id, id)),
    );
}

export async function deleteRiwayat(villageId: number, id: number) {
  await db
    .delete(perangkatRiwayatJabatan)
    .where(
      and(eq(perangkatRiwayatJabatan.villageId, villageId), eq(perangkatRiwayatJabatan.id, id)),
    );
}

export async function getDokumen(villageId: number, id: number) {
  const [row] = await db
    .select()
    .from(pemerintahanDokumen)
    .where(and(eq(pemerintahanDokumen.villageId, villageId), eq(pemerintahanDokumen.id, id)))
    .limit(1);
  return row ?? null;
}

export async function insertDokumen(villageId: number, values: DokumenValues) {
  await db.insert(pemerintahanDokumen).values({ ...values, villageId });
}

export async function updateDokumen(villageId: number, id: number, values: DokumenValues) {
  await db
    .update(pemerintahanDokumen)
    .set(values)
    .where(and(eq(pemerintahanDokumen.villageId, villageId), eq(pemerintahanDokumen.id, id)));
}

export async function deleteDokumen(villageId: number, id: number) {
  await db
    .delete(pemerintahanDokumen)
    .where(and(eq(pemerintahanDokumen.villageId, villageId), eq(pemerintahanDokumen.id, id)));
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

export async function getPerangkatStatus(villageId: number, id: number) {
  const [row] = await db
    .select({ status: perangkatDesa.status })
    .from(perangkatDesa)
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getLembagaStatusPublik(villageId: number, id: number) {
  const [row] = await db
    .select({ status: lembagaDesa.status, tampilPublik: lembagaDesa.tampilPublik })
    .from(lembagaDesa)
    .where(and(eq(lembagaDesa.villageId, villageId), eq(lembagaDesa.id, id)))
    .limit(1);
  return row ?? null;
}

export async function listLembagaPublik(villageId: number) {
  return db
    .select({
      id: lembagaDesa.id,
      nama: lembagaDesa.nama,
      kode: lembagaDesa.kode,
      jenis: lembagaDesa.jenis,
      logo: lembagaDesa.logo,
      deskripsi: lembagaDesa.deskripsi,
      tugasFungsi: lembagaDesa.tugasFungsi,
      dasarHukum: lembagaDesa.dasarHukum,
      masaBaktiMulai: lembagaDesa.masaBaktiMulai,
      masaBaktiSelesai: lembagaDesa.masaBaktiSelesai,
    })
    .from(lembagaDesa)
    .where(
      and(
        eq(lembagaDesa.villageId, villageId),
        eq(lembagaDesa.status, "aktif"),
        eq(lembagaDesa.tampilPublik, true),
      ),
    )
    .orderBy(asc(lembagaDesa.urut), asc(lembagaDesa.id));
}

export async function listAnggotaPublik(villageId: number) {
  return db
    .select({
      id: lembagaAnggota.id,
      lembagaId: lembagaAnggota.lembagaId,
      nama: lembagaAnggota.nama,
      nomorAnggota: lembagaAnggota.nomorAnggota,
      jabatan: lembagaAnggota.jabatan,
      foto: lembagaAnggota.foto,
      periode: lembagaAnggota.periode,
      periodeMulai: lembagaAnggota.periodeMulai,
      periodeSelesai: lembagaAnggota.periodeSelesai,
    })
    .from(lembagaAnggota)
    .where(
      and(
        eq(lembagaAnggota.villageId, villageId),
        eq(lembagaAnggota.aktif, true),
        eq(lembagaAnggota.tampilPublik, true),
      ),
    )
    .orderBy(asc(lembagaAnggota.urut), asc(lembagaAnggota.id));
}

export async function listDokumenPublikByLembaga(villageId: number) {
  return db
    .select({
      id: pemerintahanDokumen.id,
      lembagaId: pemerintahanDokumen.lembagaId,
      judul: pemerintahanDokumen.judul,
      nomor: pemerintahanDokumen.nomor,
      tanggal: pemerintahanDokumen.tanggal,
    })
    .from(pemerintahanDokumen)
    .where(
      and(eq(pemerintahanDokumen.villageId, villageId), eq(pemerintahanDokumen.tampilPublik, true)),
    );
}

export async function listRiwayatPublikByPerangkat(villageId: number, perangkatId: number) {
  return db
    .select({
      id: perangkatRiwayatJabatan.id,
      jabatan: perangkatRiwayatJabatan.jabatan,
      nomorSk: perangkatRiwayatJabatan.nomorSk,
      mulai: perangkatRiwayatJabatan.mulai,
      selesai: perangkatRiwayatJabatan.selesai,
      keterangan: perangkatRiwayatJabatan.keterangan,
    })
    .from(perangkatRiwayatJabatan)
    .where(
      and(
        eq(perangkatRiwayatJabatan.villageId, villageId),
        eq(perangkatRiwayatJabatan.perangkatId, perangkatId),
        eq(perangkatRiwayatJabatan.tampilPublik, true),
      ),
    );
}

export async function listDokumenPublikByPerangkat(villageId: number, perangkatId: number) {
  return db
    .select({
      id: pemerintahanDokumen.id,
      judul: pemerintahanDokumen.judul,
      nomor: pemerintahanDokumen.nomor,
      tanggal: pemerintahanDokumen.tanggal,
    })
    .from(pemerintahanDokumen)
    .where(
      and(
        eq(pemerintahanDokumen.villageId, villageId),
        eq(pemerintahanDokumen.perangkatId, perangkatId),
        eq(pemerintahanDokumen.tampilPublik, true),
      ),
    );
}
