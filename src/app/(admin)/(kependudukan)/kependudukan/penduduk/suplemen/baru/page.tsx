import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buatSuplemenAction } from "@/app/(admin)/(kependudukan)/kependudukan/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { getReferensiIsianSuplemenData } from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/kependudukan/penduduk/domain/suplemen";
import { FormSuplemen } from "@/features/kependudukan/penduduk/presentation/form-suplemen";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Tambah Data Suplemen" };

export default async function TambahSuplemenPage() {
  const [user, referensi] = await Promise.all([verifySession(), getReferensiIsianSuplemenData()]);
  if (!hasPermission(user.permissions, SUPLEMEN_RESOURCE, "update")) notFound();

  return (
    <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
      <PageHeading
        judul={<>Tambah Data Suplemen</>}
        deskripsi={<>Buat data suplemen penduduk baru.</>}
      />

      <section className="platform-card data-panel">
        <header>
          <h2>Form Data Suplemen</h2>
          <p>Kolom bertanda wajib harus diisi sebelum data disimpan.</p>
        </header>
        <FormSuplemen
          aksi={buatSuplemenAction}
          awal={null}
          kembaliHref="/kependudukan/penduduk/suplemen"
          labelKembali="← Daftar Data Suplemen"
          referensi={Object.keys(referensi)}
          sasaranTerkunci={false}
        />
      </section>
    </div>
  );
}
