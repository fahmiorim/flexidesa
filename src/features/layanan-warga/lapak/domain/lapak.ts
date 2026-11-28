import { z } from "zod";

export const lapakFormSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi").max(200),
  pemilik: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  kategori: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  alamat: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  keterangan: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});


/** Form lapak warga; pemilik diisi dari sesi, bukan input. */
