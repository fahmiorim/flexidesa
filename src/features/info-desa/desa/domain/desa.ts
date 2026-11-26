import { z } from "zod";

import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { optionalText } from "@/lib/forms";

/**
 * Slug resource RBAC untuk menu Identitas Desa.
 *
 * Menu itu tersimpan sebagai modul `pengaturan-desa` (halaman
 * `/profil-desa/identitas-desa`), jadi resource harus memakai slug yang sama
 * dengan `modules.slug` — bukan `identitas-desa` yang tidak ada di template.
 */
export const IDENTITAS_DESA_RESOURCE = RESOURCES.pengaturanDesa;

export const desaFormSchema = z.object({
  namaDesa: optionalText(100),
  kodeDesa: optionalText(10),
  kodePos: optionalText(5),
  namaKecamatan: optionalText(100),
  kodeKecamatan: optionalText(10),
  namaKabupaten: optionalText(100),
  kodeKabupaten: optionalText(10),
  namaPropinsi: optionalText(100),
  kodePropinsi: optionalText(10),
  alamatKantor: optionalText(255),
  namaKepalaDesa: optionalText(100),
  nipKepalaDesa: optionalText(30),
  emailDesa: optionalText(100).refine(
    (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Format email tidak valid.",
  ),
  telepon: optionalText(30),
  website: optionalText(150),
  logo: optionalText(255),
  /** Jalur media gambar tanda tangan Kepala Desa (kategori umum). */
  tandaTangan: optionalText(255),
  /** Jalur media gambar stempel desa (kategori umum). */
  stempel: optionalText(255),
  /** 1–4; lihat `PENOMORAN_SURAT_MODES` di domain surat. */
  penomoranSurat: z.coerce.number().int().min(1).max(4).default(2),
});

export type DesaFormInput = z.infer<typeof desaFormSchema>;

/**
 * Identitas desa (kontrak domain).
 *
 * Nama field mengikuti kosakata domain aplikasi (Indonesia). Satu-satunya
 * kontrak identitas yang dipakai application, API, dan repository — bukan
 * didefinisikan ulang di lapisan infrastruktur.
 */
export interface IdentitasDesa {
  id: number;
  namaDesa: string | null;
  kodeDesa: string | null;
  kodePos: string | null;
  namaKecamatan: string | null;
  kodeKecamatan: string | null;
  namaKabupaten: string | null;
  kodeKabupaten: string | null;
  namaPropinsi: string | null;
  kodePropinsi: string | null;
  alamatKantor: string | null;
  namaKepalaDesa: string | null;
  nipKepalaDesa: string | null;
  emailDesa: string | null;
  telepon: string | null;
  website: string | null;
  logo: string | null;
  /** Jalur media foto kantor desa. */
  fotoKantor: string | null;
  /** Jalur media gambar tanda tangan Kepala Desa. */
  tandaTangan: string | null;
  /** Jalur media gambar stempel desa. */
  stempel: string | null;
  /** Domain publik desa (host tanpa protokol), bila sudah dipetakan. */
  domain: string | null;
  /** Mode penomoran surat layanan (1–4). */
  penomoranSurat: number;
}

/** Label ringkas untuk kepentingan tampilan. */
export function desaLabel(desa: Pick<IdentitasDesa, "namaDesa" | "kodeDesa">): string {
  if (desa.namaDesa && desa.kodeDesa) return `${desa.namaDesa} (${desa.kodeDesa})`;
  if (desa.namaDesa) return desa.namaDesa;
  if (desa.kodeDesa) return desa.kodeDesa;
  return "Desa";
}
