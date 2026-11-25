import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { jabatanPerangkat, perangkatDesa, profilDesa, villages } from "@/db/schema";
import {
  gabungKontakProfil,
  kodeWilayahDariKodeDesa,
  SEBUTAN_DESA_DEFAULT,
  type ProfilDesa,
  type SebutanDesa,
} from "@/features/identitas-desa/domain/identitas-desa";
import { namaLengkapKepalaDesa } from "@/features/identitas-desa/domain/kepala-desa";
import {
  bacaNilaiPengaturan,
  hapusNilaiPengaturan,
  simpanNilaiPengaturan,
} from "@/features/pengaturan/infrastructure/pengaturan-nilai-repository";

const KUNCI_SEBUTAN = "pengaturan.sebutan";
const KUNCI_FAVICON = "pengaturan.favicon";
const KUNCI_KONTAK = "pengaturan.kontak";

/** Kepala desa aktif dari data perangkat, atau `null` bila belum ada. */
export async function bacaKepalaDesaAktif(villageId: number) {
  const [row] = await db
    .select({
      nama: perangkatDesa.nama,
      gelarDepan: perangkatDesa.gelarDepan,
      gelarBelakang: perangkatDesa.gelarBelakang,
      nip: perangkatDesa.nip,
    })
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
    .orderBy(asc(perangkatDesa.urut), asc(perangkatDesa.id))
    .limit(1);
  if (!row) return null;
  return { nama: namaLengkapKepalaDesa(row), nip: row.nip };
}

/** Selaraskan cache nama/NIP kepala desa pada `villages` dengan perangkat. */
export async function sinkronkanKepalaDesa(villageId: number): Promise<void> {
  const kepalaDesa = await bacaKepalaDesaAktif(villageId);
  await db
    .update(villages)
    .set({
      headName: kepalaDesa?.nama ?? null,
      headNip: kepalaDesa?.nip ?? null,
    })
    .where(eq(villages.id, villageId));
}

export async function bacaIdentitasDesa(villageId: number) {
  const [[row], kepalaDesa] = await Promise.all([
    db
      .select({
        id: villages.id,
        namaDesa: villages.name,
        kodeDesa: villages.code,
        kodeBps: villages.bpsCode,
        namaKecamatan: villages.district,
        kodeKecamatan: villages.districtCode,
        namaCamat: villages.camatName,
        nipCamat: villages.camatNip,
        namaKabupaten: villages.regency,
        kodeKabupaten: villages.regencyCode,
        namaPropinsi: villages.province,
        kodePropinsi: villages.provinceCode,
        kodePos: villages.postalCode,
        alamat: villages.officeAddress,
        email: villages.email,
        telepon: villages.phone,
        website: villages.website,
        logo: villages.logo,
        fotoKantor: villages.officePhoto,
        nomorOperator: villages.operatorPhone,
        kontakPemberitahuanNama: villages.contactName,
        kontakPemberitahuanTelepon: villages.contactPhone,
        kontakPemberitahuanJabatan: villages.contactPosition,
        namaKepalaDesa: villages.headName,
        nipKepalaDesa: villages.headNip,
        updatedAt: villages.updatedAt,
      })
      .from(villages)
      .where(eq(villages.id, villageId))
      .limit(1),
    bacaKepalaDesaAktif(villageId),
  ]);
  if (!row) return null;
  // Data perangkat adalah sumber kebenaran; nilai lama hanya dipakai sebagai
  // cadangan saat desa belum memiliki kepala desa aktif di perangkat.
  return {
    ...row,
    namaKepalaDesa: kepalaDesa ? kepalaDesa.nama : row.namaKepalaDesa,
    nipKepalaDesa: kepalaDesa ? kepalaDesa.nip : row.nipKepalaDesa,
  };
}

export async function bacaProfilDesa(villageId: number) {
  const [row] = await db
    .select()
    .from(profilDesa)
    .where(eq(profilDesa.villageId, villageId))
    .limit(1);
  return row ?? null;
}

/**
 * Kolom kontak pada `villages` yang hanya ditulis bila field dikirim.
 * `undefined` berarti "jangan ubah"; string kosong berarti menghapus nilai.
 */
