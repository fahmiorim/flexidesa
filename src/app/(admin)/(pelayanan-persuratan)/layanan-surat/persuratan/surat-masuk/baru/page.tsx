import type { Metadata } from "next";

import { getBukuAgendaEditorData } from "@/features/pelayanan-persuratan/surat/application/buku-agenda-use-cases";

import { simpanSuratMasukAction } from "../../buku-agenda-actions";
import { BukuAgendaForm } from "../../buku-agenda-form";

export const metadata: Metadata = { title: "Surat Masuk Baru" };

export default async function BaruSuratMasukPage() {
  const { klasifikasi } = await getBukuAgendaEditorData("masuk");
  return <BukuAgendaForm jenis="masuk" klasifikasi={klasifikasi} action={simpanSuratMasukAction} />;
}
