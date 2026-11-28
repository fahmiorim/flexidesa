import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { detailKontakUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";

export const metadata: Metadata = { title: "Detail Kontak" };

export default async function DetailKontakPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id) || id <= 0) notFound();

  const { user, villageId } = await village(KONTAK_RESOURCE, "read");
  const kontak = await detailKontakUseCase(villageId, id);

  if (!kontak) notFound();

  const bisaUbah = hasPermission(user.permissions, KONTAK_RESOURCE, "update");

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Detail Kontak"
        deskripsi={`Informasi lengkap kontak ${kontak.nama}.`}
        aksi={
          bisaUbah ? (
            <ButtonLink href={`/hubung-warga/daftar-kontak/${kontak.id}/ubah`} variant="primary">
              Ubah Kontak
            </ButtonLink>
          ) : undefined
        }
      />
      <Card variant="panel">
        <CardHeader title="Informasi Kontak" />
        <CardBody className="space-y-4">
          <div>
            <span className="text-sm font-medium text-muted">Nama</span>
            <p className="text-base font-semibold">{kontak.nama}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted">Tautan Penduduk</span>
            <p className="text-base">{kontak.namaPenduduk ?? "Tidak ditautkan"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted">Cara Hubung</span>
            <p className="text-base">{kontak.hubungWarga}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted">Telepon</span>
            <p className="text-base">{kontak.telepon ?? "—"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted">Email</span>
            <p className="text-base">{kontak.email ?? "—"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted">Telegram</span>
            <p className="text-base">{kontak.telegram ?? "—"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted">Keterangan</span>
            <p className="text-base">{kontak.keterangan ?? "—"}</p>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}