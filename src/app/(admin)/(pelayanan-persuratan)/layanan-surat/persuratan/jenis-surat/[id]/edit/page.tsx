import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { getJenisSuratEditorData } from "@/features/pelayanan-persuratan/surat/application/jenis-surat-use-cases";

import { JenisSuratForm } from "../../jenis-surat-form";

export const metadata: Metadata = { title: "Edit Jenis Surat" };
export default async function EditJenisSuratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const { jenis, klasifikasi, syarat, canDelete } = await getJenisSuratEditorData(id);
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Kelola {jenis?.name}</>}
        deskripsi={<>Ubah template surat untuk penerbitan berikutnya.</>}
      />
      <JenisSuratForm
        jenis={jenis}
        klasifikasi={klasifikasi}
        syarat={syarat}
        canDelete={canDelete}
      />
    </div>
  );
}
