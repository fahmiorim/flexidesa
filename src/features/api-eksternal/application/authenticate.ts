import "server-only";

import { hash } from "@/features/api-eksternal/domain/api-key";
import { periksaKunciApi, type AuthResult } from "@/features/api-eksternal/domain/auth";
import {
  findApiKeyByHashedKey,
  touchApiKeyLastUsed,
} from "@/features/api-eksternal/infrastructure/api-key-repository";

/**
 * Autentikasi kunci API eksternal: muat record lewat repository, periksa lewat
 * domain, lalu catat pemakaian terakhir bila berhasil.
 */
export async function authenticateApiKey(key: string): Promise<AuthResult> {
  if (!key.startsWith("SID_")) return { ok: false, status: 401, message: "Kunci API tidak valid." };

  const record = await findApiKeyByHashedKey(hash(key).toString("hex"));
  const hasil = periksaKunciApi(key, record);
  if (!hasil.ok) return hasil;

  await touchApiKeyLastUsed(hasil.apiKey.id).catch((error) =>
    console.error("Gagal memperbarui lastUsedAt API key:", error),
  );

  return hasil;
}
