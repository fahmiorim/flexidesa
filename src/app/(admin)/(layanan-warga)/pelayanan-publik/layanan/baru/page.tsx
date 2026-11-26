import { getLayananEditorData } from "@/features/layanan-warga/pelayanan/application/layanan-use-cases";

import { LayananForm } from "../layanan-form";

export const metadata = { title: "Tambah Layanan" };
export default async function Page() {
  await getLayananEditorData();
  return <LayananForm />;
}
