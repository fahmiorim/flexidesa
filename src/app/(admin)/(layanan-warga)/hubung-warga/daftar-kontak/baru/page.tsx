import { type Metadata } from "next";
import { KontakForm } from "../kontak-form";
import { simpanKontakAction } from "./actions";
import { formKontakUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

export const metadata: Metadata = { title: "Tambah Kontak" };

export default async function TambahKontakPage() {
  const { villageId } = await village(KONTAK_RESOURCE, "create");
  const { penduduk } = await formKontakUseCase(villageId);

  return (
    <KontakForm
      title="Tambah Kontak"
      description="Formulir untuk menambah kontak baru."
      action={simpanKontakAction}
      pendudukOptions={penduduk}
    />
  );
}