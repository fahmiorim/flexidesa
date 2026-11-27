/**
 * Kontrak baca Potensi & Sarana Prasarana.
 *
 * Halaman publik (Info Desa) dan daftar admin memakai fungsi ini, sedangkan
 * data tulis tetap dimiliki `application/use-cases.ts` fitur ini. Dengan begitu
 * repository hanya ada satu dan izin tulis tidak tersebar.
 */

import {
  listPotensiDesa,
  listSaranaPrasarana,
  type PotensiDesaRingkas,
  type SaranaPrasaranaRingkas,
} from "../infrastructure/potensi-sarana-repository";

export type { PotensiDesaRingkas, SaranaPrasaranaRingkas };

export async function daftarPotensiDesa(villageId: number, includeInactive = false) {
  return listPotensiDesa(villageId, includeInactive);
}

export async function daftarSaranaPrasarana(villageId: number, includeInactive = false) {
  return listSaranaPrasarana(villageId, includeInactive);
}
