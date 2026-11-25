/**
 * Aturan status DNS untuk domain tenant.
 *
 * Modul murni: hasil resolusi dan validasi alamat diberikan oleh infrastructure.
 * Hanya alamat publik yang dianggap normal agar host internal tidak pernah
 * dianggap sehat.
 */

export type StatusDns = "normal" | "bermasalah" | "belum-diperiksa";

export const LABEL_STATUS_DNS: Readonly<Record<StatusDns, string>> = {
  normal: "Normal",
  bermasalah: "Bermasalah",
  "belum-diperiksa": "Belum diperiksa",
};

export interface DataDns {
  status: StatusDns;
  addresses: string[];
  error: string | null;
  checkedAt: Date | null;
}

export const DNS_BELUM_DIPERIKSA: DataDns = {
  status: "belum-diperiksa",
  addresses: [],
  error: null,
  checkedAt: null,
};

/**
 * Apakah salah satu alamat hasil resolusi sama dengan acuan server platform.
 *
 * Acuan kosong berarti alamat platform tidak diketahui (mis. domain induk tidak
 * dapat diresolusi di lingkungan lokal); pemeriksaan target dilewati sehingga
 * tidak menggagalkan status.
 */
export function alamatCocokTarget(
  addresses: readonly string[],
  target: readonly string[],
): boolean {
  if (target.length === 0) return true;
  const acuan = new Set(target);
  return addresses.some((alamat) => acuan.has(alamat));
}

/**
 * Status normal hanya bila ada alamat, seluruhnya publik, dan (bila acuan
 * diketahui) salah satu alamat mengarah ke server platform.
 */
export function klasifikasiDns(input: {
  addresses: readonly string[];
  semuaPublik: boolean;
  error?: string | null;
  target?: readonly string[];
}): StatusDns {
  if (input.error) return "bermasalah";
  if (input.addresses.length === 0) return "bermasalah";
  if (!input.semuaPublik) return "bermasalah";
  return alamatCocokTarget(input.addresses, input.target ?? []) ? "normal" : "bermasalah";
}
