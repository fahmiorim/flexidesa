import { resolveTema } from "./registry";
import { migrasiOpsiVersi, validasiOpsiTenant, type ThemeOptionDefinition } from "./types";

/**
 * Jembatan migrasi opsi tenant ↔ schema paket tema.
 *
 * Dipakai alur simpan opsi tenant dan alur ganti/distribusi template:
 * nilai lama yang masih valid dipertahankan, key yang hilang memakai default
 * paket, dan key tak dikenal dilaporkan sebagai peringatan — bukan dibuang
 * diam-diam tanpa jejak.
 */

/** Definisi opsi paket untuk slug/versi aktif; `null` bila paket tidak ada. */
export function definisiOpsiTema(
  slug: string | null | undefined,
  versi: string | null | undefined,
): ThemeOptionDefinition[] | null {
  return resolveTema(slug, versi)?.opsi ?? null;
}

/**
 * Normalisasi opsi tenant terhadap schema paket.
 * `null` berarti slug/versi tidak ada di registry (pemanggil wajib menolak).
 */
export function migrasiOpsiUntukTema(
  slug: string | null | undefined,
  versi: string | null | undefined,
  opsiLama: Record<string, unknown> | null | undefined,
): { opsi: Record<string, unknown>; peringatan: string[] } | null {
  const definisi = definisiOpsiTema(slug, versi);
  if (!definisi) return null;
  return migrasiOpsiVersi(opsiLama, definisi);
}

/** Validasi opsi kiriman klien tanpa peringatan key asing (dibuang diam-diam). */
export function validasiOpsiUntukTema(
  slug: string | null | undefined,
  versi: string | null | undefined,
  opsi: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  const definisi = definisiOpsiTema(slug, versi);
  if (!definisi) return null;
  return validasiOpsiTenant(definisi, opsi);
}
