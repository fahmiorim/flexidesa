import "server-only";

import { headers } from "next/headers";
import { notFound as halamanTidakDitemukan } from "next/navigation";
import { cache } from "react";

import { hostPlatform } from "@/features/info-desa/desa/application/platform-host";
import { adalahHostPlatform } from "@/features/info-desa/desa/domain/host";
import { susunPetaDesa, villageIdDariHost } from "@/features/info-desa/desa/domain/tenant";
import {
  getIdentitasDesa,
  getSoleVillageId,
  listVillageDomains,
  type IdentitasDesa,
} from "@/features/info-desa/desa/infrastructure/desa-repository";
import type { CurrentUser } from "@/lib/dal";
import { env } from "@/lib/env";
import { forbidden, notFound } from "@/lib/errors";

/**
 * Tentukan `village_id` efektif untuk operasi tulis/admin.
 *
 * Prioritas: penugasan desa pada sesi → desa tunggal (mode satu-desa). Akun
 * platform tanpa penugasan desa **tidak** boleh memilih desa pertama saat ada
 * lebih dari satu desa aktif; tanpa aturan ini, operasi desa dapat menulis ke
 * tenant yang salah. Fallback hanya berlaku bila tepat satu desa aktif.
 */
export async function resolveVillageId(user: CurrentUser): Promise<number> {
  if (user.villageId !== null) return user.villageId;

  const { villageId, jumlah } = await getSoleVillageId();
  if (jumlah === 0) throw notFound("Identitas desa belum dikonfigurasi.");
  if (jumlah > 1 || villageId === null) {
    throw forbidden(
      "Akun platform tidak memiliki penugasan desa. Pilih desa secara eksplisit sebelum menjalankan operasi desa.",
    );
  }

  return villageId;
}

/**
 * Tentukan desa dari host permintaan (halaman publik).
 *
 * Hanya header Host yang dipakai. X-Forwarded-Host sengaja tidak dibaca karena
 * dapat dipalsukan oleh klien kecuali setiap hop proxy dipastikan menghapus
 * header masuk dan menimpanya dengan nilai yang telah divalidasi.
 *
 * Aturan pemetaan ada di `domain/tenant.ts` (murni, teruji): host platform →
 * domain persis → alias `www` → wildcard. Fallback satu-desa **opt-in** lewat
 * `TENANT_LEGACY_SINGLE_HOST_FALLBACK`; default mati sehingga host tak dikenal
 * menghasilkan 404 dan tenant tidak bocor, bahkan pada instalasi satu desa.
 */
export const resolveVillageByHost = cache(
  async (host: string | null | undefined): Promise<IdentitasDesa> => {
    // Host platform bukan tenant: jangan biarkan fallback satu-desa membuat
    // domain platform menampilkan data desa tertentu. Memakai `notFound()` dari
    // Next agar pengunjung mendapat 404, bukan halaman galat 500.
    if (adalahHostPlatform(host, hostPlatform)) {
      halamanTidakDitemukan();
    }

    const peta = susunPetaDesa(await listVillageDomains(), env.DESA_BASE_DOMAIN ?? null);
    const villageId = villageIdDariHost(host, peta, {
      hostPlatform,
      fallbackSatuDesa: env.TENANT_LEGACY_SINGLE_HOST_FALLBACK,
    });

    if (villageId !== null) {
      const desa = await getIdentitasDesa(villageId);
      if (desa) return desa;
    }

    halamanTidakDitemukan();
  },
);
/**
 * `village_id` desa untuk host permintaan ini, atau `null` bila host adalah
 * platform/tak dikenal.
 *
 * Varian non-404 dari pipeline `resolveVillageByHost`, khusus dipakai halaman
 * 404 (`src/app/not-found.tsx`): resolver biasa sengaja melempar `notFound()`
 * untuk host tak dikenal, yang dari halaman 404 akan berputar. Di sini hasil
 * tak dikenal diturunkan ke tampilan 404 netral tanpa tema desa.
 */
export async function getVillageIdByHost(host: string | null | undefined): Promise<number | null> {
  if (adalahHostPlatform(host, hostPlatform)) return null;
  const peta = susunPetaDesa(await listVillageDomains(), env.DESA_BASE_DOMAIN ?? null);
  return villageIdDariHost(host, peta, {
    hostPlatform,
    fallbackSatuDesa: env.TENANT_LEGACY_SINGLE_HOST_FALLBACK,
  });
}

/** Desa aktif untuk request saat ini, berdasarkan header Host yang diterima server. */
export const getIdentitasFromRequest = cache(async (): Promise<IdentitasDesa> => {
  const requestHeaders = await headers();
  return resolveVillageByHost(requestHeaders.get("host"));
});
