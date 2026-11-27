import { z } from "zod";

export const KANAL_NOTIFIKASI = ["email", "whatsapp"] as const;
export const STATUS_NOTIFIKASI = ["semua", "sukses", "gagal", "dilewati"] as const;

export type KanalNotifikasiFilter = (typeof KANAL_NOTIFIKASI)[number];
export type StatusNotifikasiFilter = (typeof STATUS_NOTIFIKASI)[number];

export interface FilterNotifikasi {
  kanal: KanalNotifikasiFilter | null;
  status: StatusNotifikasiFilter;
}

/** Baca filter dari query string; nilai asing jatuh ke "semua". */
export function parseFilterNotifikasi(params: {
  kanal?: string | string[];
  status?: string | string[];
}): FilterNotifikasi {
  const kanal = typeof params.kanal === "string" ? params.kanal : "";
  const status = typeof params.status === "string" ? params.status : "";

  return {
    kanal: (KANAL_NOTIFIKASI as readonly string[]).includes(kanal)
      ? (kanal as KanalNotifikasiFilter)
      : null,
    status: (STATUS_NOTIFIKASI as readonly string[]).includes(status)
      ? (status as StatusNotifikasiFilter)
      : "semua",
  };
}

export const broadcastSchema = z.object({
  kanal: z.enum(KANAL_NOTIFIKASI),
  target: z
    .string()
    .trim()
    .min(5, "Target minimal 5 karakter.")
    .max(255, "Target maksimal 255 karakter."),
  subjek: z.string().trim().max(200, "Subjek maksimal 200 karakter.").optional(),
  pesan: z
    .string()
    .trim()
    .min(5, "Pesan minimal 5 karakter.")
    .max(1000, "Pesan maksimal 1000 karakter."),
});

/** Status pengiriman satu baris bukti `notifikasi_terkirim`. */
export type StatusPengiriman = "sukses" | "gagal" | "dilewati";

export function statusPengiriman(row: { sukses: boolean; dilewati: boolean }): StatusPengiriman {
  if (row.sukses) return "sukses";
  if (row.dilewati) return "dilewati";
  return "gagal";
}

export function labelStatusPengiriman(status: StatusPengiriman): string {
  if (status === "sukses") return "Terkirim";
  if (status === "dilewati") return "Dilewati";
  return "Gagal";
}

export function toneStatusPengiriman(status: StatusPengiriman): string {
  if (status === "sukses") return "hijau";
  if (status === "gagal") return "merah";
  return "netral";
}

/**
 * Saring bukti notifikasi agar hanya milik satu nomor antrean permohonan.
 *
 * Nomor antrean terikat pada subjek/pesan notifikasi status; bila nomor
 * antrean kosong, seluruh bukti warga dikembalikan apa adanya.
 */
export function cocokAntreanNotifikasi(
  row: { subjek: string | null; pesan: string | null },
  noAntrian: string | null | undefined,
): boolean {
  const nomor = noAntrian?.trim();
  if (!nomor) return true;
  return Boolean(row.subjek?.includes(nomor) || row.pesan?.includes(nomor));
}

export function labelKanalNotifikasi(kanal: string): string {
  if (kanal === "email") return "Email";
  if (kanal === "whatsapp") return "WhatsApp";
  return kanal;
}
