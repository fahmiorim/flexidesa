import "server-only";

/**
 * Query profil desa, perangkat, layanan, dan kontak publik.
 *
 * Seluruh fungsi wajib menerima `villageId` dari host sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  jabatanPerangkat,
  layananPublik,
  pengaturanDesa,
  perangkatDesa,
  profilDesa,
} from "@/db/schema";

interface ProfilRingkas {
  visi: string | null;
  misi: string | null;
  sejarah: string | null;
  sambutan: string | null;
  koordinat: string | null;
  luasWilayah: string | null;
  batasUtara: string | null;
  batasSelatan: string | null;
  batasTimur: string | null;
  batasBarat: string | null;
  ketinggian: string | null;
  suhuRataRata: string | null;
  curahHujan: string | null;
  topografi: string | null;
  batasDesa: string | null;
  tahunBerdiri: number | null;
  tujuanPembangunan: string | null;
  nilaiDasar: string | null;
  arahKebijakan: string | null;
}

export async function getProfilDesa(villageId: number): Promise<ProfilRingkas | null> {
  const [row] = await db
    .select({
      visi: profilDesa.visi,
      misi: profilDesa.misi,
      sejarah: profilDesa.sejarah,
      sambutan: profilDesa.sambutan,
      koordinat: profilDesa.koordinat,
      luasWilayah: profilDesa.luasWilayah,
      batasUtara: profilDesa.batasUtara,
      batasSelatan: profilDesa.batasSelatan,
      batasTimur: profilDesa.batasTimur,
      batasBarat: profilDesa.batasBarat,
      ketinggian: profilDesa.ketinggian,
      suhuRataRata: profilDesa.suhuRataRata,
      curahHujan: profilDesa.curahHujan,
      topografi: profilDesa.topografi,
      batasDesa: profilDesa.batasDesa,
      tahunBerdiri: profilDesa.tahunBerdiri,
      tujuanPembangunan: profilDesa.tujuanPembangunan,
      nilaiDasar: profilDesa.nilaiDasar,
      arahKebijakan: profilDesa.arahKebijakan,
    })
    .from(profilDesa)
    .where(eq(profilDesa.villageId, villageId))
    .limit(1);

  return row ?? null;
}

/* -------------------------------------------------------------- perangkat */

interface PerangkatRingkas {
  id: number;
  nama: string;
  gelarDepan: string | null;
  gelarBelakang: string | null;
  jabatan: string | null;
  nip: string | null;
  jenisKelamin: string | null;
  foto: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  urut: number;
  periode: string | null;
  pendidikan: string | null;
  atasanId: number | null;
}

export async function listPerangkatDesa(villageId: number): Promise<PerangkatRingkas[]> {
  return db
    .select({
      id: perangkatDesa.id,
      nama: perangkatDesa.nama,
      gelarDepan: perangkatDesa.gelarDepan,
      gelarBelakang: perangkatDesa.gelarBelakang,
      jabatan: jabatanPerangkat.nama,
      nip: perangkatDesa.nip,
      jenisKelamin: perangkatDesa.jenisKelamin,
      foto: perangkatDesa.foto,
      tempatLahir: perangkatDesa.tempatLahir,
      tanggalLahir: perangkatDesa.tanggalLahir,
      urut: perangkatDesa.urut,
      periode: perangkatDesa.periode,
      pendidikan: perangkatDesa.pendidikan,
      atasanId: perangkatDesa.atasanId,
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
    .orderBy(asc(perangkatDesa.urut), asc(perangkatDesa.id));
}

/* --------------------------------------------------------------- dokumen */

/** Katalog layanan tambahan milik tenant yang aktif di situs publik. */
export async function listLayananDesaPublik(villageId: number) {
  return db
    .select({
      id: layananPublik.id,
      nama: layananPublik.nama,
      kategori: layananPublik.kategori,
      deskripsi: layananPublik.deskripsi,
      persyaratan: layananPublik.persyaratan,
      estimasiHari: layananPublik.estimasiHari,
      biaya: layananPublik.biaya,
      metode: layananPublik.metode,
    })
    .from(layananPublik)
    .where(and(eq(layananPublik.villageId, villageId), eq(layananPublik.aktif, true)))
    .orderBy(asc(layananPublik.nama));
}

/** Nilai mentah pengaturan kontak publik (`pengaturan.kontak`) satu desa. */
export async function getPengaturanKontakMentah(villageId: number): Promise<string | null> {
  const [row] = await db
    .select({ nilai: pengaturanDesa.nilai })
    .from(pengaturanDesa)
    .where(
      and(eq(pengaturanDesa.villageId, villageId), eq(pengaturanDesa.kunci, "pengaturan.kontak")),
    )
    .limit(1);
  return row?.nilai ?? null;
}
