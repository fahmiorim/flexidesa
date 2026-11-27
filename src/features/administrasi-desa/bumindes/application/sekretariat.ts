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
import {
  listBumindesAgenda,
  listBumindesAparat,
  listBumindesPeraturan,
} from "@/features/administrasi-desa/bumindes/infrastructure/sekretariat-repository";
import { getIdentitasByVillage } from "@/features/info-desa/desa/application/get-identitas";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

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