function kolomKontak(d: ProfilDesa): Partial<typeof villages.$inferInsert> {
  const kolom: Partial<typeof villages.$inferInsert> = {};
  if (d.email !== undefined) kolom.email = d.email || null;
  if (d.telepon !== undefined) kolom.phone = d.telepon || null;
  if (d.nomorOperator !== undefined) kolom.operatorPhone = d.nomorOperator || null;
  if (d.website !== undefined) kolom.website = d.website || null;
  if (d.kontakPemberitahuanNama !== undefined)
    kolom.contactName = d.kontakPemberitahuanNama || null;
  if (d.kontakPemberitahuanTelepon !== undefined)
    kolom.contactPhone = d.kontakPemberitahuanTelepon || null;
  if (d.kontakPemberitahuanJabatan !== undefined)
    kolom.contactPosition = d.kontakPemberitahuanJabatan || null;
  return kolom;
}

export async function simpanProfilDesa(villageId: number, d: ProfilDesa): Promise<void> {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        districtCode: villages.districtCode,
        regencyCode: villages.regencyCode,
        provinceCode: villages.provinceCode,
      })
      .from(villages)
      .where(eq(villages.id, villageId))
      .limit(1);
    const kodeWilayah = kodeWilayahDariKodeDesa(d.kodeDesa);
    await tx
      .update(villages)
      .set({
        name: d.namaDesa,
        code: d.kodeDesa || null,
        bpsCode: d.kodeBps || null,
        district: d.namaKecamatan || null,
        // Kode wilayah diturunkan ulang dari kode desa agar tidak tertinggal
        // saat kode desa diubah; data platform dipakai bila kode belum valid.
        districtCode: kodeWilayah?.kecamatan || current?.districtCode || null,
        camatName: d.namaCamat || null,
        camatNip: d.nipCamat || null,
        regency: d.namaKabupaten || null,
        regencyCode: kodeWilayah?.kabupaten || current?.regencyCode || null,
        province: d.namaPropinsi || null,
        provinceCode: kodeWilayah?.provinsi || current?.provinceCode || null,
        postalCode: d.kodePos || null,
        // Nama/NIP kepala desa berasal dari perangkat_desa dan disinkronkan
        // saat data perangkat berubah; jangan menerima input manual di sini.
        officeAddress: d.alamat || null,
        ...kolomKontak(d),
      })
      .where(eq(villages.id, villageId));
    const profil = {
      visi: d.visi || null,
      misi: d.misi || null,
      sejarah: d.sejarah || null,
      sambutan: d.sambutan || null,
      koordinat: d.koordinat || null,
      mapTipe: d.mapTipe || null,
      luasWilayah: d.luasWilayah || null,
      batasUtara: d.batasUtara || null,
      batasSelatan: d.batasSelatan || null,
      batasTimur: d.batasTimur || null,
      batasBarat: d.batasBarat || null,
      ketinggian: d.ketinggian || null,
      suhuRataRata: d.suhuRataRata || null,
      curahHujan: d.curahHujan || null,
      topografi: d.topografi || null,
      jenisTanah: d.jenisTanah || null,
      sumberDayaAlam: d.sumberDayaAlam || null,
      floraFauna: d.floraFauna || null,
      rawanBencana: d.rawanBencana || null,
      kearifanLokal: d.kearifanLokal || null,
      jenisJaringan: d.jenisJaringan || null,
      providerInternet: d.providerInternet || null,
      cakupanWilayah: d.cakupanWilayah || null,
      kecepatanInternet: d.kecepatanInternet || null,
      aksesPublik: d.aksesPublik || null,
      statusDesa: d.statusDesa || null,
      lembagaAdat: d.lembagaAdat || null,
      wilayahAdat: d.wilayahAdat || null,
      peraturanAdat: d.peraturanAdat || null,
      regulasiPenetapanKampungAdat: d.regulasiPenetapanKampungAdat || null,
      batasDesa: d.batasDesa || null,
    };
    await tx
      .insert(profilDesa)
      .values({ villageId, ...profil })
      .onDuplicateKeyUpdate({ set: profil });
  });
  // Halaman kontak publik membaca alamat/koordinat dari pengaturan kontak lebih
  // dulu. Sinkronkan nilai yang sama agar perubahan di Identitas Desa langsung
  // tampil tanpa membuat data ganda yang berbeda.
  const kontak = await bacaNilaiPengaturan(villageId, KUNCI_KONTAK);
  const kontakLama =
    typeof kontak === "object" && kontak !== null && !Array.isArray(kontak)
      ? (kontak as Record<string, unknown>)
      : {};
  await simpanNilaiPengaturan(
    villageId,
    KUNCI_KONTAK,
    gabungKontakProfil(kontakLama, {
      email: d.email,
      telepon: d.telepon,
      nomorOperator: d.nomorOperator,
      website: d.website,
      kontakPemberitahuanNama: d.kontakPemberitahuanNama,
      kontakPemberitahuanTelepon: d.kontakPemberitahuanTelepon,
      kontakPemberitahuanJabatan: d.kontakPemberitahuanJabatan,
      alamat: d.alamat,
      koordinat: d.koordinat,
    }),
  );
}

