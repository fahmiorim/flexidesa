/**
 * Aturan unggah media Identitas Desa (murni, tanpa I/O).
 *
 * Tipe berkas mengikuti form Identitas Desa OpenSID:
 * - logo & foto kantor: `.gif,.jpg,.jpeg,.png,.webp`
 * - struktur adat: `.jpg,.jpeg,.png,.webp`
 * - dokumen regulasi adat: `.pdf`
 *
 * Tambahan FlexiDesa: logo juga menerima SVG (sudah dipakai sebelum paritas).
 * Batas ukuran adalah kebijakan FlexiDesa; penyimpanan media tetap memeriksa
 * ulang MIME, ukuran, dan isi berkas.
 */

export type MediaUnggah = "logo" | "foto-kantor" | "struktur-adat" | "dokumen-adat";

const MB = 1024 * 1024;

export const TIPE_DIIZINKAN: Record<MediaUnggah, readonly string[]> = {
  logo: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  "foto-kantor": ["image/jpeg", "image/png", "image/gif", "image/webp"],
  "struktur-adat": ["image/jpeg", "image/png", "image/webp"],
  "dokumen-adat": ["application/pdf"],
};

export const BATAS_UKURAN: Record<MediaUnggah, number> = {
  logo: 2 * MB,
  "foto-kantor": 5 * MB,
  "struktur-adat": 5 * MB,
  "dokumen-adat": 20 * MB,
};

const LABEL: Record<MediaUnggah, string> = {
  logo: "Logo",
  "foto-kantor": "Foto kantor",
  "struktur-adat": "Struktur adat",
  "dokumen-adat": "Dokumen adat",
};

const SEBUTAN_TIPE: Record<MediaUnggah, string> = {
  logo: "JPG, PNG, GIF, WEBP, atau SVG",
  "foto-kantor": "JPG, PNG, GIF, atau WEBP",
  "struktur-adat": "JPG, PNG, atau WEBP",
  "dokumen-adat": "PDF",
};

export type HasilValidasiMediaIdentitas =
  { ok: true } | { ok: false; status: 413 | 422; pesan: string };

/** Periksa MIME dan ukuran satu berkas media identitas. */
export function validasiMediaIdentitas(
  field: MediaUnggah,
  mime: string,
  ukuran: number,
): HasilValidasiMediaIdentitas {
  const batas = BATAS_UKURAN[field];
  const maksMb = Math.round(batas / MB);
  if (ukuran <= 0) {
    return { ok: false, status: 422, pesan: "Berkas kosong." };
  }
  if (ukuran > batas) {
    return {
      ok: false,
      status: 413,
      pesan: `${LABEL[field]} maksimal ${maksMb} MB.`,
    };
  }
  if (!TIPE_DIIZINKAN[field].includes(mime.toLowerCase())) {
    return {
      ok: false,
      status: 422,
      pesan: `${LABEL[field]} harus ${SEBUTAN_TIPE[field]} maksimal ${maksMb} MB.`,
    };
  }
  return { ok: true };
}
