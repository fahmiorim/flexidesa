import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { getPengaturanSuratPageData } from "@/features/pelayanan-persuratan/surat/application/pengaturan-surat-use-cases";

import { PengaturanSuratForm } from "./pengaturan-surat-form";

export const metadata: Metadata = { title: "Pengaturan Surat" };

export default async function PengaturanSuratPage() {
  const { pengaturan, canManage, tte } = await getPengaturanSuratPageData();

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Pengaturan Surat</>}
        deskripsi={<>Atur kop, verifikasi, dan penomoran surat desa.</>}
        aksi={
          <>
            <div className="page-heading-actions">
              <Link
                className="button button-secondary"
                href="/layanan-surat/persuratan/jenis-surat"
              >
                Kembali ke Pengaturan Surat
              </Link>
            </div>
          </>
        }
      />

      <PengaturanSuratForm canManage={canManage} pengaturan={pengaturan} tte={tte} />
    </div>
  );
}
