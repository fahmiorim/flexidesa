import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { KontakForm } from "../../kontak-form";
import { ubahKontakAction } from "./actions";
import { formKontakUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

export const metadata: Metadata = { title: "Ubah Kontak" };

export default async function UbahKontakPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id) || id <= 0) notFound();

  const { villageId } = await village(KONTAK_RESOURCE, "update");
  const { kontak, penduduk } = await formKontakUseCase(villageId, id);

  if (!kontak) notFound();

  return (
    <KontakForm
      title="Ubah Kontak"
      description="Formulir untuk mengubah data kontak."
      action={ubahKontakAction}
      initialData={{
        id: kontak.id,
        nama: kontak.nama,
        residentId: kontak.residentId,
        telepon: kontak.telepon ?? undefined,
        email: kontak.email ?? undefined,
        telegram: kontak.telegram ?? undefined,
        hubungWarga: kontak.hubungWarga ?? "Telegram",
        keterangan: kontak.keterangan ?? undefined,
      }}
      pendudukOptions={penduduk}
    />
  );
}