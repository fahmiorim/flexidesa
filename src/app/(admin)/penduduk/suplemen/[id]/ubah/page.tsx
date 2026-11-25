import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ubahSuplemenAction } from "@/app/(admin)/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import {
  getFormSuplemenData,
  getReferensiIsianSuplemenData,
} from "@/features/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/penduduk/domain/suplemen";
import { FormSuplemen } from "@/features/penduduk/presentation/form-suplemen";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Ubah Data Suplemen" };

export default async function UbahSuplemenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: mentah } = await params;
  const id = Number(mentah);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [user, data, referensi] = await Promise.all([
    verifySession(),
    getFormSuplemenData(id),
    getReferensiIsianSuplemenData(),
  ]);
  if (!hasPermission(user.permissions, SUPLEMEN_RESOURCE, "update")) notFound();

  const suplemen = data.suplemen;
  if (!suplemen || suplemen.id !== id) notFound();

  return (
    <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Ubah Data Suplemen</h1>
            <p>{suplemen.nama}</p>
          </div>
        </div>
      </PageHeading>

      <p className="suplemen-kembali">
        <Link href={`/penduduk/suplemen/${id}`}>← Rincian Data Suplemen</Link>
      </p>

      <section className="platform-card data-panel">
        <header>
          <h2>Form Data Suplemen</h2>
          <p>
            {suplemen.terdataCount > 0
              ? `Sudah ada ${suplemen.terdataCount} data terdata; sasaran dikunci agar data lama tetap konsisten.`
              : "Belum ada data terdata pada suplemen ini."}
          </p>
        </header>
        <FormSuplemen
          aksi={ubahSuplemenAction.bind(null, id)}
          awal={{
            nama: suplemen.nama,
            sasaran: suplemen.sasaran,
            keterangan: suplemen.keterangan ?? "",
            formIsian: suplemen.formIsian,
          }}
          kembaliHref={`/penduduk/suplemen/${id}`}
          referensi={Object.keys(referensi)}
          sasaranTerkunci={suplemen.terdataCount > 0}
        />
      </section>
    </div>
  );
}