export async function bacaSebutanDesa(villageId: number): Promise<SebutanDesa> {
  const nilai = await bacaNilaiPengaturan(villageId, KUNCI_SEBUTAN);
  if (typeof nilai !== "object" || nilai === null || Array.isArray(nilai)) {
    return SEBUTAN_DESA_DEFAULT;
  }
  return { ...SEBUTAN_DESA_DEFAULT, ...(nilai as Partial<SebutanDesa>) };
}

export async function simpanSebutanDesa(villageId: number, d: SebutanDesa): Promise<void> {
  await simpanNilaiPengaturan(villageId, KUNCI_SEBUTAN, d);
}

export async function bacaLogoDesa(villageId: number): Promise<string | null> {
  const [row] = await db
    .select({ logo: villages.logo })
    .from(villages)
    .where(eq(villages.id, villageId))
    .limit(1);
  return row?.logo ?? null;
}

export async function simpanLogoDesa(villageId: number, logo: string | null): Promise<void> {
  await db.update(villages).set({ logo }).where(eq(villages.id, villageId));
}

export async function bacaFotoKantorDesa(villageId: number): Promise<string | null> {
  const [row] = await db
    .select({ fotoKantor: villages.officePhoto })
    .from(villages)
    .where(eq(villages.id, villageId))
    .limit(1);
  return row?.fotoKantor ?? null;
}

export async function simpanFotoKantorDesa(
  villageId: number,
  fotoKantor: string | null,
): Promise<void> {
  await db.update(villages).set({ officePhoto: fotoKantor }).where(eq(villages.id, villageId));
}

export async function bacaFaviconDesa(villageId: number): Promise<string | null> {
  const nilai = await bacaNilaiPengaturan(villageId, KUNCI_FAVICON);
  return typeof nilai === "string" ? nilai : null;
}

export async function simpanFaviconDesa(villageId: number, path: string | null): Promise<void> {
  if (path === null) {
    await hapusNilaiPengaturan(villageId, KUNCI_FAVICON);
    return;
  }
  await simpanNilaiPengaturan(villageId, KUNCI_FAVICON, path);
}

export async function bacaStrukturAdat(villageId: number): Promise<string | null> {
  const [row] = await db
    .select({ path: profilDesa.strukturAdat })
    .from(profilDesa)
    .where(eq(profilDesa.villageId, villageId))
    .limit(1);
  return row?.path ?? null;
}

export async function simpanStrukturAdat(villageId: number, path: string | null): Promise<void> {
  await db
    .insert(profilDesa)
    .values({ villageId, strukturAdat: path })
    .onDuplicateKeyUpdate({ set: { strukturAdat: path } });
}

export async function bacaDokumenRegulasiAdat(villageId: number): Promise<string | null> {
  const [row] = await db
    .select({ path: profilDesa.dokumenRegulasiPenetapanKampungAdat })
    .from(profilDesa)
    .where(eq(profilDesa.villageId, villageId))
    .limit(1);
  return row?.path ?? null;
}

export async function simpanDokumenRegulasiAdat(
  villageId: number,
  path: string | null,
): Promise<void> {
  await db
    .insert(profilDesa)
    .values({ villageId, dokumenRegulasiPenetapanKampungAdat: path })
    .onDuplicateKeyUpdate({ set: { dokumenRegulasiPenetapanKampungAdat: path } });
}
