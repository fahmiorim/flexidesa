import { z } from "zod";

/** Schema validasi form produk lapak. */
export const lapakProdukFormSchema = z.object({
  nama: z.string().trim().min(1, "Nama produk wajib diisi").max(200),
  deskripsi: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  harga: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .pipe(
      z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "Harga harus angka valid")
        .nullable(),
    )
    .optional(),
  stok: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.string().regex(/^\d+$/, "Stok harus angka bulat").nullable())
    .optional(),
  gambar: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  aktif: z.boolean().default(true),
  latitude: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  longitude: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export type LapakProdukFormInput = z.infer<typeof lapakProdukFormSchema>;

/** Baris produk lapak untuk tampilan admin. */
export interface LapakProdukRow {
  id: number;
  lapakId: number;
  nama: string;
  deskripsi: string | null;
  /** Nilai decimal dari basis data, tetap berupa string agar tidak dibulatkan. */
  harga: string;
  stok: number | null;
  gambar: string | null;
  /** 1 = tampil di website, 0 = disembunyikan. */
  aktif: number;
  latitude: string | null;
  longitude: string | null;
}
