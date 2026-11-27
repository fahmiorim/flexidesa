import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { getJenisSuratEditorData } from "@/features/pelayanan-persuratan/surat/application/jenis-surat-use-cases";

import { JenisSuratForm } from "../jenis-surat-form";

export const metadata: Metadata = { title: "Tambah Jenis Surat" };
export default async function BaruJenisSuratPage() {
  const { klasifikasi, syarat } = await getJenisSuratEditorData();
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Tambah Jenis Surat</>}
        deskripsi={<>Buat jenis surat baru beserta template-nya.</>}
      />
      <JenisSuratForm jenis={null} klasifikasi={klasifikasi} syarat={syarat} />
    </div>
  );
}
