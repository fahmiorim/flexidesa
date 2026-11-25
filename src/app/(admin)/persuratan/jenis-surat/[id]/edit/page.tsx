import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { getJenisSuratEditorData } from "@/features/surat/application/jenis-surat-use-cases";

import { JenisSuratForm } from "../../jenis-surat-form";

export const metadata: Metadata = { title: "Edit Jenis Surat" };
export default async function EditJenisSuratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const { jenis, klasifikasi, syarat, canDelete } = await getJenisSuratEditorData(id);
  return (
    <div className="modul-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Kelola {jenis?.name}</h1>
            <p>Ubah template surat untuk penerbitan berikutnya.</p>
          </div>
          <Link href="/persuratan/jenis-surat" className="button button-secondary">
            ← Kembali
          </Link>
        </div>
      </PageHeading>
      <JenisSuratForm
        jenis={jenis}
        klasifikasi={klasifikasi}
        syarat={syarat}
        canDelete={canDelete}
      />
    </div>
  );
}
