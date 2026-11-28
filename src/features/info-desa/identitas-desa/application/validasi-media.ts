/**
 * Aturan unggah media Identitas Desa (murni, tanpa I/O).
 *
 * Tipe berkas:
 * - logo & foto kantor: `.gif,.jpg,.jpeg,.png,.webp`
 * - struktur adat: `.jpg,.jpeg,.png,.webp`
 * - dokumen regulasi adat: `.pdf`
 *
 * Logo juga menerima SVG.
 * Batas ukuran ditetapkan di sini; penyimpanan media tetap memeriksa
 * ulang MIME, ukuran, dan isi berkas.
 */

type MediaUnggah =
  "logo" | "foto-kantor" | "tanda-tangan" | "stempel" | "struktur-adat" | "dokumen-adat";

const MB = 1024 * 1024;

const TIPE_DIIZINKAN: Record<MediaUnggah, readonly string[]> = {
  logo: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  "foto-kantor": ["image/jpeg", "image/png", "image/gif", "image/webp"],
  "tanda-tangan": ["image/jpeg", "image/png", "image/gif", "image/webp"],
  stempel: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  "struktur-adat": ["image/jpeg", "image/png", "image/webp"],
  "dokumen-adat": ["application/pdf"],
};

const BATAS_UKURAN: Record<MediaUnggah, number> = {
  logo: 2 * MB,
  "foto-kantor": 5 * MB,
  "tanda-tangan": 5 * MB,
  stempel: 5 * MB,
  "struktur-adat": 5 * MB,
  "dokumen-adat": 20 * MB,
};

const LABEL: Record<MediaUnggah, string> = {
  logo: "Logo",
  "foto-kantor": "Foto kantor",
  "tanda-tangan": "Tanda tangan",
  stempel: "Stempel",
  "struktur-adat": "Struktur adat",
  "dokumen-adat": "Dokumen adat",
};

const SEBUTAN_TIPE: Record<MediaUnggah, string> = {
  logo: "JPG, PNG, GIF, WEBP, atau SVG",
  "foto-kantor": "JPG, PNG, GIF, atau WEBP",
  "tanda-tangan": "JPG, PNG, GIF, atau WEBP",
  stempel: "JPG, PNG, GIF, atau WEBP",
  "struktur-adat": "JPG, PNG, atau WEBP",
  "dokumen-adat": "PDF",
};

type HasilValidasiMediaIdentitas =
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
