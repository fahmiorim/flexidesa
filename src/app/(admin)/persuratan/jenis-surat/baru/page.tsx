import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { getJenisSuratEditorData } from "@/features/surat/application/jenis-surat-use-cases";

import { JenisSuratForm } from "../jenis-surat-form";

export const metadata: Metadata = { title: "Tambah Jenis Surat" };
export default async function BaruJenisSuratPage() {
  const { klasifikasi, syarat } = await getJenisSuratEditorData();
  return (
    <div className="modul-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Tambah Jenis Surat</h1>
            <p>Buat jenis surat baru beserta template-nya.</p>
          </div>
          <Link href="/persuratan/jenis-surat" className="button button-secondary">
            ← Kembali
          </Link>
        </div>
      </PageHeading>
      <JenisSuratForm jenis={null} klasifikasi={klasifikasi} syarat={syarat} />
    </div>
  );
}
