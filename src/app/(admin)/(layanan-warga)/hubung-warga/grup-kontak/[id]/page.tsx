import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

import { detailKontakGrupUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";

export const metadata: Metadata = { title: "Detail Grup Kontak" };

export default async function DetailGrupKontakPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id) || id <= 0) notFound();

  const { user, villageId } = await village(KONTAK_GRUP_RESOURCE, "read");
  const grup = await detailKontakGrupUseCase(villageId, id);

  if (!grup) notFound();

  const bisaUbah = hasPermission(user.permissions, KONTAK_GRUP_RESOURCE, "update");

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Detail Grup Kontak"
        deskripsi={`Informasi lengkap grup ${grup.namaGrup}.`}
        aksi={
          bisaUbah ? (
            <ButtonLink href={`/hubung-warga/grup-kontak/${id}/ubah`} variant="primary">
              Ubah Grup
            </ButtonLink>
          ) : undefined
        }
      />
      <Card variant="panel">
        <CardHeader title="Informasi Grup" />
        <CardBody className="space-y-4">
          <div>
            <span className="text-sm font-medium text-muted">Nama Grup</span>
            <p className="text-base font-semibold">{grup.namaGrup}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted">Keterangan</span>
            <p className="text-base">{grup.keterangan ?? "—"}</p>
          </div>
        </CardBody>
      </Card>
      <Card variant="panel">
        <CardHeader
          title="Anggota Grup"
          aksi={
            bisaUbah ? (
              <ButtonLink href={`/hubung-warga/grup-kontak/${id}/anggota`} variant="primary" size="sm">
                Kelola Anggota
              </ButtonLink>
            ) : undefined
          }
        />
        <CardBody>
          <p className="text-muted text-sm">Gunakan tombol &ldquo;Kelola Anggota&rdquo; untuk menambah, mengubah, atau menghapus anggota.</p>
        </CardBody>
      </Card>
    </main>
  );
}