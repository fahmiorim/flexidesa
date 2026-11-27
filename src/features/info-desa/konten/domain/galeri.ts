import { z } from "zod";

import { buatSlug } from "@/features/info-desa/publik/domain/slug";
import { optionalText } from "@/lib/forms";

/**
 * Konten galeri.
 *
 * Satu desa punya banyak **album**; setiap album berisi **foto**. Foto yang
 * ditandai `slider` ikut dipakai beranda bila tabel `slider` kosong (lihat
 * `listSliderBeranda` di repository publik). Semua aturan di sini murni.
 */

/** Skema form album. */
export const albumFormSchema = z.object({
  nama: z.string().trim().min(1, "Nama album wajib diisi.").max(150, "Maksimal 150 karakter."),
  keterangan: optionalText(2000),
  urut: z.coerce
    .number({ error: "Urutan harus angka." })
    .int("Urutan harus bilangan bulat.")
    .min(0, "Urutan minimal 0.")
    .max(999, "Urutan maksimal 999.")
    .default(0),
  aktif: z.boolean().default(true),
});

/** Skema form foto. */
export const fotoFormSchema = z.object({
  judul: optionalText(150),
  keterangan: optionalText(2000),
  urut: z.coerce
    .number({ error: "Urutan harus angka." })
    .int("Urutan harus bilangan bulat.")
    .min(0, "Urutan minimal 0.")
    .max(9999, "Urutan maksimal 9999.")
    .default(0),
  aktif: z.boolean().default(true),
  slider: z.boolean().default(false),
});

/** Maksimal berkas per satu unggahan agar satu permintaan tidak terlalu besar. */
export const MAKS_FOTO_PER_UNGGAH = 20;

/**
 * Slug album dari nama; tidak pernah kosong.
 *
 * Kolom `galeri_album.slug` hanya 150 karakter. Akhiran unik `-2` … `-200`
 * memakai maksimal 4 karakter, jadi slug dasar dibatasi 146 karakter.
 */
export function slugAlbum(nama: string): string {
  const dasar = buatSlug(nama, 146);
  return dasar === "" ? "album" : dasar;
}

/** Album pada daftar admin (dengan jumlah foto). */

/** Foto pada halaman kelola album. */

/** Hasil unggah banyak foto: yang tersimpan dan yang dilewati beserta alasannya. */
export interface HasilUnggahFoto {
  tersimpan: number;
  dilewati: { nama: string; alasan: string }[];
}
