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

export type LapakFormInput = z.infer<typeof lapakFormSchema>;

/** Form lapak warga; pemilik diisi dari sesi, bukan input. */
export const lapakWargaSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi.").max(200, "Nama maksimal 200 karakter."),
  kategori: z.string().trim().max(100).optional().default(""),
  alamat: z.string().trim().max(500).optional().default(""),
  keterangan: z.string().trim().max(1000).optional().default(""),
});
