import "server-only";

/**
 * Use case buku tanah kas desa dan mutasinya.
 *
 * Memuat daftar, simpan/hapus aset dan mutasi, serta cetak/ekspor buku tanah
 * kas. Izin ditegakkan di use case; desa diambil dari sesi.
 */

import {
  bukuResmiCsv,
  namaBerkasBuku,
  tabelMutasiTanahKas,
  tabelTanahKas,
} from "@/features/administrasi-desa/bumindes/domain/buku-resmi";
import type {
  TanahKasInput,
  TanahKasMutasiInput,
} from "@/features/administrasi-desa/bumindes/domain/tanah-kas";
import {
  deleteBumindesTanahKas,
  deleteBumindesTanahKasMutasi,
  getBumindesTanahKas,
  insertBumindesTanahKas,
  insertBumindesTanahKasMutasi,
  listBumindesTanahKas,
  listBumindesTanahKasMutasi,
  updateBumindesTanahKas,
} from "@/features/administrasi-desa/bumindes/infrastructure/tanah-kas-repository";
import { getIdentitasByVillage } from "@/features/info-desa/desa/application/get-identitas";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { notFound } from "@/lib/errors";

export async function getDaftarTanahKasData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, mutasi] = await Promise.all([
    listBumindesTanahKas(villageId),
    listBumindesTanahKasMutasi(villageId),
  ]);
  return { items, mutasi };
}

export async function simpanTanahKasData(id: number | null, input: TanahKasInput) {
  const user = await requirePermission(RESOURCES.bumindes, id === null ? "create" : "update");
  const villageId = await resolveVillageId(user);
  const values = {
    nomorPersil: input.nomorPersil.trim(),
    asal: input.asal?.trim() ? input.asal.trim() : null,
    luas:
      input.luas === "" || input.luas === undefined || input.luas === null
        ? "0.00"
        : String(input.luas),
    lokasi: input.lokasi?.trim() ? input.lokasi.trim() : null,
    status: input.status?.trim() ? input.status.trim() : null,
    nilai:
      input.nilai === "" || input.nilai === undefined || input.nilai === null
        ? "0.00"
        : String(input.nilai),
    keterangan: input.keterangan?.trim() ? input.keterangan.trim() : null,
  };
  if (id) {
    await updateBumindesTanahKas(villageId, id, values);
    return { id };
  }
  const baru = await insertBumindesTanahKas(villageId, values);
  return { id: baru };
}

export async function hapusTanahKasData(id: number) {
  const user = await requirePermission(RESOURCES.bumindes, "delete");
  const villageId = await resolveVillageId(user);
  await deleteBumindesTanahKas(villageId, id);
}

export async function simpanMutasiTanahKasData(input: TanahKasMutasiInput) {
  const user = await requirePermission(RESOURCES.bumindes, "create");
  const villageId = await resolveVillageId(user);
  const persil = await getBumindesTanahKas(villageId, input.tanahKasId);
  if (!persil) throw notFound("Persil tanah kas tidak ditemukan.");
  const values = {
    tanahKasId: input.tanahKasId,
    tanggal: input.tanggal as string,
    jenis: input.jenis.trim(),
    uraian: input.uraian.trim(),
    luasPerubahan:
      input.luasPerubahan === "" ||
      input.luasPerubahan === undefined ||
      input.luasPerubahan === null
        ? null
        : String(input.luasPerubahan),
    nilaiPerubahan:
      input.nilaiPerubahan === "" ||
      input.nilaiPerubahan === undefined ||
      input.nilaiPerubahan === null
        ? null
        : String(input.nilaiPerubahan),
    keterangan: input.keterangan?.trim() ? input.keterangan.trim() : null,
  };
  const baru = await insertBumindesTanahKasMutasi(villageId, values);
  return { id: baru };
}

export async function hapusMutasiTanahKasData(id: number) {
  const user = await requirePermission(RESOURCES.bumindes, "delete");
  const villageId = await resolveVillageId(user);
  await deleteBumindesTanahKasMutasi(villageId, id);
}

export async function getBukuTanahKasCetakData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesTanahKas(villageId),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    nomorPersil: item.nomorPersil,
    asal: item.asal,
    luas: item.luas,
    lokasi: item.lokasi,
    status: item.status,
    nilai: item.nilai,
    keterangan: item.keterangan,
  }));
  return { desa, tabel: tabelTanahKas("E1", "BUKU TANAH KAS DESA", baris) };
}

export async function exportBukuTanahKasCsvData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [items, desa] = await Promise.all([
    listBumindesTanahKas(villageId),
    getIdentitasByVillage(villageId),
  ]);
  const baris = items.map((item, idx) => ({
    nomorUrut: idx + 1,
    nomorPersil: item.nomorPersil,
    asal: item.asal,
    luas: item.luas,
    lokasi: item.lokasi,
    status: item.status,
    nilai: item.nilai,
    keterangan: item.keterangan,
  }));
  const tabel = tabelTanahKas("E1", "BUKU TANAH KAS DESA", baris);
  return { csv: bukuResmiCsv(tabel), filename: namaBerkasBuku("E1", desa?.namaDesa ?? null) };
}

export async function getBukuMutasiTanahKasCetakData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [mutasi, desa, persilList] = await Promise.all([
    listBumindesTanahKasMutasi(villageId),
    getIdentitasByVillage(villageId),
    listBumindesTanahKas(villageId),
  ]);
  const map = new Map(persilList.map((p) => [p.id, p.nomorPersil]));
  const baris = mutasi.map((m, idx) => ({
    nomorUrut: idx + 1,
    tanggal: m.tanggal,
    jenis: m.jenis,
    uraian: `${map.get(m.tanahKasId) ? `[Persil ${map.get(m.tanahKasId)}] ` : ""}${m.uraian}`,
    luasPerubahan: m.luasPerubahan,
    nilaiPerubahan: m.nilaiPerubahan,
    keterangan: m.keterangan,
  }));
  return { desa, tabel: tabelMutasiTanahKas("E1", "BUKU TANAH KAS DESA (MUTASI)", baris) };
}

export async function exportBukuMutasiTanahKasCsvData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const [mutasi, desa, persilList] = await Promise.all([
    listBumindesTanahKasMutasi(villageId),
    getIdentitasByVillage(villageId),
    listBumindesTanahKas(villageId),
  ]);
  const map = new Map(persilList.map((p) => [p.id, p.nomorPersil]));
  const baris = mutasi.map((m, idx) => ({
    nomorUrut: idx + 1,
    tanggal: m.tanggal,
    jenis: m.jenis,
    uraian: `${map.get(m.tanahKasId) ? `[Persil ${map.get(m.tanahKasId)}] ` : ""}${m.uraian}`,
    luasPerubahan: m.luasPerubahan,
    nilaiPerubahan: m.nilaiPerubahan,
    keterangan: m.keterangan,
  }));
  const tabel = tabelMutasiTanahKas("E1", "BUKU TANAH KAS DESA (MUTASI)", baris);
  return {
    csv: bukuResmiCsv(tabel),
    filename: namaBerkasBuku("E1-MUTASI", desa?.namaDesa ?? null),
  };
}
