import "server-only";

/**
 * Use case buku sekretariat: peraturan desa, aparat pemerintah desa, dan agenda
 * kegiatan. Mencakup daftar, simpan/hapus, serta cetak/ekspor. Izin ditegakkan
 * di use case; desa diambil dari sesi.
 */

import {
  bukuResmiCsv,
  namaBerkasBuku,
  tabelAgenda,
  tabelAparat,
  tabelPeraturan,
} from "@/features/administrasi-desa/bumindes/domain/buku-resmi";
import type {
  AgendaInput,
  AparatInput,
  PeraturanInput,
} from "@/features/administrasi-desa/bumindes/domain/sekretariat";
import {
  deleteBumindesAgenda,
  deleteBumindesAparat,
  deleteBumindesPeraturan,
  insertBumindesAgenda,
  insertBumindesAparat,
  insertBumindesPeraturan,
  listBumindesAgenda,
  listBumindesAparat,
  listBumindesPeraturan,
  updateBumindesAgenda,
  updateBumindesAparat,
  updateBumindesPeraturan,
} from "@/features/administrasi-desa/bumindes/infrastructure/sekretariat-repository";
import { getIdentitasByVillage } from "@/features/info-desa/desa/application/get-identitas";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

export async function getDaftarSekretariatData(jenis?: string) {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [peraturan, aparat, agenda] = await Promise.all([
    listBumindesPeraturan(villageId),
    listBumindesAparat(villageId),
    listBumindesAgenda(villageId, jenis),
  ]);
  return { peraturan, aparat, agenda };
}

export async function simpanPeraturanData(id: number | null, input: PeraturanInput) {
  const user = await requirePermission(RESOURCES.bumindes, id === null ? "create" : "update");
  const villageId = await resolveVillageId(user);
  const values = {
    jenis: input.jenis || "peraturan_desa",
    nomor: input.nomor.trim(),
    tahun:
      input.tahun === "" || input.tahun === undefined || input.tahun === null
        ? null
        : Number(input.tahun),
    tentang: input.tentang.trim(),
    tanggalDitetapkan: input.tanggalDitetapkan || null,
    tanggalDiundangkan: input.tanggalDiundangkan || null,
    keterangan: input.keterangan?.trim() ? input.keterangan.trim() : null,
  };
  if (id) {
    await updateBumindesPeraturan(villageId, id, values);
    return { id };
  }
  const baru = await insertBumindesPeraturan(villageId, values);
  return { id: baru };
}

export async function hapusPeraturanData(id: number) {
  const user = await requirePermission(RESOURCES.bumindes, "delete");
  const villageId = await resolveVillageId(user);
  await deleteBumindesPeraturan(villageId, id);
}

export async function simpanAparatData(id: number | null, input: AparatInput) {
  const user = await requirePermission(RESOURCES.bumindes, id === null ? "create" : "update");
  const villageId = await resolveVillageId(user);
  const values = {
    nama: input.nama.trim(),
    nip: input.nip?.trim() ? input.nip.trim() : null,
    jabatan: input.jabatan.trim(),
    tempatLahir: input.tempatLahir?.trim() ? input.tempatLahir.trim() : null,
    tanggalLahir: input.tanggalLahir || null,
    pendidikan: input.pendidikan?.trim() ? input.pendidikan.trim() : null,
    nomorSkPengangkatan: input.nomorSkPengangkatan?.trim()
      ? input.nomorSkPengangkatan.trim()
      : null,
    tanggalPengangkatan: input.tanggalPengangkatan || null,
    nomorSkPemberhentian: input.nomorSkPemberhentian?.trim()
      ? input.nomorSkPemberhentian.trim()
      : null,
    tanggalPemberhentian: input.tanggalPemberhentian || null,
    keterangan: input.keterangan?.trim() ? input.keterangan.trim() : null,
  };
  if (id) {
    await updateBumindesAparat(villageId, id, values);
    return { id };
  }
  const baru = await insertBumindesAparat(villageId, values);
  return { id: baru };
}

export async function hapusAparatData(id: number) {
  const user = await requirePermission(RESOURCES.bumindes, "delete");
  const villageId = await resolveVillageId(user);
  await deleteBumindesAparat(villageId, id);
}

export async function simpanAgendaData(id: number | null, input: AgendaInput) {
  const user = await requirePermission(RESOURCES.bumindes, id === null ? "create" : "update");
  const villageId = await resolveVillageId(user);
  const values = {
    jenis: input.jenis || "masuk",
    tanggal: input.tanggal as string,
    nomorSurat: input.nomorSurat?.trim() ? input.nomorSurat.trim() : null,
    asalTujuan: input.asalTujuan?.trim() ? input.asalTujuan.trim() : null,
    perihal: input.perihal.trim(),
    keterangan: input.keterangan?.trim() ? input.keterangan.trim() : null,
  };
  if (id) {
    await updateBumindesAgenda(villageId, id, values);
    return { id };
  }
  const baru = await insertBumindesAgenda(villageId, values);
  return { id: baru };
}

