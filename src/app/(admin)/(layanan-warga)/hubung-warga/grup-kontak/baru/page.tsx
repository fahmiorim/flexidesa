import { type Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

import { village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

import { simpanGrupKontakAction } from "./actions";

export const metadata: Metadata = { title: "Tambah Grup Kontak" };

export default async function TambahGrupPage() {
  await village(KONTAK_GRUP_RESOURCE, "create");

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Tambah Grup Kontak"
        deskripsi="Formulir untuk menambah grup kontak baru."
      />
      <Card variant="panel">
        <CardHeader title="Tambah Grup Kontak" />
        <CardBody>
          <form action={simpanGrupKontakAction} className="space-y-4">
            <FormField
              name="namaGrup"
              label="Nama Grup"
              placeholder="Nama grup kontak"
              defaultValue=""
              required
            />
            <FormField
              name="keterangan"
              label="Keterangan"
              kind="textarea"
              placeholder="Keterangan grup"
              defaultValue=""
            />
            <Button type="submit" variant="primary">Simpan</Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}