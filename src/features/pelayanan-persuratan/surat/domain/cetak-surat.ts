import { parseSyaratIds } from "@/features/pelayanan-persuratan/surat/domain/isian";
import {
  parseDaftarLampiran,
  type JenisSuratDTO,
} from "@/features/pelayanan-persuratan/surat/domain/surat";

/**
 * Domain Cetak Surat.
 *
 * Meniru menu OpenSID Layanan Surat → Cetak Surat (`Surat@index`): katalog
 * jenis surat aktif yang menjadi titik awal pembuatan dan pencetakan surat,
 * lengkap dengan kode/klasifikasi dan jumlah surat yang sudah dibuat.
 */

/** Slug modul sekaligus resource izin (lihat template tenant). */
export const CETAK_SURAT_RESOURCE = "cetak-surat";

/** Satu baris katalog surat siap cetak. */
export interface CetakSuratRow {
  id: number;
  /** Kode/klasifikasi surat, mis. `474.1`. */
  code: string;
  name: string;
  /** Nama klasifikasi surat bila ada. */
  classificationName: string | null;
  /** Jumlah persyaratan dokumen yang melekat pada jenis surat ini. */
  jumlahSyarat: number;
  /**
   * Daftar lampiran yang menyertai surat (parity `lampiran` OpenSID).
   * Ditampilkan agar petugas tahu dokumen apa yang harus dilampirkan.
   */
  lampiran: string[];
  /** Jumlah surat yang sudah pernah dibuat untuk jenis surat ini. */
  tercetak: number;
}

/** Susun baris katalog dari jenis surat aktif dan hitungan surat per jenis. */
export function susunKatalogCetakSurat(
  jenis: readonly JenisSuratDTO[],
  jumlahPerJenis: ReadonlyMap<number, number>,
): CetakSuratRow[] {
  return jenis
    .filter((item) => item.isActive)
    .map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      classificationName: item.classificationName,
      jumlahSyarat: parseSyaratIds(item.syaratSurat).length,
      lampiran: parseDaftarLampiran(item.lampiran),
      tercetak: jumlahPerJenis.get(item.id) ?? 0,
    }));
}

/**
 * Saring katalog menurut kata kunci.
 *
 * Mencocokkan nama surat, kode, dan nama klasifikasi; kata kunci kosong
 * mengembalikan seluruh katalog.
 */
export function cariCetakSurat(rows: readonly CetakSuratRow[], kataKunci: string): CetakSuratRow[] {
  const kunci = kataKunci.trim().toLocaleLowerCase("id-ID");
  if (kunci === "") return [...rows];

  return rows.filter(
    (row) =>
      row.name.toLocaleLowerCase("id-ID").includes(kunci) ||
      row.code.toLocaleLowerCase("id-ID").includes(kunci) ||
      (row.classificationName ?? "").toLocaleLowerCase("id-ID").includes(kunci) ||
      row.lampiran.some((item) => item.toLocaleLowerCase("id-ID").includes(kunci)),
  );
}
