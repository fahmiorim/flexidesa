import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Penyimpanan berkas Laporan Penduduk di disk lokal.
 *
 * Dipisah dari `keuangan/infrastructure/laporan-storage` agar arsip statistik
 * memiliki ruangnya sendiri (`storage/laporan-penduduk/<villageId>/`). Jalur
 * yang dicatat di basis data selalu relatif terhadap akar penyimpanan, jadi
 * folder dapat dipindahkan tanpa mengubah data.
 */

const AKAR_PENYIMPANAN = path.join(process.cwd(), "storage", "laporan-penduduk");

/** Susun jalur relatif untuk berkas laporan penduduk baru. */
export function jalurRelatifLaporanPenduduk(
  villageId: number,
  tahun: number,
  namaAman: string,
): string {
  return path.posix.join(String(villageId), String(tahun), `${Date.now()}-${namaAman}`);
}

/**
 * Ubah jalur relatif menjadi jalur absolut, sambil menolak percobaan keluar
 * dari akar penyimpanan (path traversal).
 */
function jalurAbsolut(relatif: string): string {
  const absolut = path.resolve(AKAR_PENYIMPANAN, relatif);
  const akar = path.resolve(AKAR_PENYIMPANAN);
  if (absolut !== akar && !absolut.startsWith(akar + path.sep)) {
    throw new Error("Jalur berkas laporan penduduk di luar penyimpanan.");
  }
  return absolut;
}

/** Simpan isi berkas laporan penduduk. */
export async function simpanBerkasLaporanPenduduk(relatif: string, isi: Uint8Array): Promise<void> {
  const absolut = jalurAbsolut(relatif);
  await mkdir(path.dirname(absolut), { recursive: true });
  await writeFile(absolut, isi);
}

/** Baca isi berkas laporan penduduk. */
export async function bacaBerkasLaporanPenduduk(relatif: string): Promise<Buffer> {
  return readFile(jalurAbsolut(relatif));
}

/** Hapus berkas laporan penduduk; diamkan bila berkas sudah tidak ada. */
export async function hapusBerkasLaporanPenduduk(relatif: string): Promise<void> {
  try {
    await unlink(jalurAbsolut(relatif));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
