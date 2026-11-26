import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { imporTerdataAction } from "@/app/(admin)/(kependudukan)/kependudukan/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import {
  getFormSuplemenData,
  labelSasaranSuplemen,
} from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/kependudukan/penduduk/domain/suplemen";
import { FormImporTerdata } from "@/features/kependudukan/penduduk/presentation/form-impor-terdata";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Impor Data Suplemen" };

export default async function ImporSuplemenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: mentah } = await params;
  const id = Number(mentah);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [user, data] = await Promise.all([verifySession(), getFormSuplemenData(id)]);
  if (!hasPermission(user.permissions, SUPLEMEN_RESOURCE, "update")) notFound();

  const suplemen = data.suplemen;
  if (!suplemen || suplemen.id !== id) notFound();

  const rincianHref = `/kependudukan/penduduk/suplemen/${id}`;

  return (
    <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
      <PageHeading
        judul={<>Impor Data Suplemen</>}
        deskripsi={
          <>
            {suplemen.nama} · sasaran {labelSasaranSuplemen(suplemen.sasaran)}
          </>
        }
      />

      <p className="suplemen-kembali">
        <Link href={rincianHref}>← Daftar Terdata Suplemen</Link>
      </p>

      <section className="platform-card data-panel">
        <header>
          <h2>Impor Peserta</h2>
          <p>Hanya data yang belum terdata yang akan ditambahkan.</p>
        </header>
        <FormImporTerdata
          aksi={imporTerdataAction}
          kembaliHref={rincianHref}
          suplemenId={id}
          templateHref={`/kependudukan/penduduk/suplemen/${id}/impor/template`}
        />
      </section>
    </div>
  );
}
