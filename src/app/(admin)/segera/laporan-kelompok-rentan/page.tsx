import { redirect } from "next/navigation";

/**
 * Alias lama modul laporan kelompok rentan.
 *
 * Tenant yang dibuat sebelum modul ini punya halaman masih menyimpan URL
 * `/segera/laporan-kelompok-rentan`; rute kanonisnya kini di Statistik.
 */
export default function SegeraLaporanKelompokRentanPage() {
  redirect("/kependudukan/kelompok-rentan");
}
