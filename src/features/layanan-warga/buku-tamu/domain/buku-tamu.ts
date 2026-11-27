import { z } from "zod";

export const bukuTamuFormSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi").max(200),
  instansi: z.string().trim().max(200).optional().nullable(),
  keperluan: z.string().trim().optional().nullable(),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  jamMasuk: z.string().optional().nullable(),
  jamKeluar: z.string().optional().nullable(),
  keterangan: z.string().trim().optional().nullable(),
});
