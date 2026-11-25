import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { hasPermission } from "@/features/rbac/application/authorization";
import { RUMAH_TANGGA_RESOURCE } from "@/features/rumah-tangga/domain/rumah-tangga";
import { verifySession } from "@/lib/dal";

import styles from "../rumah-tangga.module.css";
import { FormImporRtm } from "./form-impor";

export const metadata: Metadata = { title: "Impor Rumah Tangga" };

export default async function ImporRumahTanggaPage() {
  const user = await verifySession();
  if (!hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "create")) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/rumah-tangga">
        ← Kembali ke daftar rumah tangga
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Impor Rumah Tangga</h1>
            <p>Tautkan penduduk ke rumah tangga lewat NIK dan nomor RTM.</p>
          </div>
          <div className="page-heading-actions">
            <Link className="button button-secondary" href="/rumah-tangga/impor/template">
              Unduh Template CSV
            </Link>
          </div>
        </header>
      </PageHeading>

      <section className="platform-card data-panel">
        <header>
          <h2>Berkas Impor</h2>
          <p>
            Format .xlsx/.csv maks. 5 MB. Impor semua-atau-tidak: satu baris salah membatalkan
            semua.
          </p>
        </header>
        <FormImporRtm />
      </section>
    </div>
  );
}
