import "server-only";

import { getIdentitas } from "@/features/info-desa/desa/application/get-identitas";
import { type ListDtksParams } from "@/features/kependudukan/penduduk/domain/dtks";
import {
  buildDtksCsv,
  buildDtksRekapCsv,
  dtksFilename,
  dtksRekapFilename,
  hitungRekapDtks,
  type DtksRekap,
} from "@/features/kependudukan/penduduk/domain/dtks-berkas";
import { listDtksEkspor } from "@/features/kependudukan/penduduk/infrastructure/dtks-repository";
import { simpanUnggahanMedia as simpanBerkasLampiranDtks } from "@/features/media/infrastructure/media-storage";

/** Ambil daftar RTM yang belum terdaftar di DTKS untuk dialog "Data Baru". */

// --- Ekspor, laporan, dan impor -------------------------------------------

/**
 * Impor DTKS dari berkas: menautkan nomor RTM ke formulir DTKS.
 *
 * Baris dengan nomor RTM yang tidak ada di desa ini dilaporkan (bukan gagal
 * total) supaya satu baris salah tidak menggagalkan seluruh impor. RTM yang
 * sudah punya DTKS pada versi kuisioner ini dilewati agar impor idempoten.
 */
export { simpanBerkasLampiranDtks };

/** Rekapitulasi DTKS mengikuti filter daftar. */
export interface DtksRekapData {
  rekap: DtksRekap;
  namaDesa: string | null;
}

export async function getRekapDtksUseCase(
  villageId: number,
  params: ListDtksParams,
): Promise<DtksRekapData> {
  const [rows, desa] = await Promise.all([listDtksEkspor(villageId, params), getIdentitas()]);
  return { rekap: hitungRekapDtks(rows), namaDesa: desa?.namaDesa ?? null };
}

/** Ekspor daftar DTKS sebagai CSV. */
export async function exportDtksUseCase(
  villageId: number,
  params: ListDtksParams,
): Promise<{ csv: string; filename: string }> {
  const [rows, desa] = await Promise.all([listDtksEkspor(villageId, params), getIdentitas()]);
  const namaDesa = desa?.namaDesa ?? null;

  return { csv: buildDtksCsv({ namaDesa, rows }), filename: dtksFilename(namaDesa) };
}

/** Ekspor rekapitulasi DTKS sebagai CSV. */
export async function exportRekapDtksUseCase(
  villageId: number,
  params: ListDtksParams,
): Promise<{ csv: string; filename: string }> {
  const { rekap, namaDesa } = await getRekapDtksUseCase(villageId, params);

  return {
    csv: buildDtksRekapCsv({ namaDesa, rekap }),
    filename: dtksRekapFilename(namaDesa),
  };
}

// --- Lampiran --------------------------------------------------------------

// --- Pengaturan program -----------------------------------------------------
