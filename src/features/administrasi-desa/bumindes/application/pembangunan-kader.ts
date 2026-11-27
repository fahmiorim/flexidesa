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
import {
  listBumindesKader,
  listBumindesPembangunan,
} from "@/features/administrasi-desa/bumindes/infrastructure/pembangunan-repository";
import { getIdentitasByVillage } from "@/features/info-desa/desa/application/get-identitas";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

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
