import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { imporTerdataAction } from "@/app/(admin)/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import {
  getFormSuplemenData,
  labelSasaranSuplemen,
} from "@/features/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/penduduk/domain/suplemen";
import { FormImporTerdata } from "@/features/penduduk/presentation/form-impor-terdata";
import { hasPermission } from "@/features/rbac/application/authorization";
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

  const rincianHref = `/penduduk/suplemen/${id}`;

  return (
    <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Impor Data Suplemen</h1>
            <p>
              {suplemen.nama} · sasaran {labelSasaranSuplemen(suplemen.sasaran)}
            </p>
          </div>
        </div>
      </PageHeading>

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
          templateHref={`/penduduk/suplemen/${id}/impor/template`}
        />
      </section>
    </div>
  );
}
