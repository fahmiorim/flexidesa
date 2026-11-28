import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  CETAK_SURAT_RESOURCE,
  susunKatalogCetakSurat,
  type CetakSuratRow,
} from "@/features/pelayanan-persuratan/surat/domain/cetak-surat";
import {
  countSuratPerJenis,
  listJenisSurat,
} from "@/features/pelayanan-persuratan/surat/infrastructure/master-repository";
import { requirePermission } from "@/lib/dal";

interface CetakSuratPageData {
  rows: CetakSuratRow[];
  /** Jumlah jenis surat aktif yang dapat dicetak. */
  jumlahJenis: number;
  /** Jumlah surat yang sudah dibuat dari seluruh jenis surat. */
  jumlahSurat: number;
}

/**
 * Katalog Cetak Surat desa aktif.
 *
 * Hanya jenis surat aktif (tidak dinonaktifkan) yang ditampilkan. Jumlah
 * surat dihitung
 * sekali untuk semua jenis agar halaman tetap ringan.
 */
export async function getCetakSuratData(): Promise<CetakSuratPageData> {
  const user = await requirePermission(CETAK_SURAT_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const [jenis, jumlahPerJenis] = await Promise.all([
    listJenisSurat(villageId),
    countSuratPerJenis(villageId),
  ]);

  const rows = susunKatalogCetakSurat(jenis, jumlahPerJenis);

  return {
    rows,
    jumlahJenis: rows.length,
    jumlahSurat: rows.reduce((total, row) => total + row.tercetak, 0),
  };
}
