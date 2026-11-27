import { queryStatistikDesa } from "@/features/info-desa/desa/infrastructure/statistik-desa-repository";

/**
 * Statistik ringkas desa untuk situs publik.
 *
 * Semua query dibatasi `villageId` dari host sehingga satu basis kode dapat
 * melayani banyak desa tanpa kebocoran data antar-tenant.
 */
export interface StatistikDesa {
  total: number;
  lakiLaki: number;
  perempuan: number;
  keluarga: number;
  perDusun: { label: string; total: number; keluarga: number }[];
}

export async function getStatistikDesa(villageId: number): Promise<StatistikDesa> {
  const { ringkas, keluarga, perDusun } = await queryStatistikDesa(villageId);

  return {
    total: ringkas?.total ?? 0,
    lakiLaki: Number(ringkas?.lakiLaki ?? 0),
    perempuan: Number(ringkas?.perempuan ?? 0),
    keluarga,
    perDusun: perDusun.map((row) => ({
      label: row.dusun?.trim() || "Belum diisi",
      total: row.total,
      keluarga: row.keluarga,
    })),
  };
}
