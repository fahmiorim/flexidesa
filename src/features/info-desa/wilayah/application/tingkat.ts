import "server-only";

import { getWilayahPemerintahanData } from "@/features/info-desa/pemerintahan/application/wilayah";
import {
  tingkatWilayah,
  wilayahTurunan,
  type WilayahDenganJumlah,
} from "@/features/info-desa/wilayah/domain/wilayah";

export type TingkatWilayah = {
  induk: WilayahDenganJumlah | null;
  daftar: WilayahDenganJumlah[];
  judul: string;
  labelInduk: string | null;
};

/** Label ringkas wilayah, mis. "Dusun Sukamaju · RW 01 · RT 002". */
export function labelWilayah(row: Pick<WilayahDenganJumlah, "dusun" | "rw" | "rt">) {
  const bagian: string[] = [];
  if (row.dusun) bagian.push(`Dusun ${row.dusun}`);
  if (row.rw) bagian.push(`RW ${row.rw}`);
  if (row.rt) bagian.push(`RT ${row.rt}`);
  return bagian.join(" · ") || "Wilayah tanpa nama";
}

/**
 * Menentukan baris yang ditampilkan pada satu tingkat penelusuran wilayah.
 *
 * Dipakai bersama oleh halaman cetak dan unduhan agar keduanya menampilkan
 * isi yang sama dengan halaman utama. `parentId` harus berasal dari URL dan
 * diperlakukan hanya sebagai penunjuk tampilan; otorisasi dan pembatasan tenant
 * sudah dilakukan oleh use case data wilayah.
 */
export async function getTingkatWilayah(
  parentId: number | null,
): Promise<TingkatWilayah & { semua: WilayahDenganJumlah[] }> {
  const { rows } = await getWilayahPemerintahanData();
  const induk =
    parentId !== null && Number.isSafeInteger(parentId)
      ? (rows.find((row) => row.id === parentId) ?? null)
      : null;
  const anak = induk ? wilayahTurunan(rows, induk) : [];
  const daftar = induk
    ? rows.filter((row) => anak.some((item) => item.id === row.id))
    : rows.filter((row) => tingkatWilayah(row) === "dusun");
  const tingkatInduk = induk ? tingkatWilayah(induk) : null;
  return {
    induk,
    daftar,
    semua: rows,
    judul: induk ? (tingkatInduk === "dusun" ? "RW / RT" : "RT") : "Dusun",
    labelInduk: induk ? labelWilayah(induk) : null,
  };
}
