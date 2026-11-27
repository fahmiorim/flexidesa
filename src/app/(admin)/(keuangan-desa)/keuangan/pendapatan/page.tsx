import type { Metadata } from "next";

import { listKeuangan } from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import { RincianAkunPage } from "@/features/keuangan-desa/keuangan/presentation/rincian-akun-page";

export const metadata: Metadata = { title: "Pendapatan Desa" };

export default async function PendapatanPage({
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
      akunKode="4"
      deskripsi="Rincian rencana dan realisasi pendapatan desa menurut rekening APBDes."
      judul="Pendapatan Desa"
      labelKolom="rekening pendapatan"
      rows={data.rows}
      tahun={data.tahun}
      tersedia={data.tersedia}
    />
  );
}
