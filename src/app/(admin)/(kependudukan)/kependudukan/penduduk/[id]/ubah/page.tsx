import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { getPendudukFormData } from "@/features/kependudukan/penduduk/application/use-cases";
import { PENDUDUK_RESOURCE } from "@/features/kependudukan/penduduk/domain/penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { ubahPendudukAction } from "../../actions";
import { FormPenduduk } from "../../form-penduduk";

export const metadata: Metadata = {
  title: "Ubah Data Penduduk",
};

export default async function UbahPendudukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nomor = Number(id);

  if (!Number.isInteger(nomor) || nomor <= 0) notFound();

  const user = await verifySession();
  if (!hasPermission(user.permissions, PENDUDUK_RESOURCE, "update")) notFound();

  const { references, penduduk } = await getPendudukFormData(nomor);
  if (!penduduk) notFound();

  return (
    <div className="modul-page penduduk-page data-kependudukan-page">
      <PageHeading
        judul={<>Ubah Data Penduduk</>}
        deskripsi={
          <>Perbarui biodata {penduduk.name}. Perubahan dicatat pada audit trail desa ini.</>
        }
      />

      <FormPenduduk
        aksi={ubahPendudukAction}
        labelKembali="← Kembali ke Detail Penduduk"
        penduduk={penduduk}
        references={references}
      />
    </div>
  );
}
