import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buatSuplemenAction } from "@/app/(admin)/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { getReferensiIsianSuplemenData } from "@/features/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/penduduk/domain/suplemen";
import { FormSuplemen } from "@/features/penduduk/presentation/form-suplemen";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Tambah Data Suplemen" };

export default async function TambahSuplemenPage() {
  const [user, referensi] = await Promise.all([verifySession(), getReferensiIsianSuplemenData()]);
  if (!hasPermission(user.permissions, SUPLEMEN_RESOURCE, "update")) notFound();

  return (
    <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Tambah Data Suplemen</h1>
            <p>Buat data suplemen penduduk baru.</p>
          </div>
        </div>
      </PageHeading>

      <p className="suplemen-kembali">
        <Link href="/penduduk/suplemen">← Daftar Data Suplemen</Link>
      </p>

      <section className="platform-card data-panel">
        <header>
          <h2>Form Data Suplemen</h2>
          <p>Kolom bertanda wajib harus diisi sebelum data disimpan.</p>
        </header>
        <FormSuplemen
          aksi={buatSuplemenAction}
          awal={null}
          kembaliHref="/penduduk/suplemen"
          referensi={Object.keys(referensi)}
          sasaranTerkunci={false}
        />
      </section>
    </div>
  );
}
