import "server-only";

import { alamatCocokTarget, klasifikasiDns, type DataDns } from "../domain/status-dns";
import { alamatServerPlatform, resolusiHostPublik } from "./pemeriksa-host";

/** Batas panjang kolom `domain_dns_checks.error`. */
const MAKS_PESAN = 255;

function pesanBukanServerPlatform(addresses: readonly string[], target: readonly string[]): string {
  const pesan = `Domain mengarah ke ${addresses.slice(0, 2).join(", ")}, bukan server platform (${target
    .slice(0, 2)
    .join(", ")}).`;
  return pesan.slice(0, MAKS_PESAN);
}

/**
 * Periksa DNS nyata untuk satu domain dan kembalikan hasil siap disimpan.
 *
 * `target` adalah alamat IP server platform. Bila tidak diberikan, acuan dibaca
 * dari konfigurasi (`PLATFORM_SERVER_IPS`) atau resolusi domain induk. Acuan
 * kosong berarti target tidak diketahui; status hanya menilai alamat publik.
 * Pemeriksaan massal mengirim `target` agar resolusi acuan cukup sekali.
 */
export async function periksaDnsDomain(
  domain: string,
  target?: readonly string[],
): Promise<DataDns> {
  const checkedAt = new Date();
  const acuan = target ?? (await alamatServerPlatform());
  const hasil = await resolusiHostPublik(domain);

  if (!hasil.ok) {
    return {
      status: "bermasalah",
      addresses: [],
      error: hasil.error,
      checkedAt,
    };
  }

  const addresses = hasil.alamat.map((item) => item.alamat);
  const cocok = alamatCocokTarget(addresses, acuan);

  return {
    status: klasifikasiDns({ addresses, semuaPublik: true, target: acuan }),
    addresses,
    error: cocok ? null : pesanBukanServerPlatform(addresses, acuan),
    checkedAt,
  };
}
