import type { Metadata } from "next";

import { listKeuangan } from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import { RincianAkunPage } from "@/features/keuangan-desa/keuangan/presentation/rincian-akun-page";

export const metadata: Metadata = { title: "Pembiayaan Desa" };

export default async function PembiayaanPage({
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
      akunKode="6"
      deskripsi="Rincian penerimaan dan pengeluaran pembiayaan desa pada tahun anggaran."
      judul="Pembiayaan Desa"
      labelKolom="rekening pembiayaan"
      rows={data.rows}
      tahun={data.tahun}
      tersedia={data.tersedia}
    />
  );
}
