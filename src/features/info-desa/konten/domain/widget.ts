// Cadangan fitur: teruji, belum dipakai produksi. Pertahankan bersama test-nya;
// hapus berkas + test-nya bila diputuskan tidak dipakai.
import { z } from "zod";

/** Widget blok samping beranda/laman. */

/** Jenis widget yang didukung skema basis data. */

/** Baris widget yang aman dikirim ke komponen klien. */
export interface WidgetRow {
  id: number;
  judul: string | null;
  isi: string | null;
  jenis: number;
  pengaturan: string | null;
  urut: number;
  aktif: boolean;
}

/** Pengaturan widget disimpan sebagai JSON; tolak JSON yang rusak. */
export function pengaturanWidgetValid(value: string | null | undefined): boolean {
  if (!value || value.trim() === "") return true;

  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export const widgetFormSchema = z
  .object({
    judul: z.string().trim().max(100, "Maksimal 100 karakter.").optional().default(""),
    isi: z.string().max(20_000, "Isi widget terlalu panjang.").optional().default(""),
    jenis: z.coerce
      .number({ error: "Jenis widget harus angka." })
      .int("Jenis widget tidak valid.")
      .min(1, "Jenis widget tidak valid.")
      .max(6, "Jenis widget tidak valid.")
      .default(1),
    pengaturan: z.string().trim().max(4_000, "Pengaturan terlalu panjang.").optional().default(""),
    urut: z.coerce
      .number({ error: "Urutan harus angka." })
      .int("Urutan harus bilangan bulat.")
      .min(0, "Urutan minimal 0.")
      .default(0),
    aktif: z.boolean().default(true),
  })
  .refine((data) => pengaturanWidgetValid(data.pengaturan), {
    path: ["pengaturan"],
    message: "Pengaturan harus berupa JSON yang valid.",
  });
