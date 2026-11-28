import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

import { detailKontakGrupUseCase, formKontakUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

import { tambahAnggotaGrupAction } from "./actions";

export const metadata: Metadata = { title: "Tambah Anggota" };

export default async function TambahAnggotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id) || id <= 0) notFound();

  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "update");
  const grup = await detailKontakGrupUseCase(villageId, id);

  if (!grup) notFound();

  const { penduduk } = await formKontakUseCase(villageId);

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Tambah Anggota Grup"
        deskripsi={`Tambah anggota ke grup "${grup.namaGrup}".`}
      />
      <Card variant="panel">
        <CardHeader title="Tambah Anggota" />
        <CardBody>
          <form action={tambahAnggotaGrupAction} className="space-y-4">
            <input type="hidden" name="grupId" value={id} />
            <FormField
              name="kontakId"
              label="Pilih Kontak"
              kind="select"
              options={[
                { value: "", label: "Pilih kontak", disabled: true },
                ...penduduk.map((p) => ({ value: String(p.id), label: p.nama })),
              ]}
              defaultValue=""
              required
            />
            <FormField
              name="peran"
              label="Peran (opsional)"
              placeholder="Contoh: Ketua, Sekretaris, Anggota"
              defaultValue=""
            />
            <FormField
              name="keterangan"
              label="Keterangan"
              kind="textarea"
              placeholder="Keterangan tambahan"
              defaultValue=""
            />
            <Button type="submit" variant="primary">Tambah</Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}