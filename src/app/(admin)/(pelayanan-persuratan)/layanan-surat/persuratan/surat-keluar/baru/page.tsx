import type { Metadata } from "next";

import { getBukuAgendaEditorData } from "@/features/pelayanan-persuratan/surat/application/buku-agenda-use-cases";

import { simpanSuratKeluarAction } from "../../buku-agenda-actions";
import { BukuAgendaForm } from "../../buku-agenda-form";

export const metadata: Metadata = { title: "Surat Keluar Baru" };

export default async function BaruSuratKeluarPage() {
  const { klasifikasi } = await getBukuAgendaEditorData("keluar");
  return (
    <BukuAgendaForm jenis="keluar" klasifikasi={klasifikasi} action={simpanSuratKeluarAction} />
  );
}
