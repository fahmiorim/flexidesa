/**
 * Transformasi logo persegi sesuai opsi `ukuran` form Identitas Desa.
 *
 * `ukuran` kosong berarti dimensi bawaan (tidak ada transformasi) — perilaku
 * ini dipertahankan agar unggahan lama tidak berubah. Bila diisi, logo
 * di-resize menjadi persegi `ukuran × ukuran` dan dipertahankan formatnya.
 *
 * Ditempatkan di luar route agar alurnya dapat diuji tanpa HTTP. Validasi
 * rentang memakai aturan domain yang sama dengan UI sehingga server tidak
 * pernah menerima nilai di luar 100–400.
 */

import sharp from "sharp";

import { validasiUkuranLogo } from "@/features/info-desa/identitas-desa/domain/identitas-form";
import { validationError } from "@/lib/errors";

/** Format keluaran yang didukung transformasi; SVG/GIF dibiarkan apa adanya. */
const FORMAT_DAPAT_DIUKUR = new Set(["jpeg", "png", "webp"]);

interface HasilTransformasiLogo {
  isi: Uint8Array;
  mime: string;
}

/**
 * Terapkan dimensi persegi pada isi logo.
 *
 * - `ukuran` kosong/null → isi asli dikembalikan tanpa diubah.
 * - SVG dan GIF → isi asli (rasterisasi akan membuang animasi/vektor).
 * - Nilai di luar 100–400 → `VALIDATION`, berkas lama tetap aman karena
 *   penulisan baru hanya terjadi setelah transformasi berhasil.
 */
export async function terapkanUkuranLogo(
  isi: Uint8Array,
  mime: string,
  ukuran: string | null | undefined,
): Promise<HasilTransformasiLogo> {
  const cek = validasiUkuranLogo(ukuran);
  if (!cek.ok) throw validationError(cek.pesan, { ukuran: [cek.pesan] });
  if (cek.ukuran === null) return { isi, mime };

  const format = mime.toLowerCase().replace("image/", "").replace("jpg", "jpeg");
  if (!FORMAT_DAPAT_DIUKUR.has(format)) return { isi, mime };

  const keluaran = await sharp(Buffer.from(isi))
    .resize(cek.ukuran, cek.ukuran, { fit: "cover" })
    .toFormat(format === "jpeg" ? "jpeg" : format === "webp" ? "webp" : "png")
    .toBuffer();

  return { isi: new Uint8Array(keluaran), mime };
}
