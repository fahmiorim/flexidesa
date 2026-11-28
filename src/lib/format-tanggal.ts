/**
 * Format tanggal & angka halaman (id-ID).
 *
 * `formatTanggal`: tanggal panjang ("26 November 2026"); nilai kosong atau
 * tidak valid → "—". String tanggal-saja (`YYYY-MM-DD`) dibaca sebagai
 * tengah malam lokal agar tidak bergeser hari karena zona UTC.
 * Varian domain dengan semantik lain (kembalikan input, `""`, `null`,
 * preset surat, zona UTC eksplisit) tetap tinggal di modul domain-nya.
 */
export function formatTanggal(value: Date | string | null | undefined): string {
  if (!value) return "—";
  let tanggal: Date;
  if (value instanceof Date) {
    tanggal = value;
  } else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    tanggal = new Date(`${value.slice(0, 10)}T00:00:00`);
  } else {
    tanggal = new Date(value);
  }
  if (Number.isNaN(tanggal.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tanggal);
}

/** Angka dengan pemisah ribuan id-ID. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}
