import "server-only";

import {
  indukValid,
  isTingkatWilayah,
  TINGKAT_WILAYAH,
  type Wilayah,
} from "../domain/data-wilayah";
import { daftarWilayah, detailWilayahDesa } from "../infrastructure/data-wilayah-repository";

/**
 * Use case referensi wilayah administratif untuk picker desa.
 *
 * Route `/api/wilayah` memanggil fungsi ini, bukan repository, supaya batas
 * lapisan `src/app` tetap terjaga. Data bersifat publik (kode dan nama
 * wilayah), sehingga tidak ada pemeriksaan sesi; validasi parameter tetap
 * dilakukan di server.
 */

export const PESAN_TINGKAT_TIDAK_VALID = `Parameter tingkat harus salah satu: ${TINGKAT_WILAYAH.join(", ")}.`;
export const PESAN_INDUK_TIDAK_VALID = "Kode induk wilayah tidak valid.";

type HasilWilayah =
  | { status: "ok"; data: Wilayah[] }
  | { status: "tingkat-tidak-valid" }
  | { status: "induk-tidak-valid" };

/** Detail BPS dan kode pos untuk satu kode desa Kemendagri. */
export function detailWilayahAdministratif(kode: string | null) {
  const bersih = kode?.trim().replaceAll(".", "") ?? "";
  if (!/^\d{10}$/.test(bersih)) return null;
  return detailWilayahDesa(bersih);
}

export function wilayahAdministratif(tingkat: string | null, induk: string | null): HasilWilayah {
  if (!isTingkatWilayah(tingkat)) return { status: "tingkat-tidak-valid" };
  if (!indukValid(tingkat, induk)) return { status: "induk-tidak-valid" };

  return { status: "ok", data: daftarWilayah(tingkat, induk) };
}
