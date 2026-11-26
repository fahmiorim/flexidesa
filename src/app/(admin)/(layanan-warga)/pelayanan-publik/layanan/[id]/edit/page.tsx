import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLayananEditorData } from "@/features/layanan-warga/pelayanan/application/layanan-use-cases";

import { LayananForm } from "../../layanan-form";

export const metadata: Metadata = { title: "Ubah Layanan" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const p = await params,
    id = Number(p.id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const row = await getLayananEditorData(id);
  return <LayananForm row={row} />;
}
