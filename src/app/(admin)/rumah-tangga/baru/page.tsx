import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buatRumahTanggaAction } from "@/app/(admin)/rumah-tangga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { hasPermission } from "@/features/rbac/application/authorization";
import { getRumahTanggaReference } from "@/features/rumah-tangga/application/use-cases";
import { RUMAH_TANGGA_RESOURCE } from "@/features/rumah-tangga/domain/rumah-tangga";
import { verifySession } from "@/lib/dal";

import { FormRumahTangga } from "../form-rumah-tangga";
import styles from "../rumah-tangga.module.css";

export const metadata: Metadata = { title: "Tambah Rumah Tangga" };

export default async function RumahTanggaBaruPage() {
  const [user, reference] = await Promise.all([verifySession(), getRumahTanggaReference()]);
  if (!hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "create")) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/rumah-tangga">
        ← Kembali ke daftar rumah tangga
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Tambah Rumah Tangga</h1>
            <p>Buat rumah tangga baru (nomor RTM otomatis).</p>
          </div>
        </header>
      </PageHeading>
      <section className="platform-card data-panel">
        <header>
          <h2>Data Rumah Tangga</h2>
          <p>Alamat, wilayah, kelas sosial, BDT, dan kepala rumah tangga.</p>
        </header>
        <FormRumahTangga
          aksi={buatRumahTanggaAction}
          kembaliHref="/rumah-tangga"
          penduduk={reference.penduduk}
          regions={reference.regions}
        />
      </section>
    </div>
  );
}
