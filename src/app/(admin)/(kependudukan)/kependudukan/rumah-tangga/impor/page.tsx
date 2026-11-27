import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { RUMAH_TANGGA_RESOURCE } from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../rumah-tangga.module.css";
import { FormImporRtm } from "./form-impor";

export const metadata: Metadata = { title: "Impor Rumah Tangga" };

export default async function ImporRumahTanggaPage() {
  const user = await verifySession();
  if (!hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "create")) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/kependudukan/rumah-tangga">
        ← Kembali ke daftar rumah tangga
      </Link>
      <PageHeading
        judul={<>Impor Rumah Tangga</>}
        deskripsi={<>Tautkan penduduk ke rumah tangga lewat NIK dan nomor RTM.</>}
        aksi={
          <>
            <div className="page-heading-actions">
              <ButtonLink variant="secondary" href="/kependudukan/rumah-tangga/impor/template">
                Unduh Template CSV
              </ButtonLink>
            </div>
          </>
        }
      />

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
