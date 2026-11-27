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
import {
  listBumindesTanahKas,
  listBumindesTanahKasMutasi,
} from "@/features/administrasi-desa/bumindes/infrastructure/tanah-kas-repository";
import { getIdentitasByVillage } from "@/features/info-desa/desa/application/get-identitas";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

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
