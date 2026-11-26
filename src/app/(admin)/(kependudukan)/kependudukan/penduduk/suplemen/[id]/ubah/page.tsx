import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ubahSuplemenAction } from "@/app/(admin)/(kependudukan)/kependudukan/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import {
  getFormSuplemenData,
  getReferensiIsianSuplemenData,
} from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/kependudukan/penduduk/domain/suplemen";
import { FormSuplemen } from "@/features/kependudukan/penduduk/presentation/form-suplemen";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
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
      <PageHeading judul={<>Ubah Data Suplemen</>} deskripsi={<>{suplemen.nama}</>} />

      <p className="suplemen-kembali">
        <Link href={`/kependudukan/penduduk/suplemen/${id}`}>← Rincian Data Suplemen</Link>
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
          kembaliHref={`/kependudukan/penduduk/suplemen/${id}`}
          referensi={Object.keys(referensi)}
          sasaranTerkunci={suplemen.terdataCount > 0}
        />
      </section>
    </div>
  );
}
