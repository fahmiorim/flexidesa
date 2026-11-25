import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buatKelompokAction } from "@/app/(admin)/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import {
  getPendudukKelompok,
  getReferensiKelompok,
} from "@/features/kelompok/application/use-cases";
import { KELOMPOK_RESOURCE } from "@/features/kelompok/domain/kelompok";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { FormKelompok } from "../form-kelompok";
import styles from "../kelompok.module.css";

export const metadata: Metadata = { title: "Tambah Kelompok" };

export default async function KelompokBaruPage() {
  const [user, referensi, penduduk] = await Promise.all([
    verifySession(),
    getReferensiKelompok(null),
    getPendudukKelompok(),
  ]);
  if (!hasPermission(user.permissions, KELOMPOK_RESOURCE, "create")) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/kelompok">
        ← Kembali ke daftar kelompok
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Tambah Kelompok</h1>
            <p>Slug dibuat otomatis dari nama. Ketua dipilih dari penduduk desa.</p>
          </div>
        </header>
      </PageHeading>
      <section className="platform-card data-panel">
        <header>
          <h2>Data Kelompok</h2>
          <p>Nama, kode, nomor SK pendirian, kategori, ketua, dan deskripsi.</p>
        </header>
        <FormKelompok
          aksi={buatKelompokAction}
          kembaliHref="/kelompok"
          kategori={referensi.kategori}
          penduduk={penduduk}
        />
      </section>
    </div>
  );
}
