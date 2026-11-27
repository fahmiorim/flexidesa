import type { Metadata } from "next";

import { listKeuangan } from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import { RincianAkunPage } from "@/features/keuangan-desa/keuangan/presentation/rincian-akun-page";

export const metadata: Metadata = { title: "Belanja Desa" };

export default async function BelanjaPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const params = await searchParams;
  const tahunParam = Number(params.tahun);
  const data = await listKeuangan(
    Number.isInteger(tahunParam) && tahunParam >= 2000 && tahunParam <= 2100
      ? tahunParam
      : undefined,
  );

  return (
    <RincianAkunPage
      akunKode="5"
      deskripsi="Rincian pagu dan realisasi belanja desa menurut bidang dan kegiatan."
      judul="Belanja Desa"
      labelKolom="bidang/kegiatan belanja"
      rows={data.rows}
      tahun={data.tahun}
      tersedia={data.tersedia}
    />
  );
}
