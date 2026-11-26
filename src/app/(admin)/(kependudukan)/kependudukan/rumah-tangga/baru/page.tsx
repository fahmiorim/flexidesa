import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buatRumahTanggaAction } from "@/app/(admin)/(kependudukan)/kependudukan/rumah-tangga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { getRumahTanggaReference } from "@/features/kependudukan/rumah-tangga/application/use-cases";
import { RUMAH_TANGGA_RESOURCE } from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { FormRumahTangga } from "../form-rumah-tangga";
import styles from "../rumah-tangga.module.css";

export const metadata: Metadata = { title: "Tambah Rumah Tangga" };

export default async function RumahTanggaBaruPage() {
  const [user, reference] = await Promise.all([verifySession(), getRumahTanggaReference()]);
  if (!hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "create")) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/kependudukan/rumah-tangga">
        ← Kembali ke daftar rumah tangga
      </Link>
      <PageHeading
        judul={<>Tambah Rumah Tangga</>}
        deskripsi={<>Buat rumah tangga baru (nomor RTM otomatis).</>}
      />
      <section className="platform-card data-panel">
        <header>
          <h2>Data Rumah Tangga</h2>
          <p>Alamat, wilayah, kelas sosial, BDT, dan kepala rumah tangga.</p>
        </header>
        <FormRumahTangga
          aksi={buatRumahTanggaAction}
          kembaliHref="/kependudukan/rumah-tangga"
          penduduk={reference.penduduk}
          regions={reference.regions}
        />
      </section>
    </div>
  );
}
