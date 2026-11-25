import { normalisasiDaftarHost, normalizeBaseDomain } from "@/features/desa/domain/host";

/**
 * Daftar origin yang dipercaya better-auth saat memeriksa asal permintaan.
 *
 * Aplikasi ini multi-tenant: login staf desa berjalan di host tenant
 * (`<slug>.<DESA_BASE_DOMAIN>`), sedangkan `BETTER_AUTH_URL` hanya satu origin
 * (biasanya host platform). Tanpa daftar tambahan, better-auth menolak setiap
 * POST `/api/auth/*` dari host tenant dengan `Invalid origin` sebelum kredensial
 * diperiksa sama sekali.
 *
 * Aturan yang dipakai:
 * - origin `APP_URL` dan `BETTER_AUTH_URL` selalu dipercaya;
 * - host platform (`PLATFORM_HOSTS`) dipercaya pada skema dan port yang sama;
 * - bila `DESA_BASE_DOMAIN` diisi, seluruh subdomainnya dipercaya lewat pola
 *   wildcard, bukan host dari header permintaan. Skema mengikuti `APP_URL` /
 *   `BETTER_AUTH_URL`, sehingga deployment produksi (keduanya `https`) tidak
 *   pernah menambahkan pola `http://`.
 */
export function asalTerdipercaya(config: {
  appUrl: string;
  authUrl: string;
  baseDomain?: string | null;
  platformHosts?: string | null;
}): string[] {
  const hasil = new Set<string>();
  const kombinasi: { protokol: string; port: string }[] = [];

  for (const nilai of [config.appUrl, config.authUrl]) {
    let url: URL;
    try {
      url = new URL(nilai);
    } catch {
      continue;
    }

    hasil.add(url.origin);
    if (!kombinasi.some((item) => item.protokol === url.protocol && item.port === url.port)) {
      kombinasi.push({ protokol: url.protocol, port: url.port });
    }
  }

  const baseDomain = normalizeBaseDomain(config.baseDomain);
  const hostPlatform = normalisasiDaftarHost(config.platformHosts);

  for (const { protokol, port } of kombinasi) {
    const akhiranPort = port ? `:${port}` : "";

    if (baseDomain) hasil.add(`${protokol}//*.${baseDomain}${akhiranPort}`);
    for (const host of hostPlatform) hasil.add(`${protokol}//${host}${akhiranPort}`);
  }

  return [...hasil];
}
