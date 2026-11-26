import "server-only";

import {
  getStatistikDesa,
  type StatistikDesa,
} from "@/features/info-desa/desa/application/statistik-desa";
import { getLaporanApbdesPublik } from "@/features/keuangan-desa/keuangan/application/laporan-publik-use-cases";
import { getRingkasanBantuanPublik } from "@/features/program-data-desa/bantuan/application/kontrak";

/**
 * Statistik lengkap untuk halaman publik `/desa/statistik`.
 *
 * Menggabungkan data kependudukan, bantuan, dan ringkasan APBDes. Semua query
 * dibatasi `villageId` dari host; fungsi ini tidak memerlukan sesi.
 */
export interface StatistikPublik extends StatistikDesa {
  bantuan: { program: number; peserta: number };
  keuangan: {
    tahun: number;
    pendapatan: string;
    belanja: string;
    realisasiBelanja: string;
  };
  /** Realisasi per triwulan. */
  periode: { triwulan: number; label: string; realisasi: string; persen: number }[];
}

export async function getStatistikPublik(villageId: number): Promise<StatistikPublik> {
  const [statistik, bantuan, laporan] = await Promise.all([
    getStatistikDesa(villageId),
    getRingkasanBantuanPublik(villageId),
    getLaporanApbdesPublik(villageId),
  ]);

  const pendapatan = laporan.baris.find((row) => row.kode === "4");
  const belanja = laporan.baris.find((row) => row.kode === "5");

  return {
    ...statistik,
    bantuan,
    keuangan: {
      tahun: laporan.tahun,
      pendapatan: pendapatan?.anggaran ?? "0.00",
      belanja: belanja?.anggaran ?? "0.00",
      realisasiBelanja: belanja?.realisasi ?? "0.00",
    },
    periode: laporan.periode ?? [],
  };
}
