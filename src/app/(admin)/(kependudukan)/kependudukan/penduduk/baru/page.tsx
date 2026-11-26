import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { getPendudukFormData } from "@/features/kependudukan/penduduk/application/use-cases";
import { PENDUDUK_RESOURCE } from "@/features/kependudukan/penduduk/domain/penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { buatPendudukAction } from "../actions";
import { FormPenduduk } from "../form-penduduk";

export const metadata: Metadata = {
  title: "Tambah Penduduk",
};

export default async function TambahPendudukPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await verifySession();
  if (!hasPermission(user.permissions, PENDUDUK_RESOURCE, "update")) notFound();

  const params = await searchParams;
  const familyRaw = typeof params.familyId === "string" ? Number(params.familyId) : null;
  const familyId =
    familyRaw !== null && Number.isInteger(familyRaw) && familyRaw > 0 ? familyRaw : null;
  const { references } = await getPendudukFormData();
  if (familyId !== null && !references.families.some((item) => item.id === familyId)) notFound();

  return (
    <div className="modul-page penduduk-page data-kependudukan-page">
      <PageHeading
        judul={<>Tambah Penduduk</>}
        deskripsi={<>Catat biodata penduduk baru pada desa ini.</>}
      />

      <FormPenduduk
        aksi={buatPendudukAction}
        familyId={familyId}
        labelKembali="← Kembali ke Data Penduduk"
        references={references}
      />
    </div>
  );
}
