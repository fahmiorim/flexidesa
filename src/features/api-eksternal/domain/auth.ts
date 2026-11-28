import type { apiKeys } from "@/db/schema/api-keys";

import { verifyApiKey } from "./api-key";

type ApiKeyRecord = typeof apiKeys.$inferSelect;

export type AuthResult =
  { ok: false; status: number; message: string } | { ok: true; apiKey: ApiKeyRecord };

/**
 * Periksa kunci API terhadap record yang sudah dimuat repository.
 *
 * Fungsi ini murni (tanpa I/O); pemuatan record dan pencatatan pemakaian
 * terakhir dilakukan application layer lewat `api-key-repository`.
 */
export function periksaKunciApi(key: string, record: ApiKeyRecord | null): AuthResult {
  if (!key.startsWith("SID_")) return { ok: false, status: 401, message: "Kunci API tidak valid." };

  if (!record) return { ok: false, status: 401, message: "Kunci API tidak valid." };
  if (!record.active) return { ok: false, status: 403, message: "Kunci API tidak aktif." };

  if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
    return { ok: false, status: 401, message: "Kunci API sudah kedaluwarsa." };
  }

  if (!verifyApiKey(key, record.hashedKey)) {
    return { ok: false, status: 401, message: "Kunci API tidak valid." };
  }

  return { ok: true, apiKey: record };
}
