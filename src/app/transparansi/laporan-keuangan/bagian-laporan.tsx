import type { listLaporanDokumenApbdesPublik } from "@/features/keuangan-desa/keuangan/application/laporan-dokumen-publik-use-cases";
import type {
  getLaporanApbdesPublik,
  getLaporanTriwulanPublik,
} from "@/features/keuangan-desa/keuangan/application/laporan-publik-use-cases";

export type LaporanKeuangan = Awaited<ReturnType<typeof getLaporanApbdesPublik>>;
export type TriwulanKeuangan = Awaited<ReturnType<typeof getLaporanTriwulanPublik>>;
export type DokumenLaporan = Awaited<ReturnType<typeof listLaporanDokumenApbdesPublik>>[number];

export type Kuartal = { label: string; period: string; value: string };

export function persen(value: number) {
  return value.toLocaleString("id-ID", { maximumFractionDigits: 2 }) + "%";
}

export function tanggal(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Tanggal tidak tersedia"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}
