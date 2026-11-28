import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

import { detailKontakGrupUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

import { ubahGrupKontakAction } from "./actions";

export const metadata: Metadata = { title: "Ubah Grup Kontak" };

export default async function UbahGrupKontakPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id) || id <= 0) notFound();

  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "update");
  const grup = await detailKontakGrupUseCase(villageId, id);

  if (!grup) notFound();

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Ubah Grup Kontak"
        deskripsi="Formulir untuk mengubah data grup kontak."
      />
      <Card variant="panel">
        <CardHeader title="Ubah Grup Kontak" />
        <CardBody>
          <form action={ubahGrupKontakAction} className="space-y-4">
            <input type="hidden" name="id" value={grup.id} />
            <FormField
              name="namaGrup"
              label="Nama Grup"
              placeholder="Nama grup kontak"
              defaultValue={grup.namaGrup}
              required
            />
            <FormField
              name="keterangan"
              label="Keterangan"
              kind="textarea"
              placeholder="Keterangan grup"
              defaultValue={grup.keterangan ?? ""}
            />
            <Button type="submit" variant="primary">Simpan</Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}