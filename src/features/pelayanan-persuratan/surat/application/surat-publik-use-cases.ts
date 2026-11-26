import "server-only";

import { parseDaftarLampiran } from "@/features/pelayanan-persuratan/surat/domain/surat";
import { listJenisSuratAktifPublik } from "@/features/pelayanan-persuratan/surat/infrastructure/master-repository";

export interface JenisSuratPublik {
  id: number;
  kode: string;
  nama: string;
  klasifikasi: string | null;
  butuhPenduduk: boolean;
  masaBerlakuBulan: number;
  satuanMasaBerlaku: string | null;
  /** Nama lampiran yang wajib disiapkan pemohon. */
  lampiran: string[];
}

/** Jenis surat yang dapat diverifikasi publik, tanpa data template internal. */
export async function listJenisSuratPublik(villageId: number): Promise<JenisSuratPublik[]> {
  const rows = await listJenisSuratAktifPublik(villageId);

  return rows.map((row) => ({
    id: row.id,
    kode: row.code,
    nama: row.name,
    klasifikasi: row.classificationName ?? null,
    butuhPenduduk: row.requiresResident,
    masaBerlakuBulan: row.validityMonths,
    satuanMasaBerlaku: row.satuanMasaBerlaku,
    lampiran: parseDaftarLampiran(row.lampiran),
  }));
}
