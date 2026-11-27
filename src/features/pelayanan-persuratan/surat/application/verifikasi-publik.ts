import "server-only";

import { hashVerificationToken } from "@/features/pelayanan-persuratan/surat/domain/surat";
import { findSuratByTokenHash } from "@/features/pelayanan-persuratan/surat/infrastructure/surat-repository";

/**
 * Cari surat untuk API eksternal berdasarkan token; `villageId` berasal dari API key.
 * Token yang tidak berbentuk hex 64 char langsung dianggap tidak ditemukan.
 */
export async function cariSuratEksternal(villageId: number, token: string) {
  if (!/^[0-9a-f]{64}$/i.test(token)) return null;
  const tokenHash = await hashVerificationToken(token.toLowerCase());
  return findSuratByTokenHash(villageId, tokenHash);
}

/**
 * Use case publik: verifikasi surat via token.
 *
 * `villageId` berasal dari host (aturan multi-tenant), token dari URL dicocokkan
 * sebagai hash SHA-256 — bukan PK numerik — sehingga surat tidak dapat ditebak
 * dan tidak pernah bocor lintas desa.
 */
