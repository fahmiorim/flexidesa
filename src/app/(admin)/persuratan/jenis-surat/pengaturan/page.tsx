import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { getPengaturanSuratPageData } from "@/features/surat/application/pengaturan-surat-use-cases";

import { PengaturanSuratForm } from "./pengaturan-surat-form";

export const metadata: Metadata = { title: "Pengaturan Surat" };

export default async function PengaturanSuratPage() {
  const { pengaturan, canManage, tte } = await getPengaturanSuratPageData();

  return (
    <div className="modul-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Pengaturan Surat</h1>
            <p>Atur kop, verifikasi, dan penomoran surat desa.</p>
          </div>
          <div className="page-heading-actions">
            <Link className="button button-secondary" href="/persuratan/jenis-surat">
              Kembali ke Pengaturan Surat
            </Link>
          </div>
        </div>
      </PageHeading>

      <PengaturanSuratForm canManage={canManage} pengaturan={pengaturan} tte={tte} />
    </div>
  );
}
