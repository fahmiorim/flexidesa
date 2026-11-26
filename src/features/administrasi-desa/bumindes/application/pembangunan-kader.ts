import "server-only";

/**
 * Use case buku pembangunan desa dan kader pemberdayaan masyarakat.
 *
 * Mencakup daftar, simpan/hapus, serta cetak/ekspor kedua buku. Izin ditegakkan
 * di use case; desa diambil dari sesi.
 */

import {
  bukuResmiCsv,
  namaBerkasBuku,
  tabelKader,
  tabelPembangunan,
} from "@/features/administrasi-desa/bumindes/domain/buku-resmi";
import type {
  KaderInput,
  PembangunanInput,
} from "@/features/administrasi-desa/bumindes/domain/pembangunan";
import {
  deleteBumindesKader,
  deleteBumindesPembangunan,
  insertBumindesKader,
  insertBumindesPembangunan,
  listBumindesKader,
  listBumindesPembangunan,
  updateBumindesKader,
  updateBumindesPembangunan,
} from "@/features/administrasi-desa/bumindes/infrastructure/pembangunan-repository";
import { getIdentitasByVillage } from "@/features/info-desa/desa/application/get-identitas";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

export async function getDaftarPembangunanData(tahun?: number) {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [pembangunan, kader] = await Promise.all([
    listBumindesPembangunan(villageId, tahun),
    listBumindesKader(villageId),
  ]);
  return { pembangunan, kader };
}

export async function simpanPembangunanData(id: number | null, input: PembangunanInput) {
  const user = await requirePermission(RESOURCES.bumindes, id === null ? "create" : "update");
  const villageId = await resolveVillageId(user);
  const values = {
    tahun: Number(input.tahun),
    namaKegiatan: input.namaKegiatan.trim(),
    lokasi: input.lokasi?.trim() ? input.lokasi.trim() : null,
    volume: input.volume?.trim() ? input.volume.trim() : null,
    sumberDana: input.sumberDana?.trim() ? input.sumberDana.trim() : null,
    biaya:
      input.biaya === "" || input.biaya === undefined || input.biaya === null
        ? "0.00"
        : String(input.biaya),
    pelaksana: input.pelaksana?.trim() ? input.pelaksana.trim() : null,
    status: input.status || "rencana",
    tanggalMulai: input.tanggalMulai || null,
    tanggalSelesai: input.tanggalSelesai || null,
    hasil: input.hasil?.trim() ? input.hasil.trim() : null,
    keterangan: input.keterangan?.trim() ? input.keterangan.trim() : null,
  };
  if (id) {
    await updateBumindesPembangunan(villageId, id, values);
    return { id };
  }
  const baru = await insertBumindesPembangunan(villageId, values);
  return { id: baru };
}

export async function hapusPembangunanData(id: number) {
  const user = await requirePermission(RESOURCES.bumindes, "delete");
  const villageId = await resolveVillageId(user);
  await deleteBumindesPembangunan(villageId, id);
}

export async function simpanKaderData(id: number | null, input: KaderInput) {
  const user = await requirePermission(RESOURCES.bumindes, id === null ? "create" : "update");
  const villageId = await resolveVillageId(user);
  const values = {
    nama: input.nama.trim(),
    jabatan: input.jabatan?.trim() ? input.jabatan.trim() : null,
    bidang: input.bidang?.trim() ? input.bidang.trim() : null,
    alamat: input.alamat?.trim() ? input.alamat.trim() : null,
    noHp: input.noHp?.trim() ? input.noHp.trim() : null,
    keterangan: input.keterangan?.trim() ? input.keterangan.trim() : null,
  };
  if (id) {
    await updateBumindesKader(villageId, id, values);
    return { id };
  }
  const baru = await insertBumindesKader(villageId, values);
  return { id: baru };
}

export async function hapusKaderData(id: number) {
  const user = await requirePermission(RESOURCES.bumindes, "delete");
  const villageId = await resolveVillageId(user);
  await deleteBumindesKader(villageId, id);
}

export async function getBukuPembangunanCetakData(tahun?: number) {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesPembangunan(villageId, tahun),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    tahun: item.tahun,
    namaKegiatan: item.namaKegiatan,
    lokasi: item.lokasi,
    volume: item.volume,
    sumberDana: item.sumberDana,
    biaya: item.biaya,
    pelaksana: item.pelaksana,
    status: item.status,
    tanggalMulai: item.tanggalMulai,
    tanggalSelesai: item.tanggalSelesai,
    hasil: item.hasil,
    keterangan: item.keterangan,
  }));
  return {
    desa,
    tabel: tabelPembangunan("P1", "BUKU PEMBANGUNAN", baris),
    subjudul: tahun ? `TAHUN ${tahun}` : undefined,
  };
}

export async function exportBukuPembangunanCsvData(tahun?: number) {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesPembangunan(villageId, tahun),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    tahun: item.tahun,
    namaKegiatan: item.namaKegiatan,
    lokasi: item.lokasi,
    volume: item.volume,
    sumberDana: item.sumberDana,
    biaya: item.biaya,
    pelaksana: item.pelaksana,
    status: item.status,
    tanggalMulai: item.tanggalMulai,
    tanggalSelesai: item.tanggalSelesai,
    hasil: item.hasil,
    keterangan: item.keterangan,
  }));
  const tabel = tabelPembangunan("P1", "BUKU PEMBANGUNAN", baris);
  return {
    csv: bukuResmiCsv(tabel),
    filename: namaBerkasBuku(tahun ? `P1-${tahun}` : "P1", desa?.namaDesa ?? null),
  };
}

export async function getBukuKaderCetakData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesKader(villageId),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    nama: item.nama,
    jabatan: item.jabatan,
    bidang: item.bidang,
    alamat: item.alamat,
    noHp: item.noHp,
    keterangan: item.keterangan,
  }));
  return { desa, tabel: tabelKader("K1", "BUKU KADER PEMBANGUNAN", baris) };
}

export async function exportBukuKaderCsvData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesKader(villageId),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    nama: item.nama,
    jabatan: item.jabatan,
    bidang: item.bidang,
    alamat: item.alamat,
    noHp: item.noHp,
    keterangan: item.keterangan,
  }));
  const tabel = tabelKader("K1", "BUKU KADER PEMBANGUNAN", baris);
  return { csv: bukuResmiCsv(tabel), filename: namaBerkasBuku("K1", desa?.namaDesa ?? null) };
}
