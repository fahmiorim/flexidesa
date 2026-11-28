import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

import { detailAnggotaGrupUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

import { ubahAnggotaGrupAction } from "./actions";

export const metadata: Metadata = { title: "Ubah Anggota" };

export default async function UbahAnggotaPage({
  params,
}: { params: Promise<{ id: string; anggotaId: string }> }) {
  const { id: idStr, anggotaId: anggotaIdStr } = await params;
  const id = Number(idStr);
  const anggotaId = Number(anggotaIdStr);
  if (Number.isNaN(id) || id <= 0 || Number.isNaN(anggotaId) || anggotaId <= 0) notFound();

  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "update");
  const anggota = await detailAnggotaGrupUseCase(villageId, anggotaId);

  if (!anggota || anggota.grupId !== id) notFound();

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Ubah Peran Anggota"
        deskripsi="Formulir untuk mengubah peran anggota grup."
      />
      <Card variant="panel">
        <CardHeader title="Ubah Peran Anggota" />
        <CardBody>
          <form action={ubahAnggotaGrupAction} className="space-y-4">
            <input type="hidden" name="anggotaId" value={anggota.id} />
            <input type="hidden" name="grupId" value={id} />
            <FormField
              name="peran"
              label="Peran"
              placeholder="Contoh: Ketua, Sekretaris, Anggota"
              defaultValue={anggota.peran ?? ""}
            />
            <Button type="submit" variant="primary">Simpan</Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}