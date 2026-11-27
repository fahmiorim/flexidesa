import { z } from "zod";

export const arsipFormSchema = z.object({
  kategori: z.string().trim().max(100).optional().nullable(),
  judul: z.string().trim().min(1, "Judul wajib diisi").max(200),
  berkas: z.string().trim().max(255).optional().nullable(),
  keterangan: z.string().trim().optional().nullable(),
});