export async function hapusAgendaData(id: number) {
  const user = await requirePermission(RESOURCES.bumindes, "delete");
  const villageId = await resolveVillageId(user);
  await deleteBumindesAgenda(villageId, id);
}

export async function getBukuPeraturanCetakData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesPeraturan(villageId),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    jenis: item.jenis === "keputusan_kades" ? "Keputusan Kades" : "Peraturan Desa",
    nomor: item.nomor,
    tahun: item.tahun,
    tentang: item.tentang,
    tanggalDitetapkan: item.tanggalDitetapkan,
    tanggalDiundangkan: item.tanggalDiundangkan,
    keterangan: item.keterangan,
  }));
  return {
    desa,
    tabel: tabelPeraturan("A1", "BUKU PERATURAN DESA DAN KEPUTUSAN KEPALA DESA", baris),
  };
}

export async function exportBukuPeraturanCsvData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesPeraturan(villageId),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    jenis: item.jenis === "keputusan_kades" ? "Keputusan Kades" : "Peraturan Desa",
    nomor: item.nomor,
    tahun: item.tahun,
    tentang: item.tentang,
    tanggalDitetapkan: item.tanggalDitetapkan,
    tanggalDiundangkan: item.tanggalDiundangkan,
    keterangan: item.keterangan,
  }));
  const tabel = tabelPeraturan("A1", "BUKU PERATURAN DESA DAN KEPUTUSAN KEPALA DESA", baris);
  return { csv: bukuResmiCsv(tabel), filename: namaBerkasBuku("A1", desa?.namaDesa ?? null) };
}

export async function getBukuAparatCetakData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesAparat(villageId),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    nama: item.nama,
    nip: item.nip,
    jabatan: item.jabatan,
    tempatLahir: item.tempatLahir,
    tanggalLahir: item.tanggalLahir,
    pendidikan: item.pendidikan,
    nomorSkPengangkatan: item.nomorSkPengangkatan,
    tanggalPengangkatan: item.tanggalPengangkatan,
    nomorSkPemberhentian: item.nomorSkPemberhentian,
    tanggalPemberhentian: item.tanggalPemberhentian,
    keterangan: item.keterangan,
  }));
  return { desa, tabel: tabelAparat("A4", "BUKU APARAT PEMERINTAH DESA", baris) };
}

export async function exportBukuAparatCsvData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesAparat(villageId),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    nama: item.nama,
    nip: item.nip,
    jabatan: item.jabatan,
    tempatLahir: item.tempatLahir,
    tanggalLahir: item.tanggalLahir,
    pendidikan: item.pendidikan,
    nomorSkPengangkatan: item.nomorSkPengangkatan,
    tanggalPengangkatan: item.tanggalPengangkatan,
    nomorSkPemberhentian: item.nomorSkPemberhentian,
    tanggalPemberhentian: item.tanggalPemberhentian,
    keterangan: item.keterangan,
  }));
  const tabel = tabelAparat("A4", "BUKU APARAT PEMERINTAH DESA", baris);
  return { csv: bukuResmiCsv(tabel), filename: namaBerkasBuku("A4", desa?.namaDesa ?? null) };
}

export async function getBukuAgendaCetakData(jenis?: string) {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  // Cetak tanpa parameter adalah Buku Agenda (surat masuk), bukan gabungan.
  const jenisBuku = jenis === "keluar" ? "keluar" : "masuk";
  const [items, desa] = await Promise.all([
    listBumindesAgenda(villageId, jenisBuku),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    jenis: item.jenis === "keluar" ? "Surat Keluar" : "Surat Masuk",
    tanggal: item.tanggal,
    nomorSurat: item.nomorSurat,
    asalTujuan: item.asalTujuan,
    perihal: item.perihal,
    keterangan: item.keterangan,
  }));
  const namaBuku = jenisBuku === "keluar" ? "BUKU EKSPEDISI" : "BUKU AGENDA";
  const kode = jenisBuku === "keluar" ? "A7" : "A6";
  return { desa, tabel: tabelAgenda(kode, namaBuku, baris) };
}

export async function exportBukuAgendaCsvData(jenis?: string) {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  // Ekspor tanpa parameter mengikuti Buku Agenda (surat masuk).
  const jenisBuku = jenis === "keluar" ? "keluar" : "masuk";
  const [items, desa] = await Promise.all([
    listBumindesAgenda(villageId, jenisBuku),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    jenis: item.jenis === "keluar" ? "Surat Keluar" : "Surat Masuk",
    tanggal: item.tanggal,
    nomorSurat: item.nomorSurat,
    asalTujuan: item.asalTujuan,
    perihal: item.perihal,
    keterangan: item.keterangan,
  }));
  const namaBuku = jenisBuku === "keluar" ? "BUKU EKSPEDISI" : "BUKU AGENDA";
  const kode = jenisBuku === "keluar" ? "A7" : "A6";
  const tabel = tabelAgenda(kode, namaBuku, baris);
  return { csv: bukuResmiCsv(tabel), filename: namaBerkasBuku(kode, desa?.namaDesa ?? null) };
}
