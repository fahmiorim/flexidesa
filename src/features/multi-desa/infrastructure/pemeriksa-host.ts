import "server-only";

import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Validasi host dan resolusi DNS untuk pemantauan domain platform.
 *
 * Alamat privat, loopback, link-local, dan host internal ditolak sebelum
 * koneksi TLS dibuat. Klasifikasi alamat memakai modul yang sama dengan adapter
 * TTE agar aturan SSRF tidak diduplikasi.
 */

import { hostTerlarang, klasifikasiAlamat } from "@/features/surat/domain/tte-alamat";
import { env } from "@/lib/env";

const POLA_HOST = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export interface AlamatHost {
  alamat: string;
  family: 4 | 6;
}

export type HasilResolusiHost = { ok: true; alamat: AlamatHost[] } | { ok: false; error: string };

/** Normalisasi dan validasi hostname dari tabel domain. */
export function normalisasiHostDomain(domain: string): string | null {
  const host = domain.trim().toLowerCase().replace(/\.$/, "");
  if (host === "" || isIP(host) !== 0) return null;
  if (!POLA_HOST.test(host)) return null;
  if (hostTerlarang(host)) return null;
  return host;
}

/**
 * Host yang alamatnya menjadi acuan server platform.
 *
 * Urutan: domain induk desa (wildcard subdomain menunjuk server yang sama),
 * lalu host platform pertama, lalu host `APP_URL`. Host yang tidak valid atau
 * tidak dapat diresolusi membuat acuan kosong, bukan error.
 */
function hostAcuanPlatform(): string | null {
  const kandidat = [
    env.DESA_BASE_DOMAIN,
    env.PLATFORM_HOSTS?.split(",")[0]?.trim(),
    hostDariUrl(env.APP_URL),
  ];

  for (const item of kandidat) {
    if (!item) continue;
    const host = normalisasiHostDomain(item);
    if (host) return host;
  }
  return null;
}

function hostDariUrl(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Alamat IP publik server platform sebagai acuan pemeriksaan DNS tenant.
 *
 * `PLATFORM_SERVER_IPS` bersifat otoritatif bila diisi (mis. beberapa server di
 * belakang load balancer). Bila kosong, alamat diturunkan dari resolusi host
 * acuan; kegagalan resolusi menghasilkan daftar kosong agar pemeriksaan tetap
 * berjalan tanpa memvonis domain bermasalah di lingkungan lokal.
 */
export async function alamatServerPlatform(): Promise<string[]> {
  if (env.PLATFORM_SERVER_IPS.length > 0) return [...env.PLATFORM_SERVER_IPS];

  const host = hostAcuanPlatform();
  if (!host) return [];

  const hasil = await resolusiHostPublik(host);
  if (!hasil.ok) return [];
  return hasil.alamat.map((item) => item.alamat);
}

/**
 * Resolusi A/AAAA dan pastikan seluruh alamat publik.
 *
 * Satu alamat internal menggagalkan seluruh host: koneksi tidak boleh memakai
 * alamat lain saat ada indikasi host menunjuk jaringan internal.
 */
export async function resolusiHostPublik(domain: string): Promise<HasilResolusiHost> {
  const host = normalisasiHostDomain(domain);
  if (!host) return { ok: false, error: "Domain bukan hostname publik yang sah." };

  const resolver = new Resolver({ timeout: 5000, tries: 1 });
  try {
    const [ipv4, ipv6] = await Promise.allSettled([
      resolver.resolve4(host),
      resolver.resolve6(host),
    ]);
    const alamat: AlamatHost[] = [];
    const terlihat = new Set<string>();

    if (ipv4.status === "fulfilled") {
      for (const nilai of ipv4.value) {
        if (terlihat.has(nilai)) continue;
        terlihat.add(nilai);
        alamat.push({ alamat: nilai, family: 4 });
      }
    }
    if (ipv6.status === "fulfilled") {
      for (const nilai of ipv6.value) {
        if (terlihat.has(nilai)) continue;
        terlihat.add(nilai);
        alamat.push({ alamat: nilai, family: 6 });
      }
    }

    if (alamat.length === 0) {
      return { ok: false, error: "Domain tidak dapat diresolusi." };
    }

    for (const item of alamat) {
      if (!klasifikasiAlamat(item.alamat).publik) {
        return { ok: false, error: "Domain menunjuk alamat internal." };
      }
    }

    return { ok: true, alamat };
  } finally {
    resolver.cancel();
  }
}
